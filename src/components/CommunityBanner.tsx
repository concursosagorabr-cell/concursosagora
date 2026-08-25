import React from 'react';
import { TelegramIcon } from './SocialIcons';

interface CommunityBannerProps {
  className?: string;
  categoryName?: string;
}

export default function CommunityBanner({ className = '', categoryName }: CommunityBannerProps) {
  const telegramChannelUrl = "https://t.me/concursosagorabr";

  return (
    <aside
      className={`my-8 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-sky-950 via-slate-900 to-indigo-950 text-white shadow-lg border border-sky-600/40 relative overflow-hidden ${className}`}
      aria-label="Canal de Alertas VIP no Telegram"
    >
      {/* Detalhe visual de fundo */}
      <div className="absolute -top-12 -right-12 w-44 h-44 bg-sky-500/15 rounded-full blur-2xl pointer-events-none" aria-hidden="true" />
      <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            Alertas em Tempo Real
          </div>
          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
            Receba novos editais e vagas {categoryName ? `de ${categoryName}` : ''} no Telegram
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Não perca prazos de inscrição nem editais surpresa. Faça parte do nosso canal VIP gratuito no Telegram e seja avisado no instante da publicação.
          </p>
        </div>

        <div className="w-full md:w-auto shrink-0">
          <a
            href={telegramChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-98 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-sky-500/30 transition-all duration-200"
            aria-label="Entrar no Canal VIP do Telegram"
          >
            <TelegramIcon className="w-4 h-4 fill-current" />
            <span>Entrar no Telegram VIP</span>
          </a>
        </div>
      </div>
    </aside>
  );
}
