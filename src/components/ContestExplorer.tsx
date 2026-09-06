'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Post } from '@/types';
import { getImageUrl } from '@/lib/image';
import { getDescriptiveImageAlt } from '@/utils/imageAlt';
import { BRAZIL_STATES } from '@/utils/states';
import { getAllExamBoards } from '@/utils/bancas';

interface ContestExplorerProps {
  initialPosts: Post[];
  initialState?: string;
  initialEducation?: string;
  initialBanca?: string;
  initialMinSalary?: number;
}

export default function ContestExplorer({
  initialPosts,
  initialState = '',
  initialEducation = '',
  initialBanca = '',
  initialMinSalary = 0,
}: ContestExplorerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState(initialState);
  const [selectedEducation, setSelectedEducation] = useState(initialEducation);
  const [selectedBanca, setSelectedBanca] = useState(initialBanca);
  const [selectedSalaryRange, setSelectedSalaryRange] = useState<string>(
    initialMinSalary >= 10000 ? '10000+' : (initialMinSalary >= 5000 ? '5000+' : 'all')
  );
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const examBoards = useMemo(() => getAllExamBoards(), []);

  // Filtragem multi-dimensional reativa
  const filteredPosts = useMemo(() => {
    return initialPosts.filter((post) => {
      // 1. Busca textual
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const titleMatch = post.title?.toLowerCase().includes(query);
        const excerptMatch = post.excerpt?.toLowerCase().includes(query);
        const bancaMatch = post.banca?.toLowerCase().includes(query);
        const cityMatch = post.cityName?.toLowerCase().includes(query);
        const stateMatch = post.stateUf?.toLowerCase().includes(query);
        if (!titleMatch && !excerptMatch && !bancaMatch && !cityMatch && !stateMatch) {
          return false;
        }
      }

      // 2. Estado (UF)
      if (selectedState) {
        const targetUf = selectedState.toUpperCase();
        const postUf = post.stateUf?.toUpperCase();
        const isNational = postUf === 'NACIONAL' || post.title?.toLowerCase().includes('nacional');
        const stateObj = BRAZIL_STATES[selectedState.toLowerCase()];
        const stateNameMatch = stateObj ? post.title?.toLowerCase().includes(stateObj.name.toLowerCase()) : false;
        const ufTitleMatch = post.title?.toUpperCase().includes(` ${targetUf}`) ||
                             post.title?.toUpperCase().includes(`/${targetUf}`) ||
                             post.title?.toUpperCase().includes(`-${targetUf}`);
        const categoryUfMatch = (post.categories || []).some(
          (c) => c.slug?.toLowerCase() === selectedState.toLowerCase() || c.title?.toUpperCase() === targetUf
        );

        if (postUf !== targetUf && !isNational && !stateNameMatch && !ufTitleMatch && !categoryUfMatch) {
          return false;
        }
      }

      // 3. Escolaridade
      if (selectedEducation) {
        const targetEdu = selectedEducation.toLowerCase();
        const postEduList = post.educationLevel || [];
        const hasStructuredEdu = postEduList.some((e) => e.toLowerCase().includes(targetEdu));
        
        let hasTextEdu = false;
        if (targetEdu === 'medio' || targetEdu === 'médio') {
          hasTextEdu = /m[ée]dio|t[ée]cnico/i.test(post.title || '') || /m[ée]dio|t[ée]cnico/i.test(post.excerpt || '');
        } else if (targetEdu === 'superior') {
          hasTextEdu = /superior|gradua[çc]|analista|auditor|delegado|perito|m[ée]dico|procurador/i.test(post.title || '') ||
                       /superior|gradua[çc]/i.test(post.excerpt || '');
        } else if (targetEdu === 'fundamental') {
          hasTextEdu = /fundamental|elementar|alfabetizado/i.test(post.title || '') ||
                       /fundamental/i.test(post.excerpt || '');
        }

        if (!hasStructuredEdu && !hasTextEdu) {
          return false;
        }
      }

      // 4. Banca Organizadora
      if (selectedBanca) {
        const targetBanca = selectedBanca.toLowerCase();
        const postBancaMatch = post.banca?.toLowerCase().includes(targetBanca);
        const titleBancaMatch = post.title?.toLowerCase().includes(targetBanca);
        const excerptBancaMatch = post.excerpt?.toLowerCase().includes(targetBanca);

        if (!postBancaMatch && !titleBancaMatch && !excerptBancaMatch) {
          return false;
        }
      }

      // 5. Faixa Salarial
      if (selectedSalaryRange !== 'all') {
        const salary = post.salaryMax || 0;
        if (selectedSalaryRange === '15000+') {
          if (salary < 15000 && !/1[5-9]\s?mil|2[0-9]\s?mil|3[0-9]\s?mil/i.test(post.title || '')) return false;
        } else if (selectedSalaryRange === '10000+') {
          if (salary < 10000 && !/1[0-9]\s?mil|2[0-9]\s?mil|3[0-9]\s?mil/i.test(post.title || '')) return false;
        } else if (selectedSalaryRange === '5000-10000') {
          if ((salary < 5000 || salary >= 10000) && !/[5-9]\s?mil/i.test(post.title || '')) return false;
        } else if (selectedSalaryRange === 'up-to-5000') {
          if (salary > 5000 && !/at[ée]\s?r?\$?\s?[1-5]\s?mil/i.test(post.title || '')) return false;
        }
      }

      // 6. Apenas Inscrições Abertas
      if (onlyOpen) {
        if (post.enrollmentEndDate) {
          const endDate = new Date(post.enrollmentEndDate);
          if (endDate < new Date()) return false;
        }
      }

      return true;
    });
  }, [initialPosts, searchTerm, selectedState, selectedEducation, selectedBanca, selectedSalaryRange, onlyOpen]);

  // Paginação
  const totalPages = Math.ceil(filteredPosts.length / itemsPerPage);
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPosts.slice(start, start + itemsPerPage);
  }, [filteredPosts, currentPage, itemsPerPage]);

  const hasActiveFilters =
    Boolean(searchTerm) ||
    Boolean(selectedState) ||
    Boolean(selectedEducation) ||
    Boolean(selectedBanca) ||
    selectedSalaryRange !== 'all' ||
    onlyOpen;

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedState('');
    setSelectedEducation('');
    setSelectedBanca('');
    setSelectedSalaryRange('all');
    setOnlyOpen(false);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-8">
      {/* ── Painel de Filtros Facetados ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              <span>🎛️</span> Filtros de Pesquisa Avançada
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Encontre o concurso ideal cruzando escolaridade, estado, faixa salarial e banca.
            </p>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors w-fit"
            >
              <span>✕</span> Limpar Filtros
            </button>
          )}
        </div>

        {/* Linha 1: Campo de Busca Rápida */}
        <div>
          <label htmlFor="explorer-search" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Palavra-chave ou Órgão:
          </label>
          <div className="relative">
            <input
              id="explorer-search"
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Ex: Polícia Federal, TJ-SP, Prefeitura, Professor, TI..."
              aria-label="Filtrar por cargo, órgão ou palavra-chave"
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-500 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-base" aria-hidden="true">
              🔍
            </span>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 text-sm p-1"
                aria-label="Limpar busca"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Linha 2: Filtros de Pílulas - Escolaridade */}
        <div>
          <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
            <span aria-hidden="true" className="mr-1">🎓</span>
            <span>Nível de Escolaridade:</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Todos os Níveis', value: '' },
              { label: 'Nível Médio / Técnico', value: 'medio' },
              { label: 'Nível Superior', value: 'superior' },
              { label: 'Nível Fundamental', value: 'fundamental' },
            ].map((item) => {
              const active = selectedEducation === item.value;
              return (
                <button
                  key={item.value}
                  onClick={() => {
                    setSelectedEducation(active && item.value !== '' ? '' : item.value);
                    setCurrentPage(1);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Linha 3: Filtros de Pílulas - Faixa Salarial */}
        <div>
          <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
            <span aria-hidden="true" className="mr-1">💰</span>
            <span>Faixa Salarial:</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Qualquer Salário', value: 'all' },
              { label: 'Até R$ 5.000', value: 'up-to-5000' },
              { label: 'R$ 5.000 a R$ 10.000', value: '5000-10000' },
              { label: 'R$ 10.000+ (Altos Salários)', value: '10000+' },
              { label: 'R$ 15.000+ (Elite)', value: '15000+' },
            ].map((item) => {
              const active = selectedSalaryRange === item.value;
              return (
                <button
                  key={item.value}
                  onClick={() => {
                    setSelectedSalaryRange(active && item.value !== 'all' ? 'all' : item.value);
                    setCurrentPage(1);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Linha 4: Dropdowns de Estado, Banca e Checkbox de Inscrições Abertas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Dropdown Estado */}
          <div>
            <label htmlFor="state-select" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              <span aria-hidden="true" className="mr-1">📍</span>
              <span>Estado (UF):</span>
            </label>
            <select
              id="state-select"
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Todos os Estados / Nacional</option>
              {Object.entries(BRAZIL_STATES).map(([uf, state]) => (
                <option key={uf} value={uf}>
                  {state.name} ({uf.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Dropdown Banca */}
          <div>
            <label htmlFor="banca-select" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              <span aria-hidden="true" className="mr-1">🏢</span>
              <span>Banca Examinadora:</span>
            </label>
            <select
              id="banca-select"
              value={selectedBanca}
              onChange={(e) => {
                setSelectedBanca(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Todas as Bancas</option>
              {examBoards.map((banca) => (
                <option key={banca.slug} value={banca.searchQuery}>
                  {banca.name}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Inscrições Abertas */}
          <div className="flex items-end">
            <label className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 w-full cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={onlyOpen}
                onChange={(e) => {
                  setOnlyOpen(e.target.checked);
                  setCurrentPage(1);
                }}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-800 flex items-center">
                <span aria-hidden="true" className="mr-1.5">🟢</span>
                <span>Somente Inscrições Abertas</span>
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* ── Barra de Resultados e Totalizador ── */}
      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-bold text-slate-900">
          Mostrando <span className="text-blue-600 font-extrabold">{filteredPosts.length}</span> {filteredPosts.length === 1 ? 'concurso encontrado' : 'concursos encontrados'}
        </span>

        {filteredPosts.length > 0 && (
          <span className="text-xs text-slate-500 font-medium">
            Página {currentPage} de {totalPages}
          </span>
        )}
      </div>

      {/* ── Grid de Cards de Concursos ── */}
      {paginatedPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedPosts.map((post) => {
            const slug = typeof post.slug === 'string' ? post.slug : (post.slug as any)?.current || post._id;
            const imageUrl = getImageUrl(post.mainImage, 600, 340);
            const formattedDate = post.publishedAt
              ? new Date(post.publishedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
              : null;

            return (
              <article
                key={post._id}
                className="group flex flex-col bg-white rounded-3xl border border-slate-200/90 hover:border-blue-400/80 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                {/* Imagem do Post com Badges */}
                <div className="relative aspect-[16/9] w-full bg-slate-100 overflow-hidden">
                  <Image
                    src={imageUrl}
                    alt={getDescriptiveImageAlt(post)}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />

                  {/* Badges Flutuantes */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                    {post.stateUf && (
                      <span className="px-2.5 py-1 rounded-full bg-blue-600/90 backdrop-blur-xs text-white text-xs font-black uppercase tracking-wider shadow-xs">
                        📍 {post.stateUf}
                      </span>
                    )}
                    {post.banca && (
                      <span className="px-2.5 py-1 rounded-full bg-slate-900/90 backdrop-blur-xs text-slate-200 text-xs font-bold shadow-xs">
                        {post.banca}
                      </span>
                    )}
                  </div>

                  {/* Salário em Destaque na Imagem */}
                  {post.salaryMax && (
                    <div className="absolute bottom-3 left-3 z-10">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs shadow-md">
                        💰 Até R$ {post.salaryMax.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Corpo do Card */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    {/* Meta linha */}
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      {post.vacanciesTotal ? (
                        <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                          👥 {post.vacanciesTotal} {post.vacanciesTotal === 1 ? 'vaga' : 'vagas'}
                        </span>
                      ) : (
                        <span className="font-medium">Edital Publicado</span>
                      )}

                      {formattedDate && <span>{formattedDate}</span>}
                    </div>

                    {/* Título */}
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                      <Link href={`/post/${slug}`} className="focus:outline-none">
                        {post.title}
                      </Link>
                    </h3>

                    {/* Resumo */}
                    {post.excerpt && (
                      <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                        {post.excerpt}
                      </p>
                    )}
                  </div>

                  {/* Rodapé do Card com CTA */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    {post.educationLevel && post.educationLevel.length > 0 ? (
                      <span className="text-xs font-semibold text-slate-600 capitalize">
                        🎓 {post.educationLevel.join(', ')}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-slate-600">Ver requisitos</span>
                    )}

                    <Link
                      href={`/post/${slug}`}
                      className="inline-flex items-center gap-1 text-xs font-black text-blue-600 group-hover:text-blue-700 group-hover:translate-x-1 transition-all"
                    >
                      <span>Ver Vagas</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* Estado Vazio */
        <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 text-3xl flex items-center justify-center mx-auto">
            📋
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            Nenhum concurso encontrado com os filtros selecionados
          </h3>
          <p className="text-xs sm:text-sm text-slate-500">
            Tente remover alguns filtros ou buscar por termos mais genéricos para visualizar outras oportunidades disponíveis.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md"
          >
            Ver Todos os Concursos
          </button>
        </div>
      )}

      {/* ── Paginação ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            disabled={currentPage === 1}
            onClick={() => {
              setCurrentPage((p) => Math.max(1, p - 1));
              window.scrollTo({ top: 300, behavior: 'smooth' });
            }}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            ← Anterior
          </button>

          <span className="px-4 py-2 text-xs font-bold text-slate-600">
            {currentPage} de {totalPages}
          </span>

          <button
            disabled={currentPage === totalPages}
            onClick={() => {
              setCurrentPage((p) => Math.min(totalPages, p + 1));
              window.scrollTo({ top: 300, behavior: 'smooth' });
            }}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}
