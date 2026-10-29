'use client';

export default function CookiePreferencesButton() {
  const handleClick = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-cookie-preferences'));
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="hover:underline text-slate-400 hover:text-white transition-colors cursor-pointer text-xs"
      aria-label="Abrir painel de preferências de cookies e privacidade"
    >
      Preferências de Cookies
    </button>
  );
}
