'use client';

// FIX: Link de e-mail com ofuscação contra bots e scrapers - 2026-09-06
export const CENTRAL_CONTACT_EMAIL = 'concursosagorabr@gmail.com';

interface ObfuscatedContactLinkProps {
  user: string;
  domain?: string;
  className?: string;
  subject?: string;
}

export default function ObfuscatedContactLink({
  user,
  domain = 'concursosagora.com.br',
  className = 'text-slate-400 hover:text-white hover:underline',
  subject,
}: ObfuscatedContactLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const mailSubject = subject ? `?subject=${encodeURIComponent(subject)}` : '';
    window.location.href = `mailto:${CENTRAL_CONTACT_EMAIL}${mailSubject}`;
  };

  return (
    <a
      href={`mailto:${CENTRAL_CONTACT_EMAIL}`}
      onClick={handleClick}
      className={className}
      title="Clique para enviar e-mail"
    >
      {user}@{domain}
    </a>
  );
}
