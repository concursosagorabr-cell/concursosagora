import Link from 'next/link';
import { getMatchingHubForPost } from '@/utils/hubs';

interface PostHubWidgetProps {
  postTitle: string;
  categoryTitles?: string[];
}

export default function PostHubWidget({ postTitle, categoryTitles = [] }: PostHubWidgetProps) {
  const hub = getMatchingHubForPost(postTitle, categoryTitles);

  if (!hub) return null;

  return (
    <section aria-label="Guia de Concursos Relacionado" className="my-8">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900/90 via-slate-900 to-indigo-950 text-white border border-blue-500/30 shadow-lg relative overflow-hidden">
        {/* Efeito visual de brilho */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-xl">{hub.icon}</span>
              <span className="text-xs font-black uppercase tracking-widest px-2.5 py-0.5 rounded bg-blue-500/30 text-blue-200 border border-blue-400/30">
                Guia Especializado
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
              {hub.title}
            </h3>
            <p className="text-xs text-blue-100/90 leading-relaxed line-clamp-2">
              {hub.description}
            </p>
          </div>

          <Link
            href={`/hub/${hub.slug}`}
            className="shrink-0 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
          >
            <span>Acessar Guia Completo</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
