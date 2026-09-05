import Link from 'next/link';
import { InstagramIcon, FacebookIcon, YouTubeIcon, TelegramIcon } from './SocialIcons';

interface RegionItem {
  label: string;
  query: string;
  highlight?: boolean;
}

const REGION_SHORTCUTS: RegionItem[] = [
  { label: '🇧🇷 NACIONAL', query: 'nacional', highlight: true },
  { label: 'SP', query: 'sp' },
  { label: 'RJ', query: 'rj' },
  { label: 'MG', query: 'mg' },
  { label: 'DF', query: 'df' },
  { label: 'BA', query: 'ba' },
  { label: 'PR', query: 'pr' },
  { label: 'RS', query: 'rs' },
  { label: 'CE', query: 'ce' },
  { label: 'GO', query: 'go' },
  { label: 'PE', query: 'pe' },
  { label: 'SC', query: 'sc' },
  { label: 'SUDESTE', query: 'sudeste' },
  { label: 'SUL', query: 'sul' },
  { label: 'NORDESTE', query: 'nordeste' },
  { label: 'C-OESTE', query: 'centro-oeste' },
  { label: 'NORTE', query: 'norte' },
];

export default function RegionBar() {
  const todayFormatted = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const displayDate = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

  return (
    <div className="bg-slate-950 text-slate-300 border-b border-slate-800/80 text-xs py-1.5 overflow-hidden">
      <div className="flex items-center justify-between max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        
        {/* Esquerda: Data ao vivo e Selo de Plantão */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-950/80 border border-red-800/60 text-red-400 font-extrabold tracking-wider uppercase text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping motion-reduce:animate-none inline-block" />
            <span>Plantão de Editais</span>
          </div>
          <span className="hidden xl:inline-block text-slate-400 font-medium">
            {displayDate}
          </span>
        </div>

        {/* Centro: Filtro Rápido por Região e Principais Estados */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap px-2 mx-2 flex-1 justify-start lg:justify-center">
          <span className="hidden sm:inline-block text-slate-500 font-semibold text-xs uppercase tracking-wider shrink-0">
            Regiões:
          </span>
          {REGION_SHORTCUTS.map((item) => (
            <Link
              key={item.label}
              href={`/categoria/${item.query.toLowerCase()}`}
              className={`px-2.5 py-0.5 rounded text-xs font-bold tracking-wide shrink-0 transition-all ${
                item.highlight
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-xs'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Direita: Redes Sociais Oficiais */}
        <div className="hidden lg:flex items-center gap-3 shrink-0 text-slate-400 font-semibold pl-2 border-l border-slate-800">
          <a
            href="https://t.me/concursosagorabr"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-sky-400 text-sky-400/90 font-bold transition-colors flex items-center gap-1"
            title="Canal VIP no Telegram"
          >
            <TelegramIcon className="w-3.5 h-3.5" />
            <span className="text-xs">Telegram VIP</span>
          </a>
          <a
            href="https://www.instagram.com/concursosagora_/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-pink-400 transition-colors flex items-center gap-1"
            title="Instagram Oficial"
          >
            <InstagramIcon className="w-3.5 h-3.5" />
            <span className="text-xs">Instagram</span>
          </a>
          <a
            href="https://www.facebook.com/profile.php?id=61592443961535"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-400 transition-colors flex items-center gap-1"
            title="Facebook Oficial"
          >
            <FacebookIcon className="w-3.5 h-3.5" />
            <span className="text-xs">Facebook</span>
          </a>
          <a
            href="https://www.youtube.com/@ConcursosAgora"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-red-400 transition-colors flex items-center gap-1"
            title="Canal YouTube"
          >
            <YouTubeIcon className="w-3.5 h-3.5" />
            <span className="text-xs">YouTube</span>
          </a>
        </div>

      </div>
    </div>
  );
}

