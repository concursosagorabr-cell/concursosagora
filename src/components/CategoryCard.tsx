import Link from 'next/link';
import { Category } from '@/types';

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const categoryLink = `/categoria/${category.slug || category._id}`;

  return (
    <Link
      href={categoryLink}
      className="group p-6 bg-white border border-slate-200 rounded-2xl shadow-xs hover:shadow-md hover:border-blue-500 transition-all flex flex-col justify-between"
    >
      <div>
        <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
          {category.title}
        </h3>
        {category.description && (
          <p className="text-slate-600 text-sm mt-2 line-clamp-2 leading-relaxed">
            {category.description}
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center text-xs font-semibold text-blue-600">
        <span>Explorar concursos</span>
        <span className="ml-1 group-hover:translate-x-1 transition-transform" aria-hidden="true">→</span>
      </div>
    </Link>
  );
}
