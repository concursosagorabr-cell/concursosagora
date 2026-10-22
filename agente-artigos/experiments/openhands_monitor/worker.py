"""Trabalhador OpenHands opcional para classificar um ``change-report.json``.

Ele NÃO navega na web, NÃO executa terminal e NÃO escreve no Sanity. Recebe
apenas o diff e o snapshot já baixados pelo monitor determinístico. A resposta
é forçada para o schema ``ResearchReport`` e depois validada por
``validate_report_data``.

Instale o SDK em um venv separado (o venv do pipeline não precisa dele):

    python -m venv .venv-openhands
    .venv-openhands\\Scripts\\pip install -r experiments/openhands_monitor/requirements-openhands.txt
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

from .io_utils import read_json, write_json
from .validate import resolve_snapshot_path, validate_report_data


SYSTEM_PROMPT = """Você é um analista de retificações de concursos públicos.
Receba o texto novo de uma fonte oficial e o diff determinístico. Sua tarefa é
classificar a mudança, sem inventar nada.

Regras obrigatórias:
- Use somente o texto e o diff fornecidos. Não use conhecimento externo.
- Toda quote precisa ser cópia literal do texto novo, preservando acentos.
- Se um valor não estiver comprovado, use status "missing".
- Se duas passagens divergirem, registre em conflicts e não escolha sozinho.
- Não proponha publicação, não escreva no Sanity e não renomeie IDs/slugs.
- O relatório sempre exige revisão humana.
"""


def build_prompt(report: dict, snapshot: dict, max_chars: int = 80_000) -> str:
    text = str(snapshot.get("text") or "")
    truncated = len(text) > max_chars
    if truncated:
        text = text[:max_chars] + "\n[... TEXTO TRUNCADO ...]"
    diff = "\n".join(str(line) for line in (report.get("diff") or []))
    added_links = "\n".join(
        f"- {item.get('label', '')}: {item.get('href', '')}" for item in (report.get("added_links") or [])
    )
    removed_links = "\n".join(
        f"- {item.get('label', '')}: {item.get('href', '')}" for item in (report.get("removed_links") or [])
    )
    return f"""{SYSTEM_PROMPT}

## Contexto determinístico
- watch_id: {report.get('watch_id')}
- source_url: {report.get('source_url') or snapshot.get('url')}
- content_hash: {snapshot.get('text_hash')}
- checked_at: {snapshot.get('fetched_at')}
- sinais detectados: {", ".join(report.get("signals") or []) or "nenhum"}
- texto truncado: {"sim" if truncated else "não"}

## Diff
```diff
{diff or "(sem diff textual)"}
```

## Links adicionados
{added_links or "(nenhum)"}

## Links removidos
{removed_links or "(nenhum)"}

## Texto novo da fonte oficial
```text
{text}
```

## Saída
Chame a ferramenta de finalização com o schema ResearchReport. Não responda em
texto livre. Para cada mudança material, inclua uma quote literal. Se não houver
mudança material, devolva changes vazio, warnings explicando e
requires_human_review=true.
"""


def default_capability_overrides(model: str) -> dict[str, bool | str]:
    """Groq rejects ``prompt_cache_key``; desliga o recurso nesse provedor."""
    if model.startswith("groq/"):
        return {"supports_prompt_cache_key": False}
    return {}


def parse_capability_overrides(raw: str) -> dict[str, bool | str]:
    if not raw.strip():
        return {}
    data = json.loads(raw)
    if not isinstance(data, dict):
        raise ValueError("capability_overrides precisa ser um objeto JSON.")
    return data


def run_openhands(
    prompt: str,
    model: str,
    api_key: str,
    base_url: str | None,
    capability_overrides: dict[str, bool | str] | None = None,
):
    try:
        from openhands.sdk import Agent, Conversation, LLM
        from openhands.sdk.tool import Tool, register_tool
        from openhands.sdk.tool.builtins.finish import FinishTool

        from .schema import ResearchReport
    except ModuleNotFoundError as exc:
        raise SystemExit(
            "OpenHands SDK não instalado. Crie um venv separado e instale "
            "experiments/openhands_monitor/requirements-openhands.txt."
        ) from exc

    register_tool("FinishTool", FinishTool)
    llm = LLM(
        model=model,
        api_key=api_key,
        base_url=base_url or None,
        capability_overrides=capability_overrides or {},
    )
    agent = Agent(
        llm=llm,
        tools=[Tool(name="FinishTool", params={"response_schema": ResearchReport})],
        include_default_tools=["ThinkTool"],
    )
    conversation = Conversation(agent=agent, workspace=str(Path.cwd()))
    conversation.send_message(prompt)
    conversation.run()

    finish_tool = agent.tools_map["finish"]
    result = finish_tool.parse_last_response(conversation.state.events)
    if result is None:
        raise RuntimeError("O agente não chamou a ferramenta de finalização.")
    cost = None
    try:
        cost = conversation.conversation_stats.get_combined_metrics().accumulated_cost
    except Exception:  # noqa: BLE001 - métrica é opcional
        pass
    return result, cost


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Classifica um relatório de mudança com OpenHands.")
    parser.add_argument("report", type=Path)
    parser.add_argument("--snapshot", type=Path, default=None)
    parser.add_argument("--data-dir", type=Path, default=None)
    parser.add_argument("--out", type=Path, default=None)
    parser.add_argument("--dry-run", action="store_true", help="Só imprime o prompt; não importa o SDK.")
    parser.add_argument("--model", default=os.getenv("OPENHANDS_LLM_MODEL", ""))
    parser.add_argument("--api-key", default=os.getenv("OPENHANDS_LLM_API_KEY") or os.getenv("GROQ_API_KEY") or os.getenv("LLM_API_KEY") or "")
    parser.add_argument("--base-url", default=os.getenv("OPENHANDS_LLM_BASE_URL") or None)
    parser.add_argument(
        "--capability-overrides",
        default=os.getenv("OPENHANDS_CAPABILITY_OVERRIDES", ""),
        help='JSON de overrides do SDK, ex.: {"supports_prompt_cache_key": false}.',
    )
    parser.add_argument("--max-chars", type=int, default=80_000)
    args = parser.parse_args(argv)

    report = read_json(args.report)
    if report is None:
        print(f"Relatório inválido ou ausente: {args.report}", file=sys.stderr)
        return 1
    snapshot_path = args.snapshot or resolve_snapshot_path(report, args.report, args.data_dir)
    snapshot = read_json(snapshot_path)
    if snapshot is None:
        print(f"Snapshot ausente ou inválido: {snapshot_path}", file=sys.stderr)
        return 1

    prompt = build_prompt(report, snapshot, max_chars=args.max_chars)
    if args.dry_run:
        print(prompt)
        return 0
    if not args.model:
        print(
            "Defina OPENHANDS_LLM_MODEL (ex.: groq/openai/gpt-oss-120b ou outro modelo LiteLLM).",
            file=sys.stderr,
        )
        return 1
    if not args.api_key:
        print("Defina OPENHANDS_LLM_API_KEY (ou GROQ_API_KEY).", file=sys.stderr)
        return 1

    try:
        overrides = parse_capability_overrides(args.capability_overrides)
    except ValueError as exc:
        print(f"Override inválido: {exc}", file=sys.stderr)
        return 1
    if not overrides:
        overrides = default_capability_overrides(args.model)

    result, cost = run_openhands(prompt, args.model, args.api_key, args.base_url, overrides)
    payload = result.model_dump(mode="json") if hasattr(result, "model_dump") else dict(result)
    output_path = args.out or args.report.with_name(args.report.stem + ".research.json")
    write_json(output_path, payload)

    validation = validate_report_data(payload, snapshot)
    write_json(output_path.with_suffix(".validation.json"), validation)
    if cost is not None:
        validation["cost"] = cost
        write_json(output_path.with_suffix(".validation.json"), validation)

    print(json.dumps({"report": str(output_path), "validation": validation}, ensure_ascii=False, indent=2))
    return 0 if validation["valid"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
