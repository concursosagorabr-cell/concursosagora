'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getConsentCookie,
  setConsentCookie,
  updateGtagConsent,
  type ConsentChoices,
} from '@/lib/consent';

/* ─────────────────────────────────────────────────────────────────────────────
   Componente auxiliar: Toggle Switch
───────────────────────────────────────────────────────────────────────────── */
function Toggle({
  id,
  checked,
  onChange,
  disabled = false,
}: {
  id: string;
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
        checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Componente principal: CookieBanner
───────────────────────────────────────────────────────────────────────────── */
export default function CookieBanner() {
  const [bannerVisible, setBannerVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [floatingVisible, setFloatingVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [choices, setChoices] = useState<ConsentChoices>({
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    setMounted(true);
    const saved = getConsentCookie();
    if (saved) {
      // Restauração imediata — deve ocorrer bem antes do wait_for_update expirar
      updateGtagConsent(saved);
      setChoices(saved);
      setFloatingVisible(true);
    } else {
      // Mostra o banner rapidamente, mas após o primeiro paint
      const t = setTimeout(() => setBannerVisible(true), 200);
      return () => clearTimeout(t);
    }
  }, []);

  const save = (c: ConsentChoices, closeModal = false) => {
    setConsentCookie(c);
    updateGtagConsent(c);
    setChoices(c);
    setBannerVisible(false);
    if (closeModal) setModalOpen(false);
    setFloatingVisible(true);
  };

  const acceptAll = () => save({ analytics: true, marketing: true });
  const rejectAll = () => save({ analytics: false, marketing: false });
  const saveCustom = () => save(choices, true);

  const openModal = () => {
    setBannerVisible(false);
    setModalOpen(true);
  };

  if (!mounted) return null;

  return (
    <>
      {/* ── Banner principal ── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Configurações de privacidade e cookies"
        className={`fixed bottom-0 left-0 right-0 z-[200] transition-transform duration-500 ease-out ${
          bannerVisible && !modalOpen
            ? 'translate-y-0'
            : 'translate-y-full pointer-events-none'
        }`}
      >
        <div className="p-3 md:p-5">
          <div className="max-w-5xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            {/* Faixa colorida topo */}
            <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500" />

            <div className="p-5 md:p-6">
              <div className="flex flex-col md:flex-row md:items-start gap-5">
                {/* Texto */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl" aria-hidden="true">🍪</span>
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Privacidade e Cookies
                    </h2>
                    <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 ml-1">
                      LGPD
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Usamos cookies conforme a{' '}
                    <strong className="text-slate-800 dark:text-slate-100 font-semibold">
                      Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)
                    </strong>
                    . Cookies essenciais garantem o funcionamento do site e não podem ser desativados.
                    Cookies de análise nos ajudam a entender como o site é usado — estes só são ativados
                    com o seu consentimento.{' '}
                    <Link
                      href="/politica-de-privacidade"
                      className="text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:no-underline font-medium"
                    >
                      Política de Privacidade
                    </Link>
                  </p>
                </div>

                {/* Botões */}
                <div className="flex flex-row md:flex-col gap-2 md:min-w-[190px] shrink-0">
                  <button
                    onClick={acceptAll}
                    className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-bold transition-all duration-150 shadow-md shadow-blue-500/20"
                  >
                    Aceitar todos
                  </button>
                  <button
                    onClick={rejectAll}
                    className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 text-sm font-bold transition-all duration-150"
                  >
                    Apenas essenciais
                  </button>
                  <button
                    onClick={openModal}
                    className="flex-1 md:flex-none px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 active:scale-95 text-slate-600 dark:text-slate-300 text-sm font-medium transition-all duration-150"
                  >
                    Personalizar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal de preferências ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-3 sm:p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setModalOpen(false);
              if (!getConsentCookie()) setBannerVisible(true);
            }}
            aria-hidden="true"
          />

          {/* Painel */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Preferências de cookies"
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            {/* Header */}
            <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500" />
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xl" aria-hidden="true">🍪</span>
                <h2 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Preferências de Cookies
                </h2>
              </div>
              <button
                onClick={() => {
                  setModalOpen(false);
                  if (!getConsentCookie()) setBannerVisible(true);
                }}
                aria-label="Fechar"
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>

            {/* Corpo */}
            <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Selecione quais categorias de cookies deseja permitir. Você pode alterar suas
                preferências a qualquer momento. Para mais informações, consulte nossa{' '}
                <Link
                  href="/politica-de-privacidade"
                  className="text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:no-underline"
                  onClick={() => setModalOpen(false)}
                >
                  Política de Privacidade
                </Link>
                .
              </p>

              {/* Categoria: Essenciais */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      Cookies Essenciais
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400">
                      Sempre ativo
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Necessários para o funcionamento básico do site (navegação, segurança). Não coletam dados pessoais identificáveis e não podem ser desativados conforme a LGPD.
                  </p>
                </div>
                <Toggle id="toggle-essential" checked={true} disabled />
              </div>

              {/* Categoria: Análise */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                    Cookies de Análise e Desempenho
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Usados pelo <strong className="font-medium text-slate-600 dark:text-slate-300">Google Analytics (GA4)</strong> e{' '}
                    <strong className="font-medium text-slate-600 dark:text-slate-300">Vercel Speed Insights</strong> para medir visitas, páginas mais acessadas e desempenho.
                    Os dados são anonimizados e não identificam você pessoalmente.
                  </p>
                </div>
                <Toggle
                  id="toggle-analytics"
                  checked={choices.analytics}
                  onChange={(v) => setChoices((c) => ({ ...c, analytics: v }))}
                />
              </div>

              {/* Categoria: Marketing */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                    Cookies de Marketing
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Permitem exibir anúncios personalizados com base nos seus interesses. Atualmente não utilizamos cookies de marketing, mas esta opção estará disponível no futuro.
                  </p>
                </div>
                <Toggle
                  id="toggle-marketing"
                  checked={choices.marketing}
                  onChange={(v) => setChoices((c) => ({ ...c, marketing: v }))}
                />
              </div>

              {/* Base legal */}
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60">
                <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
                  <strong>Base legal (LGPD — Art. 7º, I):</strong> o tratamento de dados de análise é realizado mediante o seu consentimento expresso, que pode ser retirado a qualquer momento clicando no ícone 🍪 na parte inferior da tela.
                </p>
              </div>
            </div>

            {/* Rodapé */}
            <div className="flex flex-col sm:flex-row gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={rejectAll}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 text-sm font-bold transition-all duration-150"
              >
                Apenas essenciais
              </button>
              <button
                onClick={saveCustom}
                className="flex-1 px-4 py-2.5 rounded-xl border border-blue-300 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 active:scale-95 text-blue-700 dark:text-blue-400 text-sm font-bold transition-all duration-150"
              >
                Salvar preferências
              </button>
              <button
                onClick={acceptAll}
                className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-bold transition-all duration-150 shadow-md shadow-blue-500/20"
              >
                Aceitar todos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Botão flutuante para rever preferências ── */}
      <button
        onClick={() => {
          const saved = getConsentCookie();
          if (saved) setChoices(saved);
          setModalOpen(true);
        }}
        aria-label="Configurações de cookies"
        title="Configurações de cookies"
        className={`fixed bottom-4 left-4 z-[150] w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg text-lg hover:scale-110 active:scale-95 transition-all duration-200 ${
          floatingVisible && !bannerVisible && !modalOpen
            ? 'opacity-100'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        🍪
      </button>
    </>
  );
}
