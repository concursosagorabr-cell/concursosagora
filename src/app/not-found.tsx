import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md space-y-6">
        <span className="text-6xl">🔍</span>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">
          Página não encontrada
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          A página ou notícia que você procurava não foi encontrada ou foi movida.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-full transition-colors shadow-md"
          >
            🏠 Voltar ao Início
          </Link>
        </div>
      </div>
    </main>
  );
}
