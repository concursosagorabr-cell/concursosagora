'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from './Navbar';
import SearchBar from './SearchBar';
import RegionBar from './RegionBar';
import MobileMenu from './MobileMenu';
import { Category } from '@/types';

interface HeaderProps {
  categories?: Category[];
}

export default function Header({ categories = [] }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        {/* Barra de regiões */}
        <RegionBar />

        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex items-center h-14 md:h-16 gap-3">

            {/* Botão hambúrguer — apenas mobile/tablet */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
              aria-label="Abrir menu de navegação"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2.5 font-black tracking-tight text-slate-900 shrink-0 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg group"
            >
              <div className="relative h-9 w-12 md:h-10 md:w-14 shrink-0 transition-transform group-hover:scale-105">
                <Image
                  src="/logo.png"
                  alt="Concursos Agora Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg md:text-xl font-black leading-none">
                  Concursos<span className="text-blue-600">Agora</span>
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 leading-tight">
                  Portal de Notícias
                </span>
              </div>
            </Link>

            {/* Navegação desktop — cresce para ocupar o espaço disponível */}
            <div className="hidden lg:flex flex-1 justify-center">
              <Navbar categories={categories} />
            </div>

            {/* Busca — desktop: campo visível; mobile: ícone de lupa que abre menu */}
            <div className="hidden lg:block w-48 xl:w-60 shrink-0">
              <SearchBar placeholder="Buscar editais..." isHeader={true} />
            </div>


            {/* Ações Mobile: Botão Explorar Vagas e Ícone de Busca */}
            <div className="lg:hidden ml-auto flex items-center gap-1.5 shrink-0">
              <Link
                href="/concursos"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-black text-xs text-blue-700 bg-blue-50 border border-blue-200/80 active:scale-95 transition-all shadow-xs"
              >
                <span>🔍</span>
                <span>Vagas</span>
              </Link>

              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
                aria-label="Pesquisar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Menu mobile renderizado fora do header para evitar overflow/z-index issues */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        categories={categories}
      />
    </>
  );
}
