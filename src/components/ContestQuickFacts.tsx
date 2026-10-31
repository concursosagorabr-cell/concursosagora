'use client';

import Link from 'next/link';
import type { Post, VacancyByRole } from '@/types';
import { getContestStatusInfo } from '@/utils/status';
import { EXAM_BOARDS } from '@/utils/bancas';
import ReportErrorButton from './ReportErrorButton';

interface VacancyRow {
  role: string;
  vacancies: number;
  salary: number | null;
  requirements: string;
  jornada: string;
}

function extractVacanciesFromBody(post: Partial<Post & { vacanciesByRole?: VacancyByRole[] }>): VacancyRow[] {
  // 1. Se já temos dados estruturados
  if (post.vacanciesByRole && Array.isArray(post.vacanciesByRole) && post.vacanciesByRole.length > 0) {
    return post.vacanciesByRole as VacancyRow[];
  }

  // 2. Tenta extrair do corpo (seção "Cargos e Requisitos")
  const body = post.body;
  if (!Array.isArray(body)) return [];

  const rows: VacancyRow[] = [];
  let inCargosSection = false;
  let currentEducation = '';

  for (const block of body) {
    if (block._type !== 'block') continue;
    const text = (block.children || []).map((c: any) => c.text || '').join('').trim();
    if (!text) continue;

    // Detecta início da seção de cargos
    if (block.style === 'h2' && /cargos?\s*e?\s*requisitos/i.test(text)) {
      inCargosSection = true;
      continue;
    }

    // Fim da seção (próximo H2)
    if (inCargosSection && block.style === 'h2') {
      inCargosSection = false;
      continue;
    }

    if (!inCargosSection) continue;

    // H3 = nível de escolaridade
    if (block.style === 'h3') {
      currentEducation = text;
      continue;
    }

    // Itens de cargo (bullet points ou parágrafos)
    const isBullet = block.listItem === 'bullet';
    if (block.style === 'normal' || isBullet) {
      // Múltiplos padrões para diferentes formatos de edital
      
      // Padrão 1: "Cargo: X vaga(s) – R$ Y – Jornada" (ex: "Enfermeiro (1 vaga – R$ 4.318,18 para 40h)")
      let match = text.match(/^[\-\•\*]?\s*([^:–|]{5,60}?)\s*\((\d+)\s*vaga[s]?\s*[–|]\s*R\$\s*([\d.,]+)\s*[–|]\s*(\d{1,2}h)\)/i);
      if (match) {
        const [, role, vacancies, salary, jornada] = match;
        rows.push({
          role: role.trim(),
          vacancies: parseInt(vacancies, 10),
          salary: parseFloat(salary.replace(/[.]/g, '').replace(',', '.')),
          requirements: currentEducation || '',
          jornada: jornada.trim(),
        });
        continue;
      }

      // Padrão 2: "Cargo – X vaga(s) – R$ Y – Jornada" (ex: "Auxiliar: 2 vagas – R$ 1.500,00 – 40h")
      match = text.match(/^[\-\•\*]?\s*([^–|]{5,60}?)\s*[–|]\s*(\d+)\s*vaga[s]?\s*[–|]\s*R\$\s*([\d.,]+)\s*[–|]\s*(\d{1,2}h)/i);
      if (match) {
        const [, role, vacancies, salary, jornada] = match;
        rows.push({
          role: role.trim(),
          vacancies: parseInt(vacancies, 10),
          salary: parseFloat(salary.replace(/[.]/g, '').replace(',', '.')),
          requirements: currentEducation || '',
          jornada: jornada.trim(),
        });
        continue;
      }

      // Padrão 3: "Cargo: X vagas – R$ Y – Jornada" (ex: "Enfermeiro: 1 vaga – R$ 4.318,18 – 40h")
      match = text.match(/^[\-\•\*]?\s*([^:–|]{5,60}?):\s*(\d+)\s*vaga[s]?\s*[–|]\s*R\$\s*([\d.,]+)\s*[–|]\s*(\d{1,2}h)/i);
      if (match) {
        const [, role, vacancies, salary, jornada] = match;
        rows.push({
          role: role.trim(),
          vacancies: parseInt(vacancies, 10),
          salary: parseFloat(salary.replace(/[.]/g, '').replace(',', '.')),
          requirements: currentEducation || '',
          jornada: jornada.trim(),
        });
        continue;
      }

      // Padrão 4: "Cargo – vencimento de R$ X" (sem vagas explícitas, ex: "Gari, Vigia e Motorista: Vagas imediatas com vencimento de R$ 1.621,00")
      match = text.match(/^[\-\•\*]?\s*([^:–|]{5,60}?):\s*.*?vencimento\s+de\s*R\$\s*([\d.,]+)/i);
      if (match) {
        const [, role, salary] = match;
        rows.push({
          role: role.trim(),
          vacancies: 1, // default
          salary: parseFloat(salary.replace(/[.]/g, '').replace(',', '.')),
          requirements: currentEducation || '',
          jornada: '',
        });
        continue;
      }

      // Padrão 5: "Cargo (X vaga – R$ Y para Zh)" dentro de lista separada por vírgula
      // Ex: "Enfermeiro (1 vaga – R$ 4.318,18 para 40h), Cirurgião Dentista (1 vaga – R$ 3.458,44 para 20h)"
      const multiMatches = text.matchAll(/([^,(]{5,60}?)\s*\((\d+)\s*vaga[s]?\s*[–|]\s*R\$\s*([\d.,]+)\s*[–|]\s*(\d{1,2}h)\)/gi);
      let hasMulti = false;
      for (const m of multiMatches) {
        hasMulti = true;
        const [, role, vacancies, salary, jornada] = m;
        rows.push({
          role: role.trim(),
          vacancies: parseInt(vacancies, 10),
          salary: parseFloat(salary.replace(/[.]/g, '').replace(',', '.')),
          requirements: currentEducation || '',
          jornada: jornada.trim(),
        });
      }
      if (hasMulti) continue;

      // Padrão 6: "Cargo: X vagas imediatas" (sem salário explícito na linha)
      match = text.match(/^[\-\•\*]?\s*([^:–|]{5,60}?):\s*(\d+)\s*vaga[s]?\s*imediatas?/i);
      if (match) {
        const [, role, vacancies] = match;
        rows.push({
          role: role.trim(),
          vacancies: parseInt(vacancies, 10),
          salary: null,
          requirements: currentEducation || '',
          jornada: '',
        });
        continue;
      }
    }
  }

  return rows;
}

function renderVacancyTable(rows: VacancyRow[]) {
  if (rows.length === 0) return null;

  return (
    <div className="mt-6 overflow-x-auto">
      <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
        <span>📊</span> Detalhamento de Cargos, Vagas e Remuneração
      </h3>
      <table className="w-full text-sm border-collapse border border-slate-200 bg-white rounded-xl overflow-hidden shadow-xs" role="table">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left p-3 font-bold text-slate-700">Cargo</th>
            <th className="text-center p-3 font-bold text-slate-700">Vagas</th>
            <th className="text-right p-3 font-bold text-slate-700">Salário</th>
            <th className="text-left p-3 font-bold text-slate-700">Escolaridade / Requisitos</th>
            <th className="text-center p-3 font-bold text-slate-700">Jornada</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td className="p-3 font-medium text-slate-900">{row.role}</td>
              <td className="p-3 text-center text-slate-700">{row.vacancies.toLocaleString('pt-BR')} vaga{row.vacancies !== 1 ? 's' : ''}</td>
              <td className="p-3 text-right font-semibold text-emerald-700">
                {row.salary ? `R$ ${row.salary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Piso nacional / A definir'}
              </td>
              <td className="p-3 text-slate-600">{row.requirements || '—'}</td>
              <td className="p-3 text-center text-slate-600">{row.jornada || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[11px] text-slate-500 mt-2">
        Valores referentes ao vencimento básico inicial. Podem incidir adicionais (insalubridade, periculosidade, responsabilidade técnica, etc.). Consulte o edital.
      </p>
    </div>
  );
}

interface ContestQuickFactsProps {
  post: Partial<Post>;
}

/**
 * Ficha Técnica Estruturada — Componente nativo que responde às 7 perguntas
 * que todo candidato faz antes de ler uma matéria de concurso:
 * 1. Posso me inscrever agora?
 * 2. Qual o prazo exato?
 * 3. Qual é o cargo e a escolaridade?
 * 4. Qual o salário?
 * 5. Qual a banca?
 * 6. Quando é a prova?
 * 7. O que mudou desde a última atualização?
 */
export default function ContestQuickFacts({ post }: ContestQuickFactsProps) {
  const statusInfo = getContestStatusInfo(post);

  const boardSlug = post.banca?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const boardInfo = boardSlug ? EXAM_BOARDS[boardSlug] : null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return null;
    }
  };

  const formatCurrency = (value?: number) => {
    if (value == null) return null;
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const educationLabels: Record<string, string> = {
    fundamental: 'Fundamental',
    medio: 'Médio',
    tecnico: 'Técnico',
    superior: 'Superior',
  };

  const updatedAt = post._updatedAt || post.publishedAt;
  const formattedUpdate = formatDate(updatedAt);

  const facts: Array<{ icon: string; label: string; value: string | null; highlight?: boolean }> = [
    {
      icon: statusInfo.isExpired ? '🔴' : statusInfo.label === 'Edital Previsto' ? '🟡' : statusInfo.label === 'Em Andamento' ? '🔵' : '🟢',
      label: 'Status das Inscrições',
      value: statusInfo.enrollmentLabel || statusInfo.expirationNote || statusInfo.label,
      highlight: !statusInfo.isExpired && statusInfo.label === 'Concurso Aberto',
    },
    {
      icon: '📋',
      label: 'Fase do Certame',
      value: statusInfo.label,
    },
    {
      icon: '👥',
      label: 'Vagas',
      value: (!post.vacanciesTotal && statusInfo.label === 'Edital Previsto') ? 'Aguardando definição' : post.vacanciesTotal ? `${post.vacanciesTotal.toLocaleString('pt-BR')} vagas` : null,
    },
    {
      icon: '🎓',
      label: 'Escolaridade',
      value: post.educationLevel?.map(e => educationLabels[e] || e).join(', ') || null,
    },
    {
      icon: '💰',
      label: 'Remuneração',
      value: post.salaryMax
        ? `até ${formatCurrency(post.salaryMax)}`
        : null,
    },
    {
      icon: '🏢',
      label: 'Banca Organizadora',
      value: (!post.banca && statusInfo.label === 'Edital Previsto') ? 'A definir por licitação' : post.banca || null,
    },
    {
      icon: '📅',
      label: 'Data da Prova',
      value: formatDate(post.examDate) || 'A definir',
    },
    {
      icon: '📝',
      label: 'Prazo de Inscrição',
      value: post.enrollmentEndDate ? `Até ${formatDate(post.enrollmentEndDate)}` : 'Aguardando publicação do edital',
    },
    {
      icon: '💳',
      label: 'Taxa de Inscrição',
      value: post.registrationFee
        ? `${formatCurrency(post.registrationFee)}${post.hasExemption ? ' (isenção disponível)' : ''}`
        : post.hasExemption ? 'Isento' : null,
    },
    {
      icon: '📍',
      label: 'Local',
      value: [post.cityName, post.stateUf].filter(Boolean).join(' — ') || null,
    },
  ];

  const visibleFacts = facts.filter(f => f.value != null);
  const vacancyRows = extractVacanciesFromBody(post);

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
          <span>📌</span> Ficha Técnica do Concurso
        </h2>
        {formattedUpdate && (
          <span className="text-[11px] text-slate-500 font-medium shrink-0">
            Atualizado em {formattedUpdate}
          </span>
        )}
      </div>

      {/* Grid de dados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {visibleFacts.map((fact, i) => (
          <div
            key={i}
            className={`flex items-start gap-2.5 p-3 rounded-xl border ${
              fact.highlight
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-white border-slate-200/80'
            }`}
          >
            <span className="text-base shrink-0 mt-0.5">{fact.icon}</span>
            <div className="min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                {fact.label}
              </span>
              <span className={`text-sm font-semibold block ${
                fact.highlight ? 'text-emerald-700' : 'text-slate-800'
              }`}>
                {fact.label === 'Banca Organizadora' && boardInfo ? (
                  <Link
                    href={`/banca/${boardInfo.slug}`}
                    className="text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    {fact.value}
                  </Link>
                ) : (
                  fact.value
                )}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabela de cargos (quando disponível) */}
      {renderVacancyTable(vacancyRows)}

      {/* Rodapé: Fonte oficial + Reportar erro */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
        <p className="text-[11px] text-slate-500 leading-relaxed">
          <strong>⚠️ Importante:</strong> Confira sempre o edital oficial no portal da banca organizadora ou do órgão responsável antes de efetuar inscrição.
        </p>
        {/* FIX: Botão de reporte de erro com e-mail ofuscado contra bots - 2026-09-06 */}
        <ReportErrorButton postTitle={post.title || ''} />
      </div>
    </div>
  );
}
