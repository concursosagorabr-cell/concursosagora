import Link from 'next/link';
import { ContentHub } from '@/utils/hubs';

interface HubCardProps {
  hub: ContentHub;
}

export default function HubCard({ hub }: HubCardProps) {
  return (
    <article className="group bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs hover:shadow-lg hover:border-blue-300 transition-all duration-300 flex flex-col justify-between h-full relative overflow-hidden">
      {/* Decoração sutil de fundo */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />

      <div className="space-y-3 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl p-2 bg-blue-50/80 rounded-xl group-hover:scale-110 transition-transform inline-flex items-center justify-center">
              {hub.icon}
            </span>
            <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
              Guia de Carreira
            </span>
          </div>
        </div>

        <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
          <Link href={`/hub/${hub.slug}`}>
            {hub.title}
          </Link>
        </h3>

        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
          {hub.description}
        </p>

        {/* Sub-silos em destaque */}
        <div className="pt-1 flex flex-wrap gap-1.5">
          {hub.subSilos.slice(0, 3).map((sub, idx) => (
            <span
              key={idx}
              className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100/90 text-slate-700 border border-slate-200/60"
            >
              {sub.title}
            </span>
          ))}
          {hub.subSilos.length > 3 && (
            <span className="text-xs font-semibold text-slate-600 self-center">
              +{hub.subSilos.length - 3}
            </span>
          )}
        </div>
      </div>

      <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 relative z-10">
        <Link href={`/hub/${hub.slug}`} className="flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
          <span>Acessar Guia de Editais</span>
          <span>→</span>
        </Link>
      </div>
    </article>
  );
}

