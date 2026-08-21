import React from 'react';
import { WhatsAppIcon, TelegramIcon } from './SocialIcons';

interface CommunityBannerProps {
  className?: string;
  categoryName?: string;
}

export default function CommunityBanner({ className = '', categoryName }: CommunityBannerProps) {
  // URLs configuráveis para canais oficiais
  const whatsappChannelUrl = "https://whatsapp.com/channel/concursosagora";
  const telegramChannelUrl = "https://t.me/concursosagorabr";

  return (
    <aside
      className={`my-8 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white shadow-lg border border-blue-700/40 relative overflow-hidden ${className}`}
      aria-label="Canais de Alertas VIP no WhatsApp e Telegram"
    >
      {/* Detalhe visual de fundo */}
      <div className="absolute -top-12 -right-12 w-44 h-44 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" aria-hidden="true" />
      <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Alertas em Tempo Real
          </div>
          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
            Receba novos editais e vagas {categoryName ? `de ${categoryName}` : ''} direto no celular
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Não perca prazos de inscrição nem editais surpresa. Faça parte dos nossos canais gratuitos e seja avisado no instante em que a notícia for publicada.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto shrink-0">
          <a
            href={whatsappChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200"
            aria-label="Entrar no Canal do WhatsApp"
          >
            <WhatsAppIcon className="w-4 h-4 fill-current" />
            <span>Canal WhatsApp</span>
          </a>

          <a
            href={telegramChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200"
            aria-label="Entrar no Grupo VIP do Telegram"
          >
            <TelegramIcon className="w-4 h-4 fill-current" />
            <span>Telegram VIP</span>
          </a>
        </div>
      </div>
    </aside>
  );
}
