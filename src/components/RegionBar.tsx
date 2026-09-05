'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { InstagramIcon, FacebookIcon, YouTubeIcon, TelegramIcon } from './SocialIcons';

interface RegionItem {
  label: string;
  query: string;
  highlight?: boolean;
  fullName?: string;
}

// Estados com maior número de concursos e volume de buscas no Google
const FEATURED_SHORTCUTS: RegionItem[] = [
  { label: '🇧🇷 NACIONAL', query: 'nacional', highlight: true },
  { label: 'SP', query: 'sp' },
  { label: 'RJ', query: 'rj' },
  { label: 'MG', query: 'mg' },
  { label: 'DF', query: 'df' },
  { label: 'BA', query: 'ba' },
  { label: 'PR', query: 'pr' },
  { label: 'RS', query: 'rs' },
];

// Demais estados organizados por macrorregiões para o dropdown compacto
const OTHER_REGIONS_BY_GROUP = [
  {
    group: 'Nordeste',
    groupQuery: 'nordeste',
    items: [
      { label: 'CE', query: 'ce', fullName: 'Ceará' },
      { label: 'PE', query: 'pe', fullName: 'Pernambuco' },
      { label: 'MA', query: 'ma', fullName: 'Maranhão' },
      { label: 'PB', query: 'pb', fullName: 'Paraíba' },
      { label: 'RN', query: 'rn', fullName: 'Rio Grande do Norte' },
      { label: 'AL', query: 'al', fullName: 'Alagoas' },
      { label: 'PI', query: 'pi', fullName: 'Piauí' },
      { label: 'SE', query: 'se', fullName: 'Sergipe' },
    ],
  },
  {
    group: 'Centro-Oeste',
    groupQuery: 'centro-oeste',
    items: [
      { label: 'GO', query: 'go', fullName: 'Goiás' },
      { label: 'MT', query: 'mt', fullName: 'Mato Grosso' },
      { label: 'MS', query: 'ms', fullName: 'Mato Grosso do Sul' },
    ],
  },
  {
    group: 'Sul & Sudeste',
    groupQuery: 'sudeste',
    items: [
      { label: 'SC', query: 'sc', fullName: 'Santa Catarina' },
      { label: 'ES', query: 'es', fullName: 'Espírito Santo' },
    ],
  },
  {
    group: 'Norte',
    groupQuery: 'norte',
    items: [
      { label: 'PA', query: 'pa', fullName: 'Pará' },
      { label: 'AM', query: 'am', fullName: 'Amazonas' },
      { label: 'RO', query: 'ro', fullName: 'Rondônia' },
      { label: 'TO', query: 'to', fullName: 'Tocantins' },
      { label: 'AC', query: 'ac', fullName: 'Acre' },
      { label: 'AP', query: 'ap', fullName: 'Amapá' },
      { label: 'RR', query: 'rr', fullName: 'Roraima' },
    ],
  },
];

export default function RegionBar() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const todayFormatted = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const displayDate = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

  // Fechar dropdown ao clicar fora ou apertar Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="relative z-50 bg-slate-950 text-slate-300 border-b border-slate-800/80 text-xs py-1.5">
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

        {/* Centro: Filtro Rápido com Estados em Destaque + Botão Discreto Compacto */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap px-2 mx-2 flex-1 justify-start lg:justify-center">
          <span className="hidden sm:inline-block text-slate-500 font-semibold text-xs uppercase tracking-wider shrink-0">
            Regiões:
          </span>

          {/* Principais Estados (Mais buscados) */}
          {FEATURED_SHORTCUTS.map((item) => (
            <Link
              key={item.label}
              href={`/categoria/${item.query.toLowerCase()}`}
              className={`px-2 py-0.5 rounded text-[11px] font-bold tracking-wide shrink-0 transition-all ${
                item.highlight
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-xs'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              {item.label}
            </Link>
          ))}

          {/* Botão Discreto Compacto com Setinha */}
          <div className="relative inline-block shrink-0" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              aria-expanded={isOpen}
              aria-haspopup="true"
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold tracking-wide transition-all border ${
                isOpen
                  ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/80'
              }`}
              title="Ver todos os demais estados e regiões"
            >
              <span>+ Estados</span>
              <svg
                className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Menu Popover / Dropdown dos Demais Estados */}
            {isOpen && (
              <div
                className="absolute left-0 sm:left-auto sm:right-0 mt-1.5 w-72 sm:w-80 md:w-96 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700/90 shadow-2xl p-3.5 z-[100] text-slate-200 animate-in fade-in zoom-in-95 duration-150"
                role="menu"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Demais Estados por Região
                  </span>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-slate-400 hover:text-slate-100 text-xs p-0.5 rounded hover:bg-slate-800"
                    aria-label="Fechar menu de estados"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                  {OTHER_REGIONS_BY_GROUP.map((grp) => (
                    <div key={grp.group}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {grp.group}
                        </span>
                        <Link
                          href={`/categoria/${grp.groupQuery}`}
                          onClick={() => setIsOpen(false)}
                          className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold hover:underline"
                        >
                          Ver região →
                        </Link>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-4 gap-1.5">
                        {grp.items.map((state) => (
                          <Link
                            key={state.query}
                            href={`/categoria/${state.query}`}
                            onClick={() => setIsOpen(false)}
                            title={`${state.label} — ${state.fullName}`}
                            className="px-2 py-1 rounded bg-slate-800/90 hover:bg-blue-600 text-slate-200 hover:text-white text-[11px] font-bold text-center border border-slate-700/60 transition-colors"
                          >
                            {state.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Rodapé do Dropdown com Atalhos Globais de Regiões */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/90 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <Link
                    href="/categoria/nacional"
                    onClick={() => setIsOpen(false)}
                    className="hover:text-blue-400 transition-colors"
                  >
                    🇧🇷 Todos Nacionais
                  </Link>
                  <Link
                    href="/concursos-abertos/sp"
                    onClick={() => setIsOpen(false)}
                    className="text-blue-400 hover:text-blue-300 font-bold hover:underline"
                  >
                    Ver Todos Estados →
                  </Link>
                </div>
              </div>
            )}
          </div>
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

