'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  isHeader?: boolean;
}

function SearchBarForm({ placeholder = 'Buscar concursos, editais...', className = '', isHeader = false }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <form onSubmit={handleSearch} className={`relative w-full ${className}`} role="search">
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label="Buscar concursos, editais e cargos"
          className={`w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white border border-slate-200/80 rounded-full text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-xs ${
            isHeader ? 'pl-9 pr-14 py-1.5 text-xs' : 'pl-11 pr-24 py-2.5 text-sm md:text-base'
          }`}
        />
        <div className={`absolute text-slate-500 pointer-events-none ${isHeader ? 'left-3' : 'left-4'}`}>
          <svg className={isHeader ? 'w-3.5 h-3.5' : 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button
          type="submit"
          aria-label="Executar busca"
          className={`absolute right-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-full transition-all shadow-xs ${
            isHeader ? 'px-2.5 py-1 text-xs' : 'px-4 py-1.5 text-xs md:text-sm'
          }`}
        >
          Buscar
        </button>
      </div>
    </form>
  );
}

export default function SearchBar(props: SearchBarProps) {
  return (
    <Suspense fallback={
      <form action="/search" method="GET" className={`relative w-full ${props.className || ''}`} role="search">
        <div className="relative flex items-center">
          <input
            type="text"
            name="q"
            aria-label="Buscar concursos, editais e cargos"
            placeholder={props.placeholder || 'Buscar concursos, editais...'}
            className={`w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white border border-slate-200/80 rounded-full text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-xs ${
              props.isHeader ? 'pl-9 pr-14 py-1.5 text-xs' : 'pl-11 pr-24 py-2.5 text-sm md:text-base'
            }`}
          />
          <div className={`absolute text-slate-500 pointer-events-none ${props.isHeader ? 'left-3' : 'left-4'}`}>
            <svg className={props.isHeader ? 'w-3.5 h-3.5' : 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button
            type="submit"
            aria-label="Executar busca"
            className={`absolute right-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-full transition-all shadow-xs ${
              props.isHeader ? 'px-2.5 py-1 text-xs' : 'px-4 py-1.5 text-xs md:text-sm'
            }`}
          >
            Buscar
          </button>
        </div>
      </form>
    }>
      <SearchBarForm {...props} />
    </Suspense>
  );
}

