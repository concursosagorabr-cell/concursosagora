import Link from 'next/link';
import { InstagramIcon, FacebookIcon, XIcon, ThreadsIcon, YouTubeIcon } from './SocialIcons';

interface RegionItem {
  label: string;
  query: string;
  highlight?: boolean;
}

const REGION_ITEMS: RegionItem[] = [
  { label: 'NACIONAL', query: 'nacional', highlight: true },
  { label: 'AC', query: 'ac' },
  { label: 'AL', query: 'al' },
  { label: 'AM', query: 'am' },
  { label: 'AP', query: 'ap' },
  { label: 'BA', query: 'ba' },
  { label: 'CE', query: 'ce' },
  { label: 'DF', query: 'df' },
  { label: 'ES', query: 'es' },
  { label: 'GO', query: 'go' },
  { label: 'MA', query: 'ma' },
  { label: 'MG', query: 'mg' },
  { label: 'MS', query: 'ms' },
  { label: 'MT', query: 'mt' },
  { label: 'PA', query: 'pa' },
  { label: 'PB', query: 'pb' },
  { label: 'PE', query: 'pe' },
  { label: 'PI', query: 'pi' },
  { label: 'PR', query: 'pr' },
  { label: 'RJ', query: 'rj' },
  { label: 'RN', query: 'rn' },
  { label: 'RO', query: 'ro' },
  { label: 'RR', query: 'rr' },
  { label: 'RS', query: 'rs' },
  { label: 'SC', query: 'sc' },
  { label: 'SE', query: 'se' },
  { label: 'SP', query: 'sp' },
  { label: 'TO', query: 'to' },
  { label: 'SUDESTE', query: 'sudeste' },
  { label: 'SUL', query: 'sul' },
  { label: 'NORDESTE', query: 'nordeste' },
  { label: 'NORTE', query: 'norte' },
  { label: 'C-OESTE', query: 'centro-oeste' },
];

export default function RegionBar() {
  return (
    <div className="bg-slate-900 text-slate-200 border-b border-slate-800 text-xs py-1 overflow-hidden">
      <div className="flex items-center justify-between max-w-7xl mx-auto px-1 sm:px-4">
        <div className="flex items-center gap-0 overflow-hidden flex-1">
          {/* Label — oculto em mobile para não ocupar espaço */}
          <span className="hidden md:flex items-center gap-1 font-bold text-blue-400 uppercase text-[10px] shrink-0 tracking-wider pl-2 pr-2 whitespace-nowrap">
            📍 Por região:
          </span>
          <div
            className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap py-1 px-1"
            style={{ scrollbarWidth: 'none' }}
          >
            {REGION_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={`/categoria/${item.query.toLowerCase()}`}
                className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide shrink-0 transition-colors ${
                  item.highlight
                    ? 'bg-blue-600 text-white hover:bg-blue-500'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/50'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Links de Redes Sociais no Topo */}
        <div className="hidden lg:flex items-center gap-3 pl-3 border-l border-slate-800 shrink-0 text-[11px] font-bold text-slate-400">
          <a href="https://www.instagram.com/concursosagora_/" target="_blank" rel="noopener noreferrer" className="hover:text-pink-400 transition-colors flex items-center gap-1" title="Instagram">
            <InstagramIcon className="w-3.5 h-3.5" />
            <span>Instagram</span>
          </a>
          <a href="https://www.facebook.com/profile.php?id=61592443961535" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors flex items-center gap-1" title="Facebook">
            <FacebookIcon className="w-3.5 h-3.5" />
            <span>Facebook</span>
          </a>
          <a href="https://x.com/home" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1" title="X (Twitter)">
            <XIcon className="w-3.5 h-3.5" />
            <span>X</span>
          </a>
          <a href="https://www.threads.com/@concursosagorabr?hl=pt-br" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1" title="Threads">
            <ThreadsIcon className="w-3.5 h-3.5" />
            <span>Threads</span>
          </a>
          <a href="https://www.youtube.com/@ConcursosAgora" target="_blank" rel="noopener noreferrer" className="hover:text-red-400 transition-colors flex items-center gap-1" title="YouTube">
            <YouTubeIcon className="w-3.5 h-3.5" />
            <span>YouTube</span>
          </a>
        </div>
      </div>
    </div>
  );
}
