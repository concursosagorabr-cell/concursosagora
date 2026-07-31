'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Category } from '@/types';

interface NavbarProps {
  categories?: Category[];
}

const CAREERS = [
  { label: '👮 Policial & Segurança', href: '/categoria/seguranca' },
  { label: '⚖️ Tribunais & Jurídica', href: '/categoria/judiciario' },
  { label: '💰 Fiscal & Contábil', href: '/categoria/fiscal' },
  { label: '🏥 Saúde & Enfermagem', href: '/categoria/saude' },
  { label: '📚 Educação & Professores', href: '/categoria/educacao' },
  { label: '🏦 Bancária & Financeira', href: '/categoria/financas' },
  { label: '💼 Administrativa', href: '/categoria/administracao' },
];

const REGIONS = [
  { label: '🇧🇷 Concursos Nacionais', href: '/categoria/nacional' },
  { label: '🏢 Sudeste (SP, RJ, MG, ES)', href: '/categoria/sudeste' },
  { label: '🌾 Sul (PR, RS, SC)', href: '/categoria/sul' },
  { label: '☀️ Nordeste (BA, PE, CE...)', href: '/categoria/nordeste' },
  { label: '🌲 Norte (AM, PA, RO...)', href: '/categoria/norte' },
  { label: '🏛️ Centro-Oeste (DF, GO...)', href: '/categoria/centro-oeste' },
];

const STATES = [
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

interface DropdownMenuProps {
  label: string;
  id: string;
  active: string | null;
  onActivate: (id: string | null) => void;
  alignRight?: boolean;
  children: React.ReactNode;
}

function DropdownMenu({ label, id, active, onActivate, alignRight = false, children }: DropdownMenuProps) {
  const isOpen = active === id;
  return (
    <div
      className="relative"
      onMouseEnter={() => onActivate(id)}
      onMouseLeave={() => onActivate(null)}
    >
      <button
        onClick={() => onActivate(isOpen ? null : id)}
        className={`flex items-center gap-1 px-2.5 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap
          ${isOpen
            ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400'
            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400'
          }`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {label}
        <svg
          className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`absolute top-full mt-1 pt-1 z-[60] min-w-[220px] ${alignRight ? 'right-0' : 'left-0'}`}
        >
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 overflow-hidden">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar({ categories = [] }: NavbarProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setActiveDropdown(null);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const dropdownItemClass =
    'block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors';

  return (
    <nav ref={navRef} className="hidden lg:flex items-center gap-0.5 text-sm font-semibold">
      {/* Início */}
      <Link
        href="/"
        className="px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap"
      >
        Início
      </Link>

      {/* Inscrições Abertas — destaque verde */}
      <Link
        href="/search?q=aberto"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors whitespace-nowrap"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        Abertas
      </Link>

      {/* Previstos */}
      <Link
        href="/search?q=previsto"
        className="px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap"
      >
        Previstos
      </Link>

      {/* Dropdown Regiões */}
      <DropdownMenu label="Regiões" id="regions" active={activeDropdown} onActivate={setActiveDropdown}>
        {REGIONS.map((r) => (
          <Link key={r.href} href={r.href} className={dropdownItemClass}>
            {r.label}
          </Link>
        ))}
      </DropdownMenu>

      {/* Dropdown Estados */}
      <DropdownMenu label="Estados" id="states" active={activeDropdown} onActivate={setActiveDropdown}>
        <div className="max-h-72 overflow-y-auto w-48">
          {STATES.map((s) => (
            <Link key={s.href} href={s.href} className={dropdownItemClass}>
              {s.label}
            </Link>
          ))}
        </div>
      </DropdownMenu>

      {/* Dropdown Carreiras */}
      <DropdownMenu label="Carreiras" id="careers" active={activeDropdown} onActivate={setActiveDropdown}>
        {CAREERS.map((c) => (
          <Link key={c.href} href={c.href} className={dropdownItemClass}>
            {c.label}
          </Link>
        ))}
      </DropdownMenu>

      {/* Dropdown Categorias do Sanity */}
      {categories.length > 0 && (
        <DropdownMenu label="Categorias" id="categories" active={activeDropdown} onActivate={setActiveDropdown} alignRight>
          <div className="max-h-72 overflow-y-auto">
            {categories.map((cat) => (
              <Link
                key={cat._id}
                href={`/categoria/${cat.slug || cat._id}`}
                className={`${dropdownItemClass} capitalize`}
              >
                {cat.title}
              </Link>
            ))}
          </div>
        </DropdownMenu>
      )}
    </nav>
  );
}
