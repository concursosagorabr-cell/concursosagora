'use client';

import { useState } from 'react';
import Link from 'next/link';

type Status = 'idle' | 'loading' | 'success' | 'already' | 'error';

export default function Newsletter() {
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
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Erro ao se cadastrar. Tente novamente.');
        setStatus('error');
        return;
      }

      setStatus(data.alreadySubscribed ? 'already' : 'success');
      setEmail('');
    } catch {
      setErrorMsg('Falha na conexão. Verifique sua internet e tente novamente.');
      setStatus('error');
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-700 to-indigo-900 text-white p-6 md:p-8 rounded-2xl shadow-xl relative overflow-hidden">
      {/* Decoração de fundo */}
      <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full" aria-hidden="true" />
      <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full" aria-hidden="true" />

      <div className="relative z-10 space-y-4">
        <span className="bg-white/20 backdrop-blur text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          Boletim Gratuito
        </span>

        <h3 className="text-xl md:text-2xl font-extrabold leading-tight">
          Receba Alertas de Novos Editais
        </h3>

        <p className="text-blue-100 text-xs md:text-sm leading-relaxed">
          Cadastre-se e seja o primeiro a saber sobre concursos abertos, editais e convocações.
        </p>

        {/* ── Estado: sucesso (novo cadastro) ── */}
        {status === 'success' && (
          <div className="bg-emerald-500/20 border border-emerald-400/60 text-emerald-100 p-4 rounded-xl text-sm font-semibold flex items-start gap-2">
            <span className="text-lg shrink-0">✓</span>
            <span>Cadastro realizado! Fique atento à sua caixa de entrada.</span>
          </div>
        )}

        {/* ── Estado: já cadastrado ── */}
        {status === 'already' && (
          <div className="bg-blue-500/20 border border-blue-300/40 text-blue-100 p-4 rounded-xl text-sm font-semibold flex items-start gap-2">
            <span className="text-lg shrink-0">ℹ️</span>
            <span>Este e-mail já está cadastrado. Você continuará recebendo os alertas!</span>
          </div>
        )}

        {/* ── Formulário (idle, loading ou error) ── */}
        {(status === 'idle' || status === 'loading' || status === 'error') && (
          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            <div className="space-y-1.5">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === 'error') setStatus('idle');
                }}
                placeholder="Digite seu melhor e-mail..."
                disabled={status === 'loading'}
                aria-label="Seu endereço de e-mail"
                className={`w-full px-4 py-3 rounded-xl bg-white/10 backdrop-blur border text-white placeholder-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors disabled:opacity-60 ${
                  status === 'error'
                    ? 'border-red-400/70 focus:ring-red-400/40'
                    : 'border-white/20'
                }`}
              />
              {status === 'error' && errorMsg && (
                <p className="text-red-300 text-xs font-medium px-1">{errorMsg}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full py-3 bg-white text-blue-900 font-bold text-sm rounded-xl hover:bg-blue-50 active:scale-95 transition-all duration-150 shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {status === 'loading' ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4 text-blue-700"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Cadastrando...
                </>
              ) : (
                'Quero Receber Alertas'
              )}
            </button>

            <p className="text-blue-200 text-xs text-center leading-relaxed">
              Sem spam. Cancele quando quiser.{' '}
              <Link
                href="/politica-de-privacidade"
                className="underline underline-offset-2 hover:text-white transition-colors"
              >
                Política de Privacidade
              </Link>
            </p>
          </form>
        )}

        {/* Botão para novo cadastro após sucesso/já cadastrado */}
        {(status === 'success' || status === 'already') && (
          <button
            onClick={() => { setStatus('idle'); setEmail(''); }}
            className="text-blue-200 hover:text-white text-xs underline underline-offset-2 transition-colors"
          >
            Cadastrar outro e-mail
          </button>
        )}
      </div>
    </div>
  );
}
