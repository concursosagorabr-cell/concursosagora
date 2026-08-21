import PostCard from './PostCard';
import { Post } from '@/types';

interface HeroProps {
  featuredPost?: Post;
}

export default function Hero({ featuredPost }: HeroProps) {
  if (!featuredPost) return null;

  return (
    <section className="mb-12" aria-label="Destaque Principal">
      <div className="mb-4 flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" aria-hidden="true"></span>
        <span>Destaque Principal</span>
      </div>
      <PostCard post={featuredPost} featured />
    </section>
  );
}
