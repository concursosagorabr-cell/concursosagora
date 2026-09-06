'use client';

// FIX: Componente de reporte de erro com ofuscação de e-mail contra bots e scrapers - 2026-09-06
interface ReportErrorButtonProps {
  postTitle?: string;
  className?: string;
}

export default function ReportErrorButton({
  postTitle = '',
  className,
}: ReportErrorButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    // Ofuscação de e-mail em tempo de execução para blindagem contra bots
    const user = 'contato';
    const domain = 'concursosagora.com.br';
    const email = `${user}@${domain}`;
    const subject = encodeURIComponent(`Correção: ${postTitle}`);
    const body = encodeURIComponent(
      `Olá, encontrei uma possível inconsistência na matéria "${postTitle}". Detalhes:`
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={
        className ||
        'flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors border border-slate-200 shrink-0 self-start cursor-pointer'
      }
      title="Reportar erro ou retificação de edital"
      aria-label="Reportar erro editorial ou retificação"
    >
      <span aria-hidden="true">🚨</span>
      <span>Reportar Erro</span>
    </button>
  );
}
