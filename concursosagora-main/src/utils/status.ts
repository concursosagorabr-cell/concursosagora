import type { Post } from '../types';

export interface ContestStatusInfo {
  isExpired: boolean;
  label: 'Concurso Aberto' | 'Concurso Encerrado' | 'Edital Previsto' | 'Em Andamento';
  badgeBg: string;
  badgeText: string;
  dotColor: string;
  enrollmentLabel?: string;
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
 *
 * REGRA CRÍTICA (auditoria set/2026):
 * - Se enrollmentEndDate estiver no passado, o concurso NUNCA é "Aberto" — é "Em Andamento" ou "Encerrado".
 * - Se examDate também estiver no passado, o concurso é "Encerrado".
 * - O campo `status` do Sanity tem prioridade quando preenchido (aberto|previsto|em_andamento|encerrado).
 */
export function isContestExpired(post: Partial<Post>): boolean {
  if (typeof post.isExpired === 'boolean') {
    return post.isExpired;
  }

  const now = new Date().getTime();

  // REGRA ABSOLUTA: se enrollmentEndDate for futura ou hoje, NUNCA está expirado
  if (post.enrollmentEndDate) {
    const edTime = new Date(post.enrollmentEndDate).getTime();
    if (!isNaN(edTime) && edTime >= now) {
      return false;
    }
  }

  if (post.status === 'encerrado') {
    return true;
  }

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
      const twelveMonthsMs = 365 * 24 * 60 * 60 * 1000;
      return creationTime + twelveMonthsMs < now;
    }
  }

  return false;
}

/**
 * Determina deterministicamente se as inscrições estão ainda não iniciadas, abertas, encerradas ou indefinidas.
 * Regra:
 * hoje < início_inscrições → 'nao_iniciadas'
 * início <= hoje <= fim   → 'abertas'
 * hoje > fim              → 'encerradas'
 */
function getEnrollmentStatus(post: Partial<Post>): 'nao_iniciadas' | 'abertas' | 'encerradas' | null {
  const now = new Date().getTime();

  const startStr = post.enrollmentStartDate;
  let startTime: number | null = null;
  if (startStr && typeof startStr === 'string' && startStr.trim().length > 0) {
    const t = new Date(startStr.trim()).getTime();
    if (!isNaN(t)) startTime = t;
  }

  const edStr = post.enrollmentEndDate;
  let edTime: number | null = null;
  if (edStr && typeof edStr === 'string' && edStr.trim().length > 0) {
    const t = new Date(edStr.trim()).getTime();
    if (!isNaN(t)) edTime = t;
  }

  // 1. Se tem data de início e hoje < início
  if (startTime !== null && now < startTime) {
    return 'nao_iniciadas';
  }

  // 2. Se tem data de término:
  if (edTime !== null) {
    return now <= edTime ? 'abertas' : 'encerradas';
  }

  // 3. Se só tem data de início e já iniciou
  if (startTime !== null && now >= startTime) {
    return 'abertas';
  }

  return null;
}

/**
 * Retorna o rótulo descritivo do status de inscrições respeitando estritamente as datas.
 * REGRA ABSOLUTA: se registrationEnd >= now, NUNCA retorna "Inscrições encerradas".
 */
function resolveEnrollmentLabel(
  enrollmentStatus: 'nao_iniciadas' | 'abertas' | 'encerradas' | null,
  cmsStatus?: string
): string {
  if (enrollmentStatus === 'nao_iniciadas') return 'Inscrições ainda não iniciadas';
  if (enrollmentStatus === 'abertas') return 'Inscrições abertas';
  if (enrollmentStatus === 'encerradas') return 'Inscrições encerradas';

  if (cmsStatus === 'previsto') return 'Aguardando edital';
  if (cmsStatus === 'encerrado') return 'Inscrições encerradas';
  if (cmsStatus === 'em_andamento') return 'Inscrições encerradas';
  return 'Inscrições abertas';
}

/**
 * Retorna informações completas de status e estilo visual para badges e banners no frontend.
 *
 * Lógica bidimensional rigorosa e determinística:
 * 1. REGRA SUPREMA: Se registrationEnd for futura, o concurso é OBRIGATORIAMENTE "Concurso Aberto"
 *    com enrollmentLabel "Inscrições abertas", mesmo se cmsStatus for 'em_andamento'.
 * 2. Se registrationStart for futura, enrollmentLabel é "Inscrições ainda não iniciadas" e label "Edital Previsto".
 * 3. Se registrationEnd for passada, enrollmentLabel é "Inscrições encerradas" e label "Em Andamento" ou "Concurso Encerrado".
 * 4. Status CMS explícito 'encerrado' (sem data futura) tem precedência.
 */
export function getContestStatusInfo(post: Partial<Post>): ContestStatusInfo {
  const now = new Date().getTime();
  const targetDateStr = post.enrollmentEndDate || post.examDate;
  const enrollmentStatus = getEnrollmentStatus(post);

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

  const cmsStatus = post.status;

  // ─── 1. Status CMS explícito 'encerrado' (cancelado / suspenso / encerrado administrativamente) ───
  if (cmsStatus === 'encerrado') {
    return {
      isExpired: true,
      label: 'Concurso Encerrado',
      badgeBg: 'bg-slate-700/90 text-slate-100 border border-slate-600',
      badgeText: 'text-slate-100',
      dotColor: 'bg-red-500',
      enrollmentLabel: 'Inscrições encerradas',
      formattedTargetDate,
      formattedExpirationDate,
      expirationNote: formattedTargetDate
        ? `Encerrado em ${formattedTargetDate}`
        : 'Concurso encerrado / Homologado',
    };
  }

  // ─── 2. Inscrições com datas explícitas (Motor Determinístico) ───
  if (enrollmentStatus === 'nao_iniciadas') {
    return {
      isExpired: false,
      label: 'Edital Previsto',
      badgeBg: 'bg-amber-600/95 text-white border border-amber-400/30',
      badgeText: 'text-white',
      dotColor: 'bg-amber-300 animate-pulse motion-reduce:animate-none',
      enrollmentLabel: 'Inscrições ainda não iniciadas',
      formattedTargetDate,
      formattedExpirationDate,
      expirationNote: formattedTargetDate
        ? `Inscrições em breve (até ${formattedTargetDate})`
        : 'Inscrições ainda não iniciadas',
    };
  }

  if (enrollmentStatus === 'abertas') {
    return {
      isExpired: false,
      label: 'Concurso Aberto',
      badgeBg: 'bg-emerald-600/95 text-white border border-emerald-400/30',
      badgeText: 'text-white',
      dotColor: 'bg-emerald-300 animate-pulse motion-reduce:animate-none',
      enrollmentLabel: 'Inscrições abertas',
      formattedTargetDate,
      formattedExpirationDate,
      expirationNote: formattedTargetDate
        ? `Inscrições até ${formattedTargetDate}`
        : 'Inscrições abertas',
    };
  }

  if (enrollmentStatus === 'encerradas') {
    const examPassed = post.examDate && new Date(post.examDate).getTime() < now;
    const isEncerrado = Boolean(examPassed);

    return {
      isExpired: isEncerrado,
      label: isEncerrado ? 'Concurso Encerrado' : 'Em Andamento',
      badgeBg: isEncerrado
        ? 'bg-slate-700/90 text-slate-100 border border-slate-600'
        : 'bg-blue-600/95 text-white border border-blue-400/30',
      badgeText: isEncerrado ? 'text-slate-100' : 'text-white',
      dotColor: isEncerrado ? 'bg-red-500' : 'bg-blue-300 animate-pulse motion-reduce:animate-none',
      enrollmentLabel: 'Inscrições encerradas',
      formattedTargetDate,
      formattedExpirationDate,
      expirationNote: formattedTargetDate
        ? (isEncerrado ? `Encerrado em ${formattedTargetDate}` : `Inscrições encerradas em ${formattedTargetDate}`)
        : (isEncerrado ? 'Concurso encerrado' : 'Inscrições encerradas / Em andamento'),
    };
  }

  // ─── 3. Posts sem datas de inscrição: análise por CMS Status e Heurísticas ───

  // B. Previsto explícito ou heurístico
  const isExplicitlyPrevisto = cmsStatus === 'previsto';
  const isHeuristicPrevisto = !cmsStatus && !targetDateStr && isPrevistoHeuristic(post.title);

  if (isExplicitlyPrevisto || isHeuristicPrevisto) {
    return {
      isExpired: false,
      label: 'Edital Previsto',
      badgeBg: 'bg-amber-600/95 text-white border border-amber-400/30',
      badgeText: 'text-white',
      dotColor: 'bg-amber-300 animate-pulse motion-reduce:animate-none',
      enrollmentLabel: 'Aguardando edital',
      formattedTargetDate,
      formattedExpirationDate,
      expirationNote: 'Edital previsto / Em fase preparatória',
    };
  }

  // C. Em andamento explícito
  if (cmsStatus === 'em_andamento') {
    return {
      isExpired: false,
      label: 'Em Andamento',
      badgeBg: 'bg-blue-600/95 text-white border border-blue-400/30',
      badgeText: 'text-white',
      dotColor: 'bg-blue-300 animate-pulse motion-reduce:animate-none',
      enrollmentLabel: 'Inscrições encerradas',
      formattedTargetDate,
      formattedExpirationDate,
      expirationNote: formattedTargetDate
        ? `Inscrições encerradas em ${formattedTargetDate}`
        : 'Inscrições encerradas / Em andamento',
    };
  }

  // D. Fallback: verificar datas gerais para posts legados
  const expired = isContestExpired(post);
  if (expired) {
    return {
      isExpired: true,
      label: 'Concurso Encerrado',
      badgeBg: 'bg-slate-700/90 text-slate-100 border border-slate-600',
      badgeText: 'text-slate-100',
      dotColor: 'bg-red-500',
      enrollmentLabel: 'Inscrições encerradas',
      formattedTargetDate,
      formattedExpirationDate,
      expirationNote: formattedTargetDate
        ? `Encerrado em ${formattedTargetDate}`
        : 'Concurso encerrado',
    };
  }

  // E. Padrão SEGURO: sem datas e sem status = Previsto (não Aberto)
  return {
    isExpired: false,
    label: 'Edital Previsto',
    badgeBg: 'bg-amber-600/95 text-white border border-amber-400/30',
    badgeText: 'text-white',
    dotColor: 'bg-amber-300 animate-pulse motion-reduce:animate-none',
    enrollmentLabel: 'Aguardando edital',
    formattedTargetDate,
    formattedExpirationDate,
    expirationNote: 'Edital previsto / Em fase preparatória',
  };
}
