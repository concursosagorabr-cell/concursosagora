'use client';

interface StudyMaterialCTAProps {
  studyMaterialUrl: string;
  bancaName?: string;
  organName?: string;
}

/**
 * Bloco nativo de monetização por afiliação de materiais preparatórios.
 * Só renderiza quando `studyMaterialUrl` está preenchido no Sanity.
 * Visual profissional e não invasivo — sem popups, sem interceptação de cliques.
 */
export default function StudyMaterialCTA({
  studyMaterialUrl,
  bancaName,
  organName,
}: StudyMaterialCTAProps) {
  if (!studyMaterialUrl) return null;

  const subject = bancaName || organName || 'este concurso';

  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
        <div className="space-y-1.5 min-w-0">
          <p className="text-sm sm:text-base font-black text-slate-900 leading-snug">
            📚 Vai prestar este concurso?
          </p>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Baixe o material preparatório e simulados com base no edital oficial da{' '}
            <strong className="text-slate-800">{subject}</strong>.
          </p>
        </div>
        <a
          href={studyMaterialUrl}
          target="_blank"
          rel="nofollow noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold transition-colors shadow-sm shrink-0"
        >
          <span aria-hidden="true">📖</span>
          Ver Material
        </a>
      </div>
      <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">
        Links de afiliado. Ao comprar, o Concursos Agora recebe uma comissão sem custo adicional para você.
      </p>
    </div>
  );
}
