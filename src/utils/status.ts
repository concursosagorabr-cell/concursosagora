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

  if (post.status === 'encerrado') {
    return true;
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
      const twelveMonthsMs = 365 * 24 * 60 * 60 * 1000;
      return creationTime + twelveMonthsMs < now;
    }
  }

  return false;
}

/**
 * Determina se as inscrições estão abertas, encerradas ou indefinidas.
 */
function getEnrollmentStatus(post: Partial<Post>): 'abertas' | 'encerradas' | null {
  const edStr = post.enrollmentEndDate;
  if (!edStr || typeof edStr !== 'string' || edStr.trim().length === 0) {
    return null;
  }

  const now = new Date().getTime();
  const edTime = new Date(edStr).getTime();
  if (isNaN(edTime)) return null;

  return edTime < now ? 'encerradas' : 'abertas';
}

/**
 * Retorna informações completas de status e estilo visual para badges e banners no frontend.
 *
 * Lógica bidimensional (auditoria set/2026):
 * 1. Status CMS explícito tem prioridade máxima.
 * 2. Se status='aberto' mas datas estão expiradas, CORRIGIR automaticamente para 'Em Andamento' ou 'Encerrado'.
 * 3. Nunca inferir "Concurso Aberto" quando enrollmentEndDate estiver no passado.
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

  // ─── 1. Encerrado explícito ───
  const cmsStatus = post.status;

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

  // ─── 2. Previsto explícito ou heurístico ───
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

  // ─── 3. Em andamento (inscrições encerradas, certame em curso) ───
  const isExplicitlyEmAndamento = cmsStatus === 'em_andamento';
  // REGRA CRÍTICA: Se status CMS é 'aberto' mas inscrições já expiraram, forçar "Em Andamento"
  const isImplicitlyEmAndamento =
    (cmsStatus === 'aberto' || !cmsStatus) &&
    enrollmentStatus === 'encerradas';

  // Verificar se a prova também já aconteceu (certame totalmente encerrado)
  if (isImplicitlyEmAndamento && post.examDate) {
    const examTime = new Date(post.examDate).getTime();
    if (!isNaN(examTime) && examTime < now) {
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
  }

  if (isExplicitlyEmAndamento || isImplicitlyEmAndamento) {
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

  // ─── 4. Fallback: verificar datas para posts sem status CMS ───
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

  // ─── 5. Concurso genuinamente aberto ───
  let expirationNote = '';
  if (targetDateStr) {
    expirationNote = `Inscrições até ${formattedTargetDate}`;
  }

  return {
    isExpired: false,
    label: 'Concurso Aberto',
    badgeBg: 'bg-emerald-600/95 text-white border border-emerald-400/30',
    badgeText: 'text-white',
    dotColor: 'bg-emerald-300 animate-pulse motion-reduce:animate-none',
    enrollmentLabel: enrollmentStatus === 'abertas' ? 'Inscrições abertas' : undefined,
    formattedTargetDate,
    formattedExpirationDate,
    expirationNote,
  };
}
