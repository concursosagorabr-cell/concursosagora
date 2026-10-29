import Image from 'next/image';
import { Author } from '@/types';
import { getImageUrl } from '@/lib/image';
import PortableText from './PortableText';

interface AuthorCardProps {
  author?: Author;
}

export default function AuthorCard({ author }: AuthorCardProps) {
  if (!author) return null;

  const avatarUrl = getImageUrl(author.image, 160, 160);

  const renderBio = () => {
    if (!author.bio) return null;

    const bioClass = "text-xs md:text-sm text-slate-600 leading-relaxed";

    if (typeof author.bio === 'string') {
      return (
        <p className={bioClass}>
          {author.bio}
        </p>
      );
    }

    if (Array.isArray(author.bio) || typeof author.bio === 'object') {
      const bioValue = Array.isArray(author.bio) ? author.bio : [author.bio as any];
      return (
        <div className={bioClass}>
          <PortableText value={bioValue} />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl flex flex-col sm:flex-row items-center sm:items-start gap-4 my-8 shadow-xs">
      <div className="relative w-20 h-20 rounded-full overflow-hidden shrink-0 border-2 border-blue-500 shadow-md">
        <Image
          src={avatarUrl}
          alt={`Foto de perfil de ${author.name}`}
          width={80}
          height={80}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="text-center sm:text-left space-y-2.5 flex-1">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
            <h4 className="text-base font-bold text-slate-900">
              {author.name}
            </h4>
            {author.role && (
              <span className="inline-block text-xs font-semibold text-blue-800 bg-blue-100/80 px-2.5 py-0.5 rounded-full border border-blue-200/60 self-center sm:self-auto">
                {author.role}
              </span>
            )}
          </div>

          {/* Perfis sociais verificáveis */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2">
            {author.linkedinUrl && (
              <a
                href={author.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Perfil no LinkedIn de ${author.name}`}
                className="inline-flex items-center gap-1 text-xs text-[#0a66c2] hover:text-[#004182] font-semibold transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                <span>LinkedIn</span>
              </a>
            )}
            {author.twitterUrl && (
              <a
                href={author.twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Perfil no X de ${author.name}`}
                className="inline-flex items-center gap-1 text-xs text-slate-800 hover:text-black font-semibold transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span>X (Twitter)</span>
              </a>
            )}
            {author.instagramUrl && (
              <a
                href={author.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Perfil no Instagram de ${author.name}`}
                className="inline-flex items-center gap-1 text-xs text-[#e4405f] hover:text-[#c13584] font-semibold transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                <span>Instagram</span>
              </a>
            )}
            {author.facebookUrl && (
              <a
                href={author.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Perfil no Facebook de ${author.name}`}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>Facebook</span>
              </a>
            )}
          </div>
        </div>
        {renderBio()}
      </div>
    </div>
  );
}
