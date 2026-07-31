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

    if (typeof author.bio === 'string') {
      return (
        <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {author.bio}
        </p>
      );
    }

    if (Array.isArray(author.bio)) {
      return (
        <div className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          <PortableText value={author.bio} />
        </div>
      );
    }

    if (typeof author.bio === 'object') {
      return (
        <div className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          <PortableText value={[author.bio as any]} />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row items-center sm:items-start gap-4 my-8">
      <div className="relative w-20 h-20 rounded-full overflow-hidden shrink-0 border-2 border-blue-500 shadow-md">
        <Image
          src={avatarUrl}
          alt={author.name}
          fill
          className="object-cover"
          sizes="80px"
        />
      </div>
      <div className="text-center sm:text-left space-y-1">
        <h4 className="text-base font-bold text-slate-900 dark:text-white">
          {author.name}
        </h4>
        {renderBio()}
      </div>
    </div>
  );
}
