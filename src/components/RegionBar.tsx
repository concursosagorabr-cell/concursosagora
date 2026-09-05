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

// Todas as 5 macrorregiões oficiais do Brasil para o menu toggle
const MACRO_REGIONS = [
  {
    name: 'Sudeste',
    query: 'sudeste',
    states: [
      { uf: 'SP', name: 'São Paulo' },
      { uf: 'RJ', name: 'Rio de Janeiro' },
      { uf: 'MG', name: 'Minas Gerais' },
      { uf: 'ES', name: 'Espírito Santo' },
    ],
  },
  {
    name: 'Sul',
    query: 'sul',
    states: [
      { uf: 'PR', name: 'Paraná' },
      { uf: 'RS', name: 'Rio Grande do Sul' },
      { uf: 'SC', name: 'Santa Catarina' },
    ],
  },
  {
    name: 'Centro-Oeste',
    query: 'centro-oeste',
    states: [
      { uf: 'DF', name: 'Distrito Federal' },
      { uf: 'GO', name: 'Goiás' },
      { uf: 'MT', name: 'Mato Grosso' },
      { uf: 'MS', name: 'Mato Grosso do Sul' },
    ],
  },
  {
    name: 'Nordeste',
    query: 'nordeste',
    states: [
      { uf: 'BA', name: 'Bahia' },
      { uf: 'CE', name: 'Ceará' },
      { uf: 'PE', name: 'Pernambuco' },
      { uf: 'MA', name: 'Maranhão' },
      { uf: 'PB', name: 'Paraíba' },
      { uf: 'RN', name: 'Rio Grande do Norte' },
      { uf: 'AL', name: 'Alagoas' },
      { uf: 'PI', name: 'Piauí' },
      { uf: 'SE', name: 'Sergipe' },
    ],
  },
  {
    name: 'Norte',
    query: 'norte',
    states: [
      { uf: 'PA', name: 'Pará' },
      { uf: 'AM', name: 'Amazonas' },
      { uf: 'RO', name: 'Rondônia' },
      { uf: 'TO', name: 'Tocantins' },
      { uf: 'AC', name: 'Acre' },
      { uf: 'AP', name: 'Amapá' },
      { uf: 'RR', name: 'Roraima' },
    ],
  },
];

export default function RegionBar() {
  const [isOpen, setIsOpen] = useState(false);
  const barContainerRef = useRef<HTMLDivElement>(null);

  const todayFormatted = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const displayDate = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

  const shortDate = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());

  // Fechar menu ao clicar fora do componente RegionBar ou pressionar Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (barContainerRef.current && !barContainerRef.current.contains(event.target as Node)) {
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
    <div ref={barContainerRef} className="relative z-50 bg-slate-950 text-slate-300 border-b border-slate-800/80 text-xs">
      <div className="flex items-center justify-between max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-1.5 gap-2">
        
        {/* Esquerda: Data ao vivo e Selo de Plantão */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-950/80 border border-red-800/60 text-red-400 font-extrabold tracking-wider uppercase text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping motion-reduce:animate-none inline-block" />
            <span>Plantão de Editais</span>
          </div>
          {/* Data completa em telas amplas (2xl), compacta em xl, oculta em menores para garantir espaço aos filtros */}
          <span className="hidden 2xl:inline-block text-slate-400 font-medium">
            {displayDate}
          </span>
          <span className="hidden xl:inline-block 2xl:hidden text-slate-400 font-medium text-[11px]">
            {shortDate}
          </span>
          <span className="hidden md:inline-block h-3.5 w-px bg-slate-800 shrink-0" aria-hidden="true" />
        </div>

        {/* Centro: Filtro Rápido com Estados em Destaque + Botão Toggle (Alinhado à esquerda para NUNCA cortar a palavra Regiões) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap px-1 flex-1 justify-start min-w-0">
          <span className="text-slate-400 font-bold text-xs uppercase tracking-wider shrink-0 select-none">
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

          {/* Botão Menu Toggle: abre e fecha o painel de estados */}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            aria-controls="region-toggle-menu"
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wide transition-all border shrink-0 cursor-pointer ${
              isOpen
                ? 'bg-blue-600 text-white border-blue-400 shadow-md ring-2 ring-blue-500/40'
                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/80 hover:border-slate-600'
            }`}
            title={isOpen ? 'Fechar menu de estados' : 'Abrir menu com todos os estados do Brasil'}
          >
            <span>{isOpen ? '✕ Fechar' : '+ Estados'}</span>
            <svg
              className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Direita: Redes Sociais Oficiais */}
        <div className="hidden lg:flex items-center gap-2.5 shrink-0 text-slate-400 font-semibold pl-2 border-l border-slate-800">
          <a
            href="https://t.me/concursosagorabr"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-sky-400 text-sky-400/90 font-bold transition-colors flex items-center gap-1"
            title="Canal VIP no Telegram"
            aria-label="Canal VIP no Telegram"
          >
            <TelegramIcon className="w-3.5 h-3.5" />
            <span className="text-xs">Telegram <span className="hidden xl:inline">VIP</span></span>
          </a>
          <a
            href="https://www.instagram.com/concursosagora_/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-pink-400 transition-colors flex items-center gap-1 p-0.5 rounded hover:bg-slate-800/60"
            title="Instagram Oficial"
            aria-label="Instagram Oficial"
          >
            <InstagramIcon className="w-3.5 h-3.5" />
            <span className="text-xs hidden 2xl:inline">Instagram</span>
          </a>
          <a
            href="https://www.facebook.com/profile.php?id=61592443961535"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-400 transition-colors flex items-center gap-1 p-0.5 rounded hover:bg-slate-800/60"
            title="Facebook Oficial"
            aria-label="Facebook Oficial"
          >
            <FacebookIcon className="w-3.5 h-3.5" />
            <span className="text-xs hidden 2xl:inline">Facebook</span>
          </a>
          <a
            href="https://www.youtube.com/@ConcursosAgora"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-red-400 transition-colors flex items-center gap-1 p-0.5 rounded hover:bg-slate-800/60"
            title="Canal YouTube"
            aria-label="Canal YouTube"
          >
            <YouTubeIcon className="w-3.5 h-3.5" />
            <span className="text-xs hidden 2xl:inline">YouTube</span>
          </a>
        </div>

      </div>

      {/* Painel Toggle Expansível (Zero Clipping de Overflow) */}
      {isOpen && (
        <div
          id="region-toggle-menu"
          className="border-t border-slate-800 bg-slate-900/98 backdrop-blur-xl px-3 sm:px-6 py-3.5 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                  <span>📍</span> Todos os Estados por Região
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:inline-block">
                  (Clique na sigla para filtrar os editais abertos do seu estado)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Fechar menu"
              >
                <span>Fechar</span>
                <span className="text-sm">✕</span>
              </button>
            </div>

            {/* Grid com as 5 Macrorregiões */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {MACRO_REGIONS.map((reg) => (
                <div
                  key={reg.name}
                  className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800/80 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-800/60">
                      <span className="text-[11px] font-black uppercase tracking-wider text-blue-400">
                        {reg.name}
                      </span>
                      <Link
                        href={`/categoria/${reg.query}`}
                        onClick={() => setIsOpen(false)}
                        className="text-[10px] text-slate-400 hover:text-blue-300 font-semibold hover:underline"
                      >
                        Ver todos →
                      </Link>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-3 gap-1.5">
                      {reg.states.map((st) => (
                        <Link
                          key={st.uf}
                          href={`/categoria/${st.uf.toLowerCase()}`}
                          onClick={() => setIsOpen(false)}
                          title={`${st.uf} — ${st.name}`}
                          className="px-2 py-1 rounded bg-slate-800/90 hover:bg-blue-600 active:scale-95 text-slate-200 hover:text-white text-[11px] font-bold text-center border border-slate-700/60 transition-all shadow-xs"
                        >
                          {st.uf}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Barra de Rodapé do Menu Toggle */}
            <div className="mt-3 pt-2.5 border-t border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-500">Nacional:</span>
                <Link
                  href="/categoria/nacional"
                  onClick={() => setIsOpen(false)}
                  className="text-blue-400 hover:text-blue-300 font-bold hover:underline"
                >
                  🇧🇷 Concursos Federais & Nacionais (CNU, CEF, Correios...)
                </Link>
              </div>
              <Link
                href="/concursos"
                onClick={() => setIsOpen(false)}
                className="text-blue-400 hover:text-blue-300 font-bold hover:underline flex items-center gap-1"
              >
                <span>Explorador com Filtros Avançados</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

