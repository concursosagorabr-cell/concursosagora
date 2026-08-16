import React from 'react';
import { InstagramIcon } from './SocialIcons';

interface InstagramFollowBoxProps {
  className?: string;
}

export default function InstagramFollowBox({ className = '' }: InstagramFollowBoxProps) {
  return (
    <div
      className={`my-8 relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900 via-slate-900 to-rose-950 p-6 sm:p-8 text-white shadow-xl border border-rose-500/20 ${className}`}
    >
      {/* Detalhes de iluminação de fundo */}
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-rose-500/20 blur-3xl pointer-events-none" />
      <div className="absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-rose-500/30 to-purple-500/30 border border-rose-400/30 text-rose-300 text-xs font-bold uppercase tracking-wider">
            <InstagramIcon className="w-3.5 h-3.5" />
            <span>Comunidade no Instagram</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
            Não perca nenhum edital aberto no seu estado!
          </h3>

          <p className="text-sm text-slate-300 leading-relaxed">
            Acompanhe o <span className="font-bold text-white">@concursosagora_</span> para receber alertas urgentes em 1ª mão nos Stories, resumos esquematizados de salários e simulados diários.
          </p>

          {/* Destaques */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs text-rose-200 font-medium">
            <span className="flex items-center gap-1">⚡ Alertas em tempo real</span>
            <span className="flex items-center gap-1">💰 Tabelas de remuneração</span>
            <span className="flex items-center gap-1">📝 Questões comentadas</span>
          </div>
        </div>

        {/* Botão de Seguir */}
        <div className="shrink-0 w-full md:w-auto">
          <a
            href="https://www.instagram.com/concursosagora_/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full md:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:from-amber-400 hover:via-rose-400 hover:to-purple-500 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-rose-500/25 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200"
          >
            <InstagramIcon className="w-5 h-5" />
            <span>Seguir @concursosagora_</span>
          </a>
        </div>
      </div>
    </div>
  );
}
