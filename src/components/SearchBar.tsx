'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface SearchBarProps {
  placeholder?: string;
  className?: string;
}

function SearchBarForm({ placeholder = 'Buscar concursos, editais, matérias...', className = '' }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <form onSubmit={handleSearch} className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-11 pr-24 py-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur border border-slate-300 dark:border-slate-700 rounded-full text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-sm md:text-base shadow-xs"
        />
        <div className="absolute left-4 text-slate-400 pointer-events-none">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button
          type="submit"
          className="absolute right-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs md:text-sm rounded-full transition-colors shadow-xs"
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
      <div className={`relative w-full ${props.className || ''}`}>
        <input
          type="text"
          disabled
          placeholder={props.placeholder || 'Carregando busca...'}
          className="w-full pl-11 pr-24 py-3 bg-white/90 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-full text-sm shadow-xs opacity-60"
        />
      </div>
    }>
      <SearchBarForm {...props} />
    </Suspense>
  );
}
