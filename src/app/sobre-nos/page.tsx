import { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Sobre Nós — Concursos Agora',
  description: 'Conheça a história e a missão do Concursos Agora, sua fonte confiável de notícias e editais de concursos públicos no Brasil.',
  alternates: {
    canonical: 'https://concursosagora.com.br/sobre-nos',
  },
};

export default function SobreNosPage() {
  return (
    <article className="max-w-4xl mx-auto px-4 py-10 text-slate-800">
      <header className="border-b border-slate-200 pb-6 mb-8 text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Sobre o Concursos Agora
        </h1>
        <p className="text-slate-600 text-lg mt-2 font-medium">
          Informação ágil, precisa e acessível para quem busca a aprovação no serviço público brasileiro.
        </p>
      </header>

      <div className="prose prose-slate max-w-none space-y-6 text-base leading-relaxed">
        <p>
          O <strong>Concursos Agora</strong> nasceu com uma missão clara: descomplicar o acesso à informação sobre concursos públicos em todo o Brasil. Sabendo que o tempo do concurseiro é precioso e deve ser dedicado prioritariamente aos estudos, estruturamos uma plataforma inteligente que reúne, organiza e transmite em tempo real as novidades mais relevantes do universo dos certames públicos.
        </p>

        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          🎯 Nossa Missão
        </h2>
        <p>
          Levar notícias verificadas, resumos de editais claros, alertas de inscrição e informações sobre vagas e salários para todos os cidadãos que almejam conquistar a estabilidade e uma carreira de sucesso no setor público municipal, estadual ou federal.
        </p>

        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          💡 Como Trabalhamos
        </h2>
        <p>
          Nosso portal combina automação jornalística avançada e revisão especializada. Monitoramos continuamente Diários Oficiais, portais das principais bancas examinadoras e sites governamentais para que você receba em primeira mão:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Editais Publicados:</strong> Destaques dos cargos, prazos de inscrição, valores de taxa e requisitos;</li>
          <li><strong>Concursos Previstos e Autorizados:</strong> Acompanhamento das comissões formadas e escolha de bancas;</li>
          <li><strong>Cobertura Regional Completa:</strong> Organização por estados (as 27 UFs brasileiras) e regiões geográficas (Sudeste, Sul, Nordeste, Norte, Centro-Oeste e Nacional);</li>
          <li><strong>Filtros por Carreiras:</strong> Notícias segmentadas para Saúde, Segurança Pública, Fiscal, Administração, Educação, Tecnologia e Judiciário.</li>
        </ul>

        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          👥 Nossa Equipe Editorial
        </h2>
        <p className="mb-6">
          Nossos artigos são produzidos e supervisionados por jornalistas e especialistas em comunicação pública focados em garantir clareza, imparcialidade e conformidade jornalística:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 not-prose my-8">
          <div className="bg-slate-100 rounded-xl p-5 text-center border border-slate-200 shadow-sm">
            <div className="w-20 h-20 mx-auto rounded-full overflow-hidden mb-3 relative border-2 border-blue-600">
              <Image src="/logo.png" alt="Marco Antonio" fill className="object-cover" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Marco Antonio</h3>
            <p className="text-xs text-blue-600 font-semibold mt-0.5">Editor Chefe & Analista de Editais</p>
            <p className="text-xs text-slate-500 mt-2">Especialista em legislação de concursos e análise de certames federais e estaduais.</p>
          </div>

          <div className="bg-slate-100 rounded-xl p-5 text-center border border-slate-200 shadow-sm">
            <div className="w-20 h-20 mx-auto rounded-full overflow-hidden mb-3 relative border-2 border-blue-600">
              <Image src="/logo.png" alt="Amanda Nunes" fill className="object-cover" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Amanda Nunes</h3>
            <p className="text-xs text-blue-600 font-semibold mt-0.5">Jornalista & Redatora Sênior</p>
            <p className="text-xs text-slate-500 mt-2">Cobertura diária de editais municipais, processos seletivos e carreiras jurídicas.</p>
          </div>

          <div className="bg-slate-100 rounded-xl p-5 text-center border border-slate-200 shadow-sm">
            <div className="w-20 h-20 mx-auto rounded-full overflow-hidden mb-3 relative border-2 border-blue-600">
              <Image src="/logo.png" alt="Gleice Melo" fill className="object-cover" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Gleice Melo</h3>
            <p className="text-xs text-blue-600 font-semibold mt-0.5">Pesquisadora & Curadora de Conteúdo</p>
            <p className="text-xs text-slate-500 mt-2">Foco nas carreiras de Segurança Pública, Saúde e Educação em âmbito nacional.</p>
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          🤝 Compromisso com a Transparência
        </h2>
        <p>
          O <strong>Concursos Agora</strong> é um portal de imprensa livre e independente. Respeitamos rigorosamente a LGPD e garantimos a integridade de todos os conteúdos publicados.
        </p>
      </div>
    </article>
  );
}
