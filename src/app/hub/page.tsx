import { Metadata } from 'next';
import Breadcrumb from '@/components/Breadcrumb';
import HubCard from '@/components/HubCard';
import Sidebar from '@/components/Sidebar';
import { CONTENT_HUBS } from '@/utils/hubs';
import { client } from '@/lib/sanity';
import { recentPostsQuery, allCategoriesQuery } from '@/lib/queries';
import { deduplicateCategories } from '@/utils/categories';

export const metadata: Metadata = {
  title: 'Hubs de Conteúdo — Guia Completo por Áreas e Municípios',
  description:
    'Nossos Hubs de Conteúdo organizam concursos por áreas específicas (Policiais, Tribunais, Bancários, Fiscais, Saúde, Educação e Municipais).',
  alternates: { canonical: 'https://concursosagora.com.br/hub' },
};

export const revalidate = 60;

export default async function HubsIndexPage() {
  const [recentPosts, categories] = await Promise.all([
    client.fetch(recentPostsQuery),
    client.fetch(allCategoriesQuery),
  ]);

  const uniqueCategories = deduplicateCategories(categories);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumb items={[{ label: 'Hubs de Conteúdo' }]} />

      {/* Header do Hub Central */}
      <header className="mb-10 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-8 md:p-10 rounded-3xl shadow-xl border border-blue-900/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
            🎯 Arquitetura de Conteúdo SEO
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            Hubs de Conteúdo & Silos Temáticos
          </h1>
          <p className="text-blue-100/90 text-sm md:text-base leading-relaxed">
            Navegue pelos guias pilares do portal. Nossos Hubs organizam editais, notícias e provas
            por áreas de atuação e esferas governamentais, facilitando a busca pelo seu concurso dos sonhos.
          </p>
        </div>
      </header>

      {/* Conteúdo com Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span>📚</span> Todos os Hubs de Conteúdo
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              {CONTENT_HUBS.length} hubs pilares
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CONTENT_HUBS.map((hub) => (
              <HubCard key={hub.slug} hub={hub} />
            ))}
          </div>
        </div>

        <Sidebar recentPosts={recentPosts} categories={uniqueCategories} />
      </div>
    </div>
  );
}
