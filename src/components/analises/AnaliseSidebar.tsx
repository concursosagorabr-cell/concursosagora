import Link from 'next/link';
import type { Analise, Post } from '@/types';
import { formatAnaliseDate, getAnaliseReadingMinutes } from '@/content/analises';

interface AnaliseSidebarProps {
  analises: Analise[];
  currentSlug: string;
  recentPosts?: Post[];
}

function formatPostDate(date?: string): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: 'short',
  });
}

export default function AnaliseSidebar({
  analises,
  currentSlug,
  recentPosts = [],
}: AnaliseSidebarProps) {
  const otherAnalises = analises.filter((analise) => analise.slug !== currentSlug);

  return (
    <aside className="space-y-6 lg:sticky lg:top-24">
      <div className="rounded-2xl bg-slate-950 p-6 text-white shadow-xl ring-1 ring-slate-800">
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-400">
          Radar de editais
        </span>
        <h2 className="mt-2 text-xl font-black leading-tight">
          Sua próxima aprovação começa aqui
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          Editais abertos, salários e cronogramas atualizados todos os dias.
        </p>

        <div className="mt-4 space-y-2">
          <Link
            href="/concursos"
            className="flex items-center justify-between rounded-xl bg-amber-400 px-4 py-3 text-sm font-black text-slate-950 transition-colors hover:bg-amber-300"
          >
            <span>Explorar vagas abertas</span>
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            href="/concursos/salario-acima-de-10-mil"
            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
          >
            <span>Salários acima de R$ 10 mil</span>
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            href="/hub"
            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
          >
            <span>Guias por área</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      {otherAnalises.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
            Nesta seção
          </h2>
          <div className="mt-3 space-y-4">
            {otherAnalises.slice(0, 4).map((analise) => (
              <Link
                key={analise.slug}
                href={`/analises/${analise.slug}`}
                className="group block border-b border-slate-100 pb-3 last:border-0 last:pb-0"
              >
                <p className="text-sm font-bold leading-snug text-slate-900 transition-colors group-hover:text-amber-700">
                  {analise.shortTitle}
                </p>
                <span className="mt-1 block text-[11px] font-medium text-slate-500">
                  {formatAnaliseDate(analise.publishedAt)} ·{' '}
                  {getAnaliseReadingMinutes(analise)} min
                </span>
              </Link>
            ))}
          </div>
          <Link
            href="/analises"
            className="mt-4 inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider text-amber-700 hover:text-amber-800"
          >
            Ver todas as análises <span aria-hidden="true">→</span>
          </Link>
        </div>
      )}

      {recentPosts.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
            Últimas notícias
          </h2>
          <ol className="mt-3 space-y-3">
            {recentPosts.slice(0, 5).map((post, index) => (
              <li key={post._id} className="flex gap-3">
                <span className="mt-0.5 text-sm font-black text-amber-500">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <Link
                    href={`/post/${post.slug || post._id}`}
                    className="line-clamp-2 text-sm font-bold leading-snug text-slate-800 transition-colors hover:text-blue-600"
                  >
                    {post.title}
                  </Link>
                  <span className="mt-0.5 block text-[11px] font-medium text-slate-500">
                    {formatPostDate(post.publishedAt)}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <h2 className="text-sm font-black text-slate-900">Concursos Agora no YouTube</h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">
          Análises de editais, estratégias de estudo e bastidores dos principais concursos do país.
        </p>
        <a
          href="https://www.youtube.com/@ConcursosAgora"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-blue-700 hover:text-blue-800"
        >
          Inscrever-se no canal <span aria-hidden="true">→</span>
        </a>
      </div>
    </aside>
  );
}
