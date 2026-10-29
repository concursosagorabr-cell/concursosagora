'use client';

import React, { useState } from 'react';
import { WhatsAppIcon, TelegramIcon, XIcon, GoogleNewsIcon } from './SocialIcons';

interface ShareButtonsProps {
  title: string;
  url: string;
  excerpt?: string;
  className?: string;
  compact?: boolean;
}

export default function ShareButtons({
  title,
  url,
  excerpt = '',
  className = '',
  compact = false,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const whatsappMessage = `🚨 *${title}*\n\nConfira vagas, salários e como se inscrever no edital:\n👉 ${url}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`🚨 ${title}`)}`;
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  const googleNewsUrl = `https://news.google.com/search?q=Concursos+Agora&hl=pt-BR&gl=BR&ceid=BR:pt-419`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback silencioso
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: excerpt || title,
          url,
        });
      } catch {
        // Ignora cancelamento pelo usuário
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div
      className={`flex flex-wrap items-center gap-2.5 py-3 ${className}`}
      aria-label="Compartilhar matéria"
    >
      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mr-1 flex items-center gap-1.5">
        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
          <polyline points="16 6 12 2 8 6"/>
          <line x1="12" y1="2" x2="12" y2="15"/>
        </svg>
        Compartilhar:
      </span>

      {/* WhatsApp (1-Click) */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm hover:shadow transition-all duration-200"
        aria-label="Compartilhar no WhatsApp"
      >
        <WhatsAppIcon className="w-4 h-4 fill-current" />
        <span>WhatsApp</span>
      </a>

      {/* Telegram */}
      <a
        href={telegramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-sm transition-all duration-200"
        aria-label="Compartilhar no Telegram"
      >
        <TelegramIcon className="w-4 h-4 fill-current" />
        <span>Telegram</span>
      </a>

      {/* X / Twitter */}
      <a
        href={xUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold shadow-sm transition-all duration-200"
        aria-label="Compartilhar no X (Twitter)"
      >
        <XIcon className="w-3.5 h-3.5 fill-current" />
        <span>X</span>
      </a>

      {/* Google News */}
      <a
        href={googleNewsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-xs font-medium transition-all duration-200"
        aria-label="Seguir no Google Notícias"
      >
        <GoogleNewsIcon className="w-3.5 h-3.5 fill-current text-blue-600 dark:text-blue-400" />
        <span className="hidden sm:inline">Google Notícias</span>
      </a>

      {/* Copiar Link / Native Share */}
      <button
        type="button"
        onClick={handleNativeShare}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 transition-all duration-200 cursor-pointer"
        aria-label="Copiar link da matéria"
      >
        {copied ? (
          <>
            <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span className="text-emerald-700 dark:text-emerald-300 font-semibold">Copiado!</span>
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            <span>Copiar Link</span>
          </>
        )}
      </button>
    </div>
  );
}
