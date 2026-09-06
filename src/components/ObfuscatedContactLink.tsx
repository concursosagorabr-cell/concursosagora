'use client';

// FIX: Link de e-mail com ofuscação contra bots e scrapers - 2026-09-06
interface ObfuscatedContactLinkProps {
  user: string;
  domain?: string;
  className?: string;
}

export default function ObfuscatedContactLink({
  user,
  domain = 'concursosagora.com.br',
  className = 'text-slate-400 hover:text-white hover:underline',
}: ObfuscatedContactLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.location.href = `mailto:${user}@${domain}`;
  };

  return (
    <a
      href="#"
      onClick={handleClick}
      className={className}
      title="Clique para enviar e-mail"
    >
      {user}@{domain}
    </a>
  );
}
