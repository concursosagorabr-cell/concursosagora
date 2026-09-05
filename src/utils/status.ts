import type { Post } from '../types';

export interface ContestStatusInfo {
  isExpired: boolean;
  label: 'Concurso Aberto' | 'Concurso Encerrado' | 'Edital Previsto' | 'Em Andamento';
  badgeBg: string;
  badgeText: string;
  dotColor: string;
  formattedTargetDate?: string;
  formattedExpirationDate?: string;
  expirationNote: string;
}

function isPrevistoHeuristic(title?: string): boolean {
  if (!title) return false;
  const t = title.toLowerCase();
  return (
    t.includes('previsto') ||
    t.includes('autorizad') ||
    t.includes('anunciad') ||
    t.includes('comissao') ||
    t.includes('iminente') ||
    t.includes('estudo') ||
    t.includes('sem numero') ||
    t.includes('em definicao') ||
    t.includes('organiza') ||
    /\bbanca\b.*\b(confirmad|definid|escolhid|contratad)/i.test(t) ||
    /\b(fcc|cebraspe|fgv|vunesp|quadrix|aocp|idecan)\s+(organiza|confirmad|definid)/i.test(t)
  );
}

/**
 * Calcula se um concurso está encerrado ou aberto com base na data de término das inscrições (enrollmentEndDate)
 * ou data da prova (examDate) extraída pela IA da notícia.
 * Caso NENHUMA data seja informada na notícia, utiliza fallback de 12 meses após a data de criação.
 */
export function isContestExpired(post: Partial<Post>): boolean {
  if (typeof post.isExpired === 'boolean') {
    return post.isExpired;
  }

  const now = new Date().getTime();
  const rawTargetDate = post.enrollmentEndDate || post.examDate;
  const targetDateStr =
    typeof rawTargetDate === 'string' &&
    rawTargetDate.trim().length > 0 &&
    !rawTargetDate.trim().toLowerCase().startsWith('null') &&
    !rawTargetDate.trim().toLowerCase().startsWith('none')
      ? rawTargetDate.trim()
      : undefined;

  if (targetDateStr) {
    const targetTime = new Date(targetDateStr).getTime();
    if (!isNaN(targetTime)) {
      return targetTime < now;
    }
  }

  const creationDateStr = post.publishedAt || post._createdAt;
  if (creationDateStr) {
    const creationTime = new Date(creationDateStr).getTime();
    if (!isNaN(creationTime)) {
      // 12 meses = 365 dias * 24 * 60 * 60 * 1000
      const twelveMonthsMs = 365 * 24 * 60 * 60 * 1000;
      return creationTime + twelveMonthsMs < now;
    }
  }

  return false;
}

/**
 * Retorna informações completas de status e estilo visual para badges e banners no frontend.
 */
export function getContestStatusInfo(post: Partial<Post>): ContestStatusInfo {
  const expired = isContestExpired(post);
  const targetDateStr = post.enrollmentEndDate || post.examDate;

  const formattedTargetDate = targetDateStr
    ? new Date(targetDateStr).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : undefined;

  let formattedExpirationDate: string | undefined;
  if (!targetDateStr && (post.publishedAt || post._createdAt)) {
    const creationDate = new Date(post.publishedAt || post._createdAt!);
    creationDate.setFullYear(creationDate.getFullYear() + 1);
    formattedExpirationDate = creationDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  let expirationNote = '';
  if (targetDateStr) {
    expirationNote = expired
      ? `Encerrado em ${formattedTargetDate}`
      : `Inscrições até ${formattedTargetDate}`;
  }

  if (expired || post.status === 'encerrado') {
    return {
      isExpired: true,
      label: 'Concurso Encerrado',
      badgeBg: 'bg-slate-700/90 text-slate-100 border border-slate-600',
      badgeText: 'text-slate-100',
      dotColor: 'bg-red-500',
      formattedTargetDate,
      formattedExpirationDate,
      expirationNote,
    };
  }

  const isExplicitlyPrevisto = post.status === 'previsto';
  const isHeuristicPrevisto = !targetDateStr && isPrevistoHeuristic(post.title);

  if (isExplicitlyPrevisto || isHeuristicPrevisto) {
    return {
      isExpired: false,
      label: 'Edital Previsto',
      badgeBg: 'bg-amber-600/95 text-white border border-amber-400/30',
      badgeText: 'text-white',
      dotColor: 'bg-amber-300 animate-pulse motion-reduce:animate-none',
      formattedTargetDate,
      formattedExpirationDate,
      expirationNote: 'Edital previsto / Em fase preparatória',
    };
  }

  if (post.status === 'em_andamento') {
    return {
      isExpired: false,
      label: 'Em Andamento',
      badgeBg: 'bg-blue-600/95 text-white border border-blue-400/30',
      badgeText: 'text-white',
      dotColor: 'bg-blue-300 animate-pulse motion-reduce:animate-none',
      formattedTargetDate,
      formattedExpirationDate,
      expirationNote: 'Inscrições encerradas / Em andamento',
    };
  }

  return {
    isExpired: false,
    label: 'Concurso Aberto',
    badgeBg: 'bg-emerald-600/95 text-white border border-emerald-400/30',
    badgeText: 'text-white',
    dotColor: 'bg-emerald-300 animate-pulse motion-reduce:animate-none',
    formattedTargetDate,
    formattedExpirationDate,
    expirationNote,
  };
}
