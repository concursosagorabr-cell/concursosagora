'use client';

import { useState } from 'react';
import Link from 'next/link';

interface SegmentedAlertBoxProps {
  segmentName: string;
  badgeText?: string;
  whatsappGroupUrl?: string;
  telegramChannelUrl?: string;
}

type Status = 'idle' | 'loading' | 'success' | 'already' | 'error';

export default function SegmentedAlertBox({
  segmentName,
  badgeText = 'Alerta VIP Instantâneo',
  whatsappGroupUrl = 'https://chat.whatsapp.com/concursosagora',
  telegramChannelUrl = 'https://t.me/concursosagorabr',
}: SegmentedAlertBoxProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === 'loading') return;

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, segment: segmentName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Erro ao cadastrar alerta.');
        setStatus('error');
        return;
      }

      setStatus(data.alreadySubscribed ? 'already' : 'success');
      setEmail('');
    } catch {
      setErrorMsg('Erro de conexão. Tente novamente.');
      setStatus('error');
    }
  };

  return (
    <section aria-label={`Alerta de editais para ${segmentName}`} className="my-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-blue-950 text-white shadow-xl border border-emerald-500/30 relative overflow-hidden">
      {/* Glow de fundo */}
      <div className="absolute top-0 right-0 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10 space-y-4">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-black uppercase tracking-wider">
            🔔 {badgeText}
          </span>
        </div>

        <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
          Receba Editais de <span className="text-emerald-400">{segmentName}</span> em 1ª Mão
        </h3>

        <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
          Não perca prazos de inscrição, retificações e novidades para {segmentName}. Escolha como deseja ser avisado gratuitamente:
        </p>

        {/* Botão de Acesso Imediato: Canal VIP no Telegram */}
        <div className="pt-1">
          <a
            href={telegramChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 w-full px-5 py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-400 active:scale-98 text-white font-black text-sm sm:text-base shadow-lg shadow-sky-950/60 hover:shadow-sky-500/25 transition-all duration-200"
          >
            <span>✈️</span>
            <span>Entrar no Canal VIP no Telegram</span>
          </a>
        </div>

        {/* Divisor */}
        <div className="relative flex items-center justify-center py-2">
          <div className="border-t border-slate-700 w-full" />
          <span className="bg-slate-900 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest absolute">
            ou por E-mail
          </span>
        </div>

        {/* Feedback de formulário */}
        {status === 'success' && (
          <div className="bg-emerald-500/20 border border-emerald-400 text-emerald-200 p-3.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2">
            <span>✅</span>
            <span>Alerta ativado com sucesso para {segmentName}!</span>
          </div>
        )}

        {status === 'already' && (
          <div className="bg-blue-500/20 border border-blue-400 text-blue-200 p-3.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2">
            <span>ℹ️</span>
            <span>Você já está cadastrado e receberá os alertas em seu e-mail!</span>
          </div>
        )}

        {(status === 'idle' || status === 'loading' || status === 'error') && (
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === 'error') setStatus('idle');
                }}
                placeholder="Seu melhor e-mail para receber o edital..."
                aria-label={`E-mail para alertas de ${segmentName}`}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-600 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-white active:scale-95 text-slate-900 font-extrabold text-xs sm:text-sm transition-all disabled:opacity-50"
              >
                {status === 'loading' ? 'Ativando...' : 'Ativar Alerta'}
              </button>
            </div>
            {status === 'error' && errorMsg && (
              <p className="text-red-400 text-xs font-medium">{errorMsg}</p>
            )}
          </form>
        )}

        <p className="text-[11px] text-slate-400 text-center sm:text-left">
          100% gratuito. Cancele a qualquer momento.{' '}
          <Link href="/politica-de-privacidade" className="underline hover:text-slate-200">
            Privacidade protegida
          </Link>.
        </p>
      </div>
    </section>
  );
}
