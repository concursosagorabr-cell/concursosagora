'use client';

import { useState } from 'react';
import Link from 'next/link';

interface StateItem {
  uf: string;
  name: string;
  region: string;
  highlight?: boolean;
}

const BRAZIL_STATES: StateItem[] = [
  // Sudeste
  { uf: 'SP', name: 'São Paulo', region: 'sudeste', highlight: true },
  { uf: 'RJ', name: 'Rio de Janeiro', region: 'sudeste', highlight: true },
  { uf: 'MG', name: 'Minas Gerais', region: 'sudeste', highlight: true },
  { uf: 'ES', name: 'Espírito Santo', region: 'sudeste' },
  // Sul
  { uf: 'PR', name: 'Paraná', region: 'sul', highlight: true },
  { uf: 'RS', name: 'Rio Grande do Sul', region: 'sul', highlight: true },
  { uf: 'SC', name: 'Santa Catarina', region: 'sul' },
  // Centro-Oeste
  { uf: 'DF', name: 'Distrito Federal', region: 'centro-oeste', highlight: true },
  { uf: 'GO', name: 'Goiás', region: 'centro-oeste' },
  { uf: 'MT', name: 'Mato Grosso', region: 'centro-oeste' },
  { uf: 'MS', name: 'Mato Grosso do Sul', region: 'centro-oeste' },
  // Nordeste
  { uf: 'BA', name: 'Bahia', region: 'nordeste', highlight: true },
  { uf: 'PE', name: 'Pernambuco', region: 'nordeste', highlight: true },
  { uf: 'CE', name: 'Ceará', region: 'nordeste', highlight: true },
  { uf: 'MA', name: 'Maranhão', region: 'nordeste' },
  { uf: 'PB', name: 'Paraíba', region: 'nordeste' },
  { uf: 'RN', name: 'Rio Grande do Norte', region: 'nordeste' },
  { uf: 'AL', name: 'Alagoas', region: 'nordeste' },
  { uf: 'SE', name: 'Sergipe', region: 'nordeste' },
  { uf: 'PI', name: 'Piauí', region: 'nordeste' },
  // Norte
  { uf: 'PA', name: 'Pará', region: 'norte', highlight: true },
  { uf: 'AM', name: 'Amazonas', region: 'norte' },
  { uf: 'RO', name: 'Rondônia', region: 'norte' },
  { uf: 'TO', name: 'Tocantins', region: 'norte' },
  { uf: 'AC', name: 'Acre', region: 'norte' },
  { uf: 'AP', name: 'Amapá', region: 'norte' },
  { uf: 'RR', name: 'Roraima', region: 'norte' },
];

const TABS = [
  { id: 'all', label: '🇧🇷 Todos os Estados' },
  { id: 'sudeste', label: 'Sudeste' },
  { id: 'sul', label: 'Sul' },
  { id: 'nordeste', label: 'Nordeste' },
  { id: 'centro-oeste', label: 'Centro-Oeste' },
  { id: 'norte', label: 'Norte' },
];

export default function RegionalExplorer() {
  const [activeTab, setActiveTab] = useState('all');

  const filteredStates =
    activeTab === 'all'
      ? BRAZIL_STATES
      : BRAZIL_STATES.filter((s) => s.region === activeTab);

  return (
    <section className="my-10 bg-white rounded-2xl p-5 sm:p-7 border border-slate-200 shadow-xs" aria-label="Painel de Concursos por Estado">
      
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 block">
            Guia Geográfico
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <span>📍</span> Concursos Abertos por Estado & Região
          </h2>
        </div>
        <Link
          href="/categoria/nacional"
          className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
        >
          <span>Ver Concursos Nacionais / Federais</span>
          <span>→</span>
        </Link>
      </div>

      {/* Abas de Navegação por Região */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-3 mb-5 border-b border-slate-100/80">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grade de Estados Compacta e Interativa */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-2.5">
        {filteredStates.map((state) => (
          <Link
            key={state.uf}
            href={`/categoria/${state.uf.toLowerCase()}`}
            className="group flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/70 hover:border-blue-300 transition-all shadow-2xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 transition-colors ${
                state.highlight
                  ? 'bg-blue-600 text-white group-hover:bg-blue-700'
                  : 'bg-slate-200 text-slate-700 group-hover:bg-blue-600 group-hover:text-white'
              }`}>
                {state.uf}
              </span>
              <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-700 truncate">
                {state.name}
              </span>
            </div>
            <span className="text-slate-400 group-hover:text-blue-600 text-xs transition-transform group-hover:translate-x-0.5" aria-hidden="true">
              →
            </span>
          </Link>
        ))}
      </div>

      {/* Banner de atalho rápido para Concursos Nacionais */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Editais atualizados diariamente em todos os 26 estados e Distrito Federal.</span>
        </div>
        <div className="flex items-center gap-2 font-bold text-slate-700">
          <Link href="/categoria/nacional" className="hover:text-blue-600 underline">Editais Federais</Link>
          <span>•</span>
          <Link href="/categoria/tribunais" className="hover:text-blue-600 underline">Tribunais</Link>
          <span>•</span>
          <Link href="/categoria/seguranca" className="hover:text-blue-600 underline">Carreiras Policiais</Link>
        </div>
      </div>

    </section>
  );
}
