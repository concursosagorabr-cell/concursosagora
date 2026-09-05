'use client';

import Link from 'next/link';
import type { Post } from '@/types';
import { getContestStatusInfo } from '@/utils/status';
import { EXAM_BOARDS } from '@/utils/bancas';

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
      value: post.vacanciesTotal ? `${post.vacanciesTotal.toLocaleString('pt-BR')} vagas` : null,
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
      value: post.banca || null,
    },
    {
      icon: '📅',
      label: 'Data da Prova',
      value: formatDate(post.examDate) || 'A definir',
    },
    {
      icon: '📝',
      label: 'Prazo de Inscrição',
      value: post.enrollmentEndDate ? `Até ${formatDate(post.enrollmentEndDate)}` : 'Consultar edital',
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

      {/* Rodapé: Fonte oficial + Reportar erro */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
        <p className="text-[11px] text-slate-500 leading-relaxed">
          <strong>⚠️ Importante:</strong> Confira sempre o edital oficial no portal da banca organizadora ou do órgão responsável antes de efetuar inscrição.
        </p>
        <a
          href={`mailto:contato@concursosagora.com.br?subject=Correção: ${encodeURIComponent(post.title || '')}&body=Olá, encontrei uma possível inconsistência na matéria "${post.title || ''}". Detalhe:`}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors border border-slate-200 shrink-0 self-start"
          title="Reportar erro ou retificação de edital"
        >
          <span>🚨</span>
          <span>Reportar Erro</span>
        </a>
      </div>
    </div>
  );
}
