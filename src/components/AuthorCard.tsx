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
    <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl flex flex-col sm:flex-row items-center sm:items-start gap-4 my-8">
      <div className="relative w-20 h-20 rounded-full overflow-hidden shrink-0 border-2 border-blue-500 shadow-md">
        <Image
          src={avatarUrl}
          alt={author.name}
          fill
          className="object-cover"
          sizes="80px"
        />
      </div>
      <div className="text-center sm:text-left space-y-2">
        <div>
          <h4 className="text-base font-bold text-slate-900">
            {author.name}
          </h4>
          {author.facebookUrl && (
            <a 
              href={author.facebookUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors mt-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Acompanhe no Facebook
            </a>
          )}
        </div>
        {renderBio()}
      </div>
    </div>
  );
}
