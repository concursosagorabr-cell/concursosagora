from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path
from typing import Any

from pipeline import __version__
from pipeline.config import ConfigError, Settings, load_settings, load_sources
from pipeline.daily import run_daily
from pipeline.enrich import run_enrichment
from pipeline.dou_open_data import DouOpenDataError
from pipeline.extract import discover, extract_article, parse_dou_date_arg
from pipeline.groq import GroqClient, GroqError
from pipeline.manual import ManualError, run_bundle
from pipeline.models import Candidate
from pipeline.runner import PipelineRunner
from pipeline.sanity import SanityClient, SanityError
from pipeline.scrape import Scraper
from pipeline.source_policy import SOURCE_POLICIES, official_link
from pipeline.state import StateStore


def _configure_console() -> None:
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            try:
                stream.reconfigure(encoding="utf-8", errors="replace")
            except Exception:  # noqa: BLE001
                pass


def _setup_logging(verbose: bool = False, quiet: bool = False) -> None:
    level = logging.DEBUG if verbose else (logging.WARNING if quiet else logging.INFO)
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s %(message)s",
        datefmt="%H:%M:%S",
        stream=sys.stderr,
    )


def _print_json(value: Any) -> None:
    print(json.dumps(value, ensure_ascii=False, indent=2, default=str))


def _settings(args: argparse.Namespace) -> Settings:
    env_files = [Path(item) for item in args.env_file] if getattr(args, "env_file", None) else None
    return load_settings(env_files=env_files)


def _doctor(args: argparse.Namespace, settings: Settings) -> int:
    print("Concursos Agora — pipeline editorial")
    print(f"Versão: {__version__}")
    print(f"Projeto Sanity: {settings.sanity_project_id or '(ausente)'}")
    print(f"Dataset: {settings.sanity_dataset or '(ausente)'}")
    print(f"Modelo Groq: {settings.groq_model}")
    print(f"Chaves Groq encontradas: {len(settings.groq_keys)}")
    print(f"AUTO_PUBLISH: {settings.auto_publish}")
    print(
        "Verificação: "
        f"fonte_oficial={settings.require_official_source} "
        f"evidência={settings.require_fact_evidence} "
        f"conflito={settings.block_on_fact_conflict} "
        f"nota_mínima={settings.verification_min_score}"
    )
    print(f"Modo seguro: somente rascunhos (reviewStatus=pending)")
    print(f"Intervalo mínimo por concurso: {settings.contest_cooldown_days} dias")
    print(f"Data local: {settings.data_dir}")
    print(f"Importação DOU (XML/ZIP): {settings.dou_import_dir}")

    if not settings.sanity_configured:
        print("Sanity: credenciais ausentes.")
        return 1
    try:
        with Scraper(settings):
            pass
        sanity = SanityClient(settings)
        counts = sanity.ping()
        print(f"Sanity: OK — {counts}")
    except (SanityError, Exception) as exc:  # noqa: BLE001
        print(f"Sanity: FALHA — {exc}")
        return 1

    if args.test_groq:
        if not settings.groq_configured:
            print("Groq: chaves ausentes.")
            return 1
        try:
            client = GroqClient(settings)
            response = client.chat(
                "Responda somente JSON válido.",
                'Retorne {"ok": true} sem explicações.',
                max_tokens=600,
                temperature=0,
            )
            print(f"Groq: OK — resposta={response.data}")
        except GroqError as exc:
            print(f"Groq: FALHA — {exc}")
            return 1
    else:
        print("Groq: não testado (use --test-groq para uma chamada real).")

    if args.fetch_source:
        sources = {source.id: source for source in load_sources(settings.sources_file)}
        source = sources.get(args.fetch_source)
        if not source:
            print(f"Fonte desconhecida: {args.fetch_source}")
            return 1
        if source.type in {"dou_inlabs", "dou_open_data"}:
            print(
                "Coleta: DOU é importação local de XML/ZIP oficial; "
                f"use --dou-file ou coloque o arquivo em {settings.dou_import_dir}."
            )
            return 0
        try:
            with Scraper(settings) as scraper:
                page = scraper.fetch(source.start_urls[0])
            print(f"Coleta: OK — {source.name} HTTP {page.status}, {len(page.html)} bytes")
        except Exception as exc:  # noqa: BLE001
            print(f"Coleta: FALHA — {exc}")
            return 1
    return 0


def _sources(args: argparse.Namespace, settings: Settings) -> int:
    if getattr(args, "registry", False):
        print("id\ttier\tuso\tautomação\tpode gerar artigo?")
        for policy in SOURCE_POLICIES:
            print(
                f"{policy.id}\t{policy.tier}\t{policy.usage}\t{policy.automation}\t"
                f"{str(policy.can_generate_article).lower()}"
            )
            print(f"  {policy.name}: {policy.terms}")
        return 0
    sources = load_sources(settings.sources_file)
    for source in sources:
        print(f"{source.id}\t{source.name}\t{source.type}\tenabled={source.enabled}\ttier={source.tier}\tusage={source.usage}")
        for url in source.start_urls:
            print(f"  {url}")
    return 0


def _discover(args: argparse.Namespace, settings: Settings) -> int:
    sources = {source.id: source for source in load_sources(settings.sources_file)}
    source = sources.get(args.source)
    if not source:
        print(f"Fonte desconhecida: {args.source}", file=sys.stderr)
        return 1
    dou_file = Path(args.dou_file).expanduser() if getattr(args, "dou_file", None) else None
    local_dou_import = source.type in {"dou_inlabs", "dou_open_data"} and dou_file is not None
    if not source.enabled and not local_dou_import:
        print(
            f"A fonte '{source.id}' está desativada em sources.yaml e não será coletada. "
            "Para importar um arquivo local do DOU, use --dou-file.",
            file=sys.stderr,
        )
        return 1
    dou_date = parse_dou_date_arg(args.date) if args.date else None
    with Scraper(settings) as scraper:
        candidates = discover(
            scraper,
            source,
            limit=args.limit,
            dou_date=dou_date,
            dou_file=dou_file,
        )
    if args.json:
        _print_json(
            [
                {
                    "url": item.url,
                    "source_id": item.source_id,
                    "title": item.title,
                    "published_at": item.published_at,
                    "summary": item.summary,
                    "score": item.score,
                    "metadata": {
                        key: value
                        for key, value in item.metadata.items()
                        if key not in {"list_item"}
                    },
                }
                for item in candidates
            ]
        )
    else:
        print(f"{len(candidates)} candidato(s) em {source.name}:")
        for index, item in enumerate(candidates, 1):
            print(f"{index:02d}. score={item.score:.1f} {item.url}")
            if item.title:
                print(f"    {item.title}")
    return 0


def _verify(args: argparse.Namespace, settings: Settings) -> int:
    sources = {source.id: source for source in load_sources(settings.sources_file)}
    source = sources.get(args.source)
    if not source:
        print(f"Fonte desconhecida: {args.source}", file=sys.stderr)
        return 1
    if source.type in {"dou_inlabs", "dou_open_data"}:
        print(
            "Para o DOU, use discover/run com --source dou e --dou-file "
            "(XML/ZIP oficial); não há extração pelo HTML do in.gov.br.",
            file=sys.stderr,
        )
        return 1
    if not source.enabled:
        print(f"A fonte '{source.id}' está desativada em sources.yaml.", file=sys.stderr)
        return 1
    if not official_link(args.url, source.allowed_domains):
        print("A URL n\u00e3o \u00e9 uma fonte oficial permitida para esta fonte.", file=sys.stderr)
        return 1
    with Scraper(settings) as scraper:
        article = extract_article(
            scraper,
            source,
            Candidate(url=args.url, source_id=source.id),
        )
    report = article.verification or {}
    if args.json:
        _print_json(
            {
                "url": article.url,
                "title": article.title,
                "source_tier": article.source_tier,
                "facts": article.facts,
                "verification": report,
            }
        )
        return 0 if not report.get("criticalMissing") else 1
    print(f"Fonte: {source.name} ({source.tier}, usage={source.usage})")
    print(f"URL: {article.url}")
    print(f"Título: {article.title}")
    print(f"Nota de evidência: {report.get('score', 0)}/100")
    print(f"Fatos: {report.get('supportedFacts', 0)}/{report.get('totalFacts', 0)} com evidência")
    if report.get("criticalMissing"):
        print("Fatos críticos sem evidência: " + ", ".join(report["criticalMissing"]))
    for key, item in (report.get("facts") or {}).items():
        quote = (item.get("evidence") or [{}])[0].get("quote") or "SEM EVIDENCIA"
        print(f"- {key}: {item.get('status')} ({item.get('confidence')}) | {quote[:180]}")
    return 0 if not report.get("criticalMissing") else 1


def _run(args: argparse.Namespace, settings: Settings) -> int:
    try:
        settings.validate_sanity()
        settings.validate_groq()
    except ConfigError as exc:
        print(f"Configuração incompleta: {exc}", file=sys.stderr)
        return 2
    if settings.auto_publish:
        print(
            "AUTO_PUBLISH=true detectado. O pipeline não publica automaticamente; "
            "a flag é ignorada e apenas rascunhos serão criados.",
            file=sys.stderr,
        )
    dou_date = parse_dou_date_arg(args.date) if args.date else None
    dou_file = Path(args.dou_file).expanduser() if getattr(args, "dou_file", None) else None
    state = StateStore(settings.data_dir / "pipeline.db")
    try:
        with Scraper(settings) as scraper:
            sanity = SanityClient(settings)
            groq = GroqClient(settings)
            runner = PipelineRunner(settings, scraper, sanity, state, groq)
            stats = runner.run(
                source_id=args.source,
                urls=args.url,
                limit=args.limit,
                dou_date=dou_date,
                dou_file=dou_file,
                dry_run=args.dry_run,
            )
    finally:
        state.close()

    if args.json:
        _print_json(stats.__dict__)
    else:
        print("")
        print(f"Execução: {stats.run_id}")
        print(f"Modo: {'dry-run (nada gravado)' if stats.dry_run else 'rascunhos no Sanity'}")
        print(f"Descobertos: {stats.discovered} | processados: {stats.processed}")
        print(
            f"Criados: {stats.created} | ignorados: {stats.skipped} | "
            f"duplicados: {stats.duplicates} | erros: {stats.errors}"
        )
        for item in stats.items:
            print(f"- [{item.status}] {item.article_title or item.url}")
            if item.sanity_id:
                print(f"  {item.sanity_id}")
            if item.warnings:
                for warning in item.warnings[:5]:
                    print(f"  aviso: {warning}")
    return 0 if stats.errors == 0 else 1


def _manual(args: argparse.Namespace, settings: Settings) -> int:
    try:
        summary = run_bundle(
            Path(args.bundle),
            apply=args.apply,
            settings=settings,
        )
    except (ManualError, ConfigError, SanityError) as exc:
        print(f"Falha no bundle manual: {exc}", file=sys.stderr)
        return 1
    if args.json:
        _print_json(summary)
    else:
        mode = "rascunhos criados" if summary["apply"] else "dry-run (nada gravado)"
        print(f"Bundle: {summary['bundle']}")
        print(f"Modo: {mode} | cooldown: {summary['cooldown_days']} dias")
        print(
            f"Itens: {summary['total']} | criados: {summary['created']} | "
            f"validados: {summary['dry_run']} | erros: {summary['errors']}"
        )
        for item in summary["items"]:
            print(f"- [{item['status']}] {item['title'] or item['slug'] or item['index']}")
            if item.get("sanity_id"):
                print(f"  {item['sanity_id']}")
            if item.get("contest_key"):
                print(f"  concurso: {item['contest_key']}")
            if item.get("message"):
                print(f"  {item['message']}")
            for warning in (item.get("warnings") or [])[:5]:
                print(f"  aviso: {warning}")
        print(f"Resumo: {summary['summary_path']}")
    return 0 if summary["errors"] == 0 else 1


def _daily(args: argparse.Namespace, settings: Settings) -> int:
    try:
        queue = run_daily(
            settings=settings,
            sources=args.sources,
            limit=args.limit,
            max_extract=args.max_extract,
            stale_days=args.stale_days,
            extract=not args.no_extract,
        )
    except (ConfigError, ValueError, SanityError) as exc:
        print(f"Falha na rotina diária: {exc}", file=sys.stderr)
        return 1

    items = queue.get("items") or []
    counts: dict[str, int] = {}
    for item in items:
        counts[item.get("status", "?")] = counts.get(item.get("status", "?"), 0) + 1
    pending = [post for post in queue.get("pending_drafts") or [] if post.get("reviewStatus") == "pending"]

    if args.json:
        _print_json(queue)
    else:
        print(f"Fila do dia: {queue['day']}")
        print(f"Fontes: {', '.join(queue['sources'])}")
        print(
            f"Itens: {len(items)} | prontos: {counts.get('ready', 0)} | "
            f"conferir: {counts.get('needs_review', 0)} | "
            f"duplicados: {counts.get('duplicate', 0)} | "
            f"erros: {counts.get('error', 0)}"
        )
        print(f"Rascunhos pendentes no Sanity: {len(pending)}")
        for item in items:
            print(f"- [{item['status']}] {item.get('extracted_title') or item.get('title') or item['url']}")
            if item.get("reason"):
                print(f"  {item['reason']}")
        for error in queue.get("errors") or []:
            print(f"  erro: {error}")
        print(f"Fila JSON: {queue['queue_path']}")
        print(f"Fila Markdown: {queue['markdown_path']}")
    return 0 if items or not queue.get("errors") else 1


def _enrich(args: argparse.Namespace, settings: Settings) -> int:
    try:
        settings.validate_sanity()
    except ConfigError as exc:
        print(f"Configuração incompleta: {exc}", file=sys.stderr)
        return 2
    sanity = SanityClient(settings)
    try:
        summary = run_enrichment(
            settings=settings,
            sanity=sanity,
            limit=args.limit,
            apply=args.apply,
            force=args.force,
        )
    except (ConfigError, SanityError) as exc:
        print(f"Falha no enriquecimento: {exc}", file=sys.stderr)
        return 1

    if args.json:
        _print_json(summary)
    else:
        mode = "rascunhos alterados" if summary["apply"] else "dry-run (nada gravado)"
        print(f"Enriquecimento: {summary['total']} artigo(s)")
        print(f"Modo: {mode} | aplicados: {summary['applied']} | erros: {summary['errors']}")
        for item in summary["items"]:
            print(f"- [{item['status']}] {item['title']}")
            if item.get("draft_id"):
                print(f"  {item['draft_id']}")
            if item.get("reason"):
                print(f"  {item['reason']}")
        for error in summary.get("error_messages") or []:
            print(f"  erro: {error}")
    return 0 if summary["errors"] == 0 else 1


def _stats(args: argparse.Namespace, settings: Settings) -> int:
    state = StateStore(settings.data_dir / "pipeline.db")
    try:
        _print_json(state.stats())
    finally:
        state.close()
    return 0


def _delete_draft(args: argparse.Namespace, settings: Settings) -> int:
    if not args.id.startswith("drafts."):
        print("Por segurança, este comando só apaga documentos com id 'drafts.*'.", file=sys.stderr)
        return 2
    if not args.yes:
        print("Confirme com --yes para apagar o rascunho.", file=sys.stderr)
        return 2
    try:
        settings.validate_sanity()
        sanity = SanityClient(settings)
        response = sanity.delete_document(args.id)
        _print_json(response)
    except (ConfigError, SanityError) as exc:
        print(f"Falha ao apagar rascunho: {exc}", file=sys.stderr)
        return 1
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="python -m pipeline",
        description="Pipeline editorial Concursos Agora: coleta oficial, redação assistida e rascunhos para revisão.",
    )
    parser.add_argument("--version", action="version", version=f"%(prog)s {__version__}")
    parser.add_argument("-v", "--verbose", action="store_true", help="logs detalhados")
    parser.add_argument("-q", "--quiet", action="store_true", help="somente avisos e erros")
    parser.add_argument(
        "--env-file",
        action="append",
        default=[],
        help="arquivo .env adicional (pode ser repetido; os últimos sobrescrevem)",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    doctor = sub.add_parser("doctor", help="verifica configuração, Sanity e fontes")
    doctor.add_argument("--test-groq", action="store_true", help="faz uma chamada real ao Groq")
    doctor.add_argument("--fetch-source", help="testa o fetch da página inicial de uma fonte")
    doctor.set_defaults(func=_doctor)

    sources = sub.add_parser("sources", help="lista as fontes configuradas")
    sources.add_argument(
        "--registry",
        action="store_true",
        help="mostra o registro de políticas de todas as fontes analisadas",
    )
    sources.set_defaults(func=_sources)

    discover_parser = sub.add_parser("discover", help="lista candidatos sem redigir nem gravar")
    discover_parser.add_argument("--source", required=True, help="id da fonte (ex.: inss, vunesp, fgv, dou)")
    discover_parser.add_argument("--limit", type=int, default=10)
    discover_parser.add_argument("--date", help="data da edição do DOU (DD-MM-AAAA)")
    discover_parser.add_argument(
        "--dou-file",
        help="XML/ZIP oficial do DOU baixado manualmente (não faz scraping do HTML)",
    )
    discover_parser.add_argument("--json", action="store_true")
    discover_parser.set_defaults(func=_discover)

    verify = sub.add_parser("verify", help="extrai fatos e evidências de uma URL, sem redigir nem gravar")
    verify.add_argument("--source", required=True, help="id da fonte (ex.: inss, vunesp, fgv)")
    verify.add_argument("--url", required=True, help="URL oficial a verificar")
    verify.add_argument("--json", action="store_true")
    verify.set_defaults(func=_verify)

    run = sub.add_parser("run", help="coleta, redige e cria rascunhos no Sanity")
    run.add_argument("--source", help="id da fonte (inss, vunesp, fgv, dou ou all)")
    run.add_argument("--url", action="append", default=[], help="URL direta (pode ser repetida)")
    run.add_argument("--limit", type=int, help="máximo de artigos nesta execução")
    run.add_argument("--date", help="data da edição do DOU (DD-MM-AAAA)")
    run.add_argument(
        "--dou-file",
        help="XML/ZIP oficial do DOU baixado manualmente (não faz scraping do HTML)",
    )
    run.add_argument("--dry-run", action="store_true", help="valida tudo, mas não grava no Sanity")
    run.add_argument("--json", action="store_true", help="imprime o resumo em JSON")
    run.set_defaults(func=_run)

    manual = sub.add_parser(
        "manual",
        help="valida um bundle escrito manualmente e cria rascunhos no Sanity",
    )
    manual.add_argument("--bundle", required=True, help="caminho do bundle JSON")
    manual.add_argument("--apply", action="store_true", help="cria os rascunhos (sem a flag, só valida)")
    manual.add_argument("--json", action="store_true", help="imprime o resumo em JSON")
    manual.set_defaults(func=_manual)

    daily = sub.add_parser(
        "daily",
        help="monta a fila editorial do dia (sem Groq e sem gravar no Sanity)",
    )
    daily.add_argument(
        "--sources",
        default="all",
        help="fontes separadas por vírgula (padrão: all)",
    )
    daily.add_argument("--limit", type=int, default=8, help="candidatos por fonte")
    daily.add_argument(
        "--max-extract",
        type=int,
        default=12,
        help="máximo de páginas extraídas por dia",
    )
    daily.add_argument(
        "--stale-days",
        type=int,
        default=7,
        help="idade a partir da qual um rascunho pendente é destacado",
    )
    daily.add_argument(
        "--no-extract",
        action="store_true",
        help="apenas descobre e aplica as travas, sem abrir as páginas",
    )
    daily.add_argument("--json", action="store_true", help="imprime a fila em JSON")
    daily.set_defaults(func=_daily)

    enrich = sub.add_parser(
        "enrich",
        help="enriquece rascunhos com seção complementar e dicas de estudo",
    )
    enrich.add_argument("--limit", type=int, default=10, help="quantidade de artigos recentes")
    enrich.add_argument("--apply", action="store_true", help="grava os rascunhos (sem a flag, só valida)")
    enrich.add_argument("--force", action="store_true", help="reaplica mesmo em artigos já enriquecidos")
    enrich.add_argument("--json", action="store_true", help="imprime o resumo em JSON")
    enrich.set_defaults(func=_enrich)

    stats = sub.add_parser("stats", help="mostra o estado local do pipeline")
    stats.set_defaults(func=_stats)

    delete = sub.add_parser("delete-draft", help="apaga um rascunho específico (limpeza)")
    delete.add_argument("--id", required=True, help="id do rascunho, começando com drafts.")
    delete.add_argument("--yes", action="store_true", help="confirma a exclusão")
    delete.set_defaults(func=_delete_draft)
    return parser


def main(argv: list[str] | None = None) -> int:
    _configure_console()
    parser = build_parser()
    args = parser.parse_args(argv)
    _setup_logging(args.verbose, args.quiet)
    try:
        settings = _settings(args)
        return int(args.func(args, settings))
    except (ConfigError, DouOpenDataError, ManualError, ValueError, GroqError, SanityError) as exc:
        print(f"Erro: {exc}", file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        print("Interrompido pelo usuário.", file=sys.stderr)
        return 130


if __name__ == "__main__":
    raise SystemExit(main())
