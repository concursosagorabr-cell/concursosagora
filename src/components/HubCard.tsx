import Link from 'next/link';
import { ContentHub } from '@/utils/hubs';

interface HubCardProps {
  hub: ContentHub;
}

export default function HubCard({ hub }: HubCardProps) {
  return (
    <article className="group bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-full relative overflow-hidden">
      {/* Decoração sutil de fundo */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />

      <div className="space-y-4 relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-3xl p-3 bg-blue-50 rounded-2xl group-hover:scale-110 transition-transform inline-block">
            {hub.icon}
          </span>
          <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
            Hub de Conteúdo
          </span>
        </div>

        <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
          <Link href={`/hub/${hub.slug}`}>
            {hub.title}
          </Link>
        </h3>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
          {hub.description}
        </p>

        {/* Sub-silos / Filtros rápidos em destaque */}
        <div className="pt-2 flex flex-wrap gap-1.5">
          {hub.subSilos.slice(0, 4).map((sub, idx) => (
            <span
              key={idx}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/60"
            >
              {sub.title}
            </span>
          ))}
          {hub.subSilos.length > 4 && (
            <span className="text-[10px] font-medium text-slate-400 self-center">
              +{hub.subSilos.length - 4} sub-silos
            </span>
          )}
        </div>
      </div>

      <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 relative z-10">
        <Link href={`/hub/${hub.slug}`} className="flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
          <span>Explorar Hub Completo</span>
          <span>→</span>
        </Link>
      </div>
    </article>
  );
}
