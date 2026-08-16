import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Category } from '@/types';
import SearchBar from './SearchBar';
import { CONTENT_HUBS } from '@/utils/hubs';
import { getPureCategories } from '@/utils/categories';
import { InstagramIcon, FacebookIcon, XIcon, ThreadsIcon, YouTubeIcon } from './SocialIcons';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  categories?: Category[];
}

const STATUS_LINKS = [
  { label: '🔥 Inscrições Abertas', href: '/search?q=aberto', color: 'text-emerald-600' },
  { label: '👀 Editais Previstos', href: '/search?q=previsto', color: '' },
  { label: '📌 Concursos Encerrados', href: '/search?q=encerrado', color: 'text-slate-500' },
];

const CAREER_LINKS = [
  { label: '👮 Policial & Segurança', href: '/categoria/seguranca' },
  { label: '⚖️ Tribunais & Jurídica', href: '/categoria/judiciario' },
  { label: '💰 Fiscal & Contábil', href: '/categoria/fiscal' },
  { label: '🏥 Saúde & Enfermagem', href: '/categoria/saude' },
  { label: '📚 Educação & Professores', href: '/categoria/educacao' },
  { label: '🏦 Bancária & Financeira', href: '/categoria/financas' },
  { label: '💼 Administrativa', href: '/categoria/administracao' },
];

const REGION_LINKS = [
  { label: '🇧🇷 Nacional / Federal', href: '/categoria/nacional' },
  { label: '🏢 Sudeste (SP, RJ, MG, ES)', href: '/categoria/sudeste' },
  { label: '🌾 Sul (PR, RS, SC)', href: '/categoria/sul' },
  { label: '☀️ Nordeste (BA, PE, CE...)', href: '/categoria/nordeste' },
  { label: '🌲 Norte (AM, PA, RO...)', href: '/categoria/norte' },
  { label: '🏛️ Centro-Oeste (DF, GO...)', href: '/categoria/centro-oeste' },
];

const STATE_LINKS = [
  { label: 'AC — Acre', href: '/categoria/ac' },
  { label: 'AL — Alagoas', href: '/categoria/al' },
  { label: 'AM — Amazonas', href: '/categoria/am' },
  { label: 'AP — Amapá', href: '/categoria/ap' },
  { label: 'BA — Bahia', href: '/categoria/ba' },
  { label: 'CE — Ceará', href: '/categoria/ce' },
  { label: 'DF — Distrito Federal', href: '/categoria/df' },
  { label: 'ES — Espírito Santo', href: '/categoria/es' },
  { label: 'GO — Goiás', href: '/categoria/go' },
  { label: 'MA — Maranhão', href: '/categoria/ma' },
  { label: 'MG — Minas Gerais', href: '/categoria/mg' },
  { label: 'MS — Mato Grosso do Sul', href: '/categoria/ms' },
  { label: 'MT — Mato Grosso', href: '/categoria/mt' },
  { label: 'PA — Pará', href: '/categoria/pa' },
  { label: 'PB — Paraíba', href: '/categoria/pb' },
  { label: 'PE — Pernambuco', href: '/categoria/pe' },
  { label: 'PI — Piauí', href: '/categoria/pi' },
  { label: 'PR — Paraná', href: '/categoria/pr' },
  { label: 'RJ — Rio de Janeiro', href: '/categoria/rj' },
  { label: 'RN — Rio Grande do Norte', href: '/categoria/rn' },
  { label: 'RO — Rondônia', href: '/categoria/ro' },
  { label: 'RR — Roraima', href: '/categoria/rr' },
  { label: 'RS — Rio Grande do Sul', href: '/categoria/rs' },
  { label: 'SC — Santa Catarina', href: '/categoria/sc' },
  { label: 'SE — Sergipe', href: '/categoria/se' },
  { label: 'SP — São Paulo', href: '/categoria/sp' },
  { label: 'TO — Tocantins', href: '/categoria/to' },
];

function SectionToggle({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-700 transition-colors"
      >
        {title}
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="pb-2">{children}</div>}
    </div>
  );
}

export default function MobileMenu({ isOpen, onClose, categories = [] }: MobileMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const pureCategories = getPureCategories(categories);

  // Fechar com tecla Escape
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Bloquear rolagem do body
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const linkClass =
    'flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors';

  return (
    <div
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-[100] lg:hidden transition-all duration-300 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Drawer deslizante */}
      <div
        ref={panelRef}
        className={`absolute top-0 left-0 h-full w-[min(320px,90vw)] flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header do drawer */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-2 font-black text-slate-900"
          >
            <div className="relative h-8 w-14 shrink-0">
              <Image
                src="/logo.png"
                alt="Concursos Agora Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-base font-black">
              Concursos<span className="text-blue-600">Agora</span>
            </span>
          </Link>
          <button
            onClick={onClose}
            aria-label="Fechar menu"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Busca */}
        <div className="px-4 py-3 border-b border-slate-100 shrink-0">
          <SearchBar placeholder="Pesquisar concurso..." />
        </div>

        {/* Links do menu — rolável */}
        <div className="flex-1 overflow-y-auto">
          {/* Início */}
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 border-b border-slate-100 transition-colors"
          >
            🏠 Início
          </Link>

          {/* Status */}
          <SectionToggle title="Status do Concurso" defaultOpen={true}>
            {STATUS_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={`${linkClass} font-semibold ${link.color}`}
              >
                {link.label}
              </Link>
            ))}
          </SectionToggle>

          {/* Carreiras */}
          <SectionToggle title="Por Carreira / Área">
            {CAREER_LINKS.map((link) => (
              <Link key={link.href} href={link.href} onClick={onClose} className={linkClass}>
                {link.label}
              </Link>
            ))}
          </SectionToggle>

          {/* Hubs de Conteúdo (SEO Silos) */}
          <SectionToggle title="Hubs de Conteúdo (Silos)" defaultOpen={true}>
            <Link
              href="/hub"
              onClick={onClose}
              className={`${linkClass} font-extrabold text-blue-600 border-b border-slate-100`}
            >
              🎯 Ver Todos os Hubs
            </Link>
            {CONTENT_HUBS.map((h) => (
              <Link
                key={h.slug}
                href={`/hub/${h.slug}`}
                onClick={onClose}
                className={linkClass}
              >
                <span className="mr-1.5">{h.icon}</span>
                {h.title}
              </Link>
            ))}
          </SectionToggle>

          {/* Regiões */}
          <SectionToggle title="Por Região">
            {REGION_LINKS.map((link) => (
              <Link key={link.href} href={link.href} onClick={onClose} className={linkClass}>
                {link.label}
              </Link>
            ))}
          </SectionToggle>

          {/* Estados */}
          <SectionToggle title="Por Estado (UF)">
            <div className="max-h-60 overflow-y-auto">
              {STATE_LINKS.map((link) => (
                <Link key={link.href} href={link.href} onClick={onClose} className={linkClass}>
                  {link.label}
                </Link>
              ))}
            </div>
          </SectionToggle>

          {/* Categorias do Sanity (Filtradas sem repetir Estados e Regiões) */}
          {pureCategories.length > 0 && (
            <SectionToggle title="Categorias">
              <div className="flex flex-wrap gap-1.5 px-4 pt-1 pb-2">
                {pureCategories.map((cat) => (
                  <Link
                    key={cat._id}
                    href={`/categoria/${cat.slug || cat._id}`}
                    onClick={onClose}
                    className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-blue-600 hover:text-white transition-colors"
                  >
                    {cat.title}
                  </Link>
                ))}
              </div>
            </SectionToggle>
          )}

          {/* Redes Sociais Oficiais */}
          <SectionToggle title="📲 Nossas Redes Sociais" defaultOpen={true}>
            <div className="flex flex-col gap-1.5 px-2 pt-1 pb-2 text-xs font-bold">
              <a href="https://www.instagram.com/concursosagora_/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 p-2.5 rounded-xl bg-pink-500/10 text-pink-600 border border-pink-500/20">
                <InstagramIcon className="w-4 h-4 shrink-0" />
                <span>Instagram</span>
              </a>
              <a href="https://www.facebook.com/profile.php?id=61592443961535" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 p-2.5 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
                <FacebookIcon className="w-4 h-4 shrink-0" />
                <span>Facebook</span>
              </a>
              <a href="https://x.com/home" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-500/10 text-slate-800 border border-slate-500/20">
                <XIcon className="w-4 h-4 shrink-0" />
                <span>X (Twitter)</span>
              </a>
              <a href="https://www.threads.com/@concursosagorabr?hl=pt-br" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-500/10 text-slate-800 border border-slate-500/20">
                <ThreadsIcon className="w-4 h-4 shrink-0" />
                <span>Threads</span>
              </a>
              <a href="https://www.youtube.com/@ConcursosAgora" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 p-2.5 rounded-xl bg-red-500/10 text-red-600 border border-red-500/20">
                <YouTubeIcon className="w-4 h-4 shrink-0" />
                <span>YouTube</span>
              </a>
            </div>
          </SectionToggle>
        </div>

        {/* Footer do drawer */}
        <div className="px-4 py-3 border-t border-slate-200 text-center text-[11px] text-slate-400 shrink-0">
          © {new Date().getFullYear()} Concursos Agora
        </div>
      </div>
    </div>
  );
}
