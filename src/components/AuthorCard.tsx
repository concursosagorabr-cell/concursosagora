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
      <div className="text-center sm:text-left space-y-1">
        <h4 className="text-base font-bold text-slate-900">
          {author.name}
        </h4>
        {renderBio()}
      </div>
    </div>
  );
}
