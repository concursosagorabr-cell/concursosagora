import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política Editorial e de Correções | Concursos Agora',
  description: 'Conheça a nossa política editorial, processos de checagem, metodologia de atualização e correções do Concursos Agora.',
  alternates: {
    canonical: 'https://concursosagora.com.br/politica-editorial',
  },
};

export default function PoliticaEditorialPage() {
  return (
    <article className="max-w-4xl mx-auto px-4 py-10 text-slate-800">
      <header className="border-b border-slate-200 pb-6 mb-8">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Política Editorial e de Correções
        </h1>
        <p className="text-slate-500 text-sm mt-2">
          Última atualização: Setembro de 2026
        </p>
      </header>

      <div className="prose prose-slate max-w-none space-y-6 text-base leading-relaxed">
        <p>
          A Política Editorial do <strong>Concursos Agora</strong> norteia o nosso compromisso inabalável com a precisão, imparcialidade e utilidade das informações. Nosso portal é focado em entregar conteúdo confiável e atualizado para auxiliar os candidatos a cargos públicos em todo o Brasil.
        </p>

        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          1. Nossa Missão
        </h2>
        <p>
          A missão do portal é fornecer acesso rápido, claro e confiável a informações de concursos públicos. Nosso objetivo é democratizar o acesso à informação sobre editais e carreiras públicas, permitindo que os candidatos tomem decisões bem fundamentadas sobre suas jornadas de estudo.
        </p>

        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          2. Nossas Fontes de Informação
        </h2>
        <p>
          Prezamos pela transparência e pela validação dos dados. Nossas principais fontes são exclusivamente canais oficiais e legítimos, tais como:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Diário Oficial da União (DOU);</li>
          <li>Diários Oficiais Estaduais (DOE) e Municipais;</li>
          <li>Portais de Transparência e sites institucionais de órgãos públicos;</li>
          <li>Sites oficiais das bancas organizadoras.</li>
        </ul>

        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          3. Processo Editorial e de Checagem
        </h2>
        <p>
          A elaboração dos nossos conteúdos segue um rigoroso fluxo editorial. Iniciamos com o monitoramento automatizado de publicações oficiais, que agiliza a detecção de novos editais. A partir daí, a redação inicial pode contar com assistência de inteligência artificial (IA) para a formatação e estruturação da matéria. No entanto, <strong>todo e qualquer conteúdo</strong> passa por criteriosa revisão humana e checagem de fatos (cruzamento com os documentos oficiais) antes da publicação final. Todo esse processo — da apuração à revisão final — é conduzido por mim.
        </p>

        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          4. Política de Atualização
        </h2>
        <p>
          Concursos públicos são dinâmicos e sujeitos a frequentes alterações (retificações de edital, suspensões ou reaberturas de prazos). Nós atualizamos ativamente os artigos quando novas informações relevantes são publicadas oficialmente, adicionando ressalvas visíveis sobre as mudanças.
        </p>

        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          5. Política de Correções (Errata)
        </h2>
        <p>
          Embora eu adote padrões rigorosos de checagem, erros podem ocorrer. Quando uma imprecisão factual é detectada ou apontada por nossos leitores, atuamos rapidamente. O artigo é corrigido no sistema, e, para garantir a máxima transparência, incluímos uma nota de &quot;Errata&quot; ou &quot;Atualização&quot; no texto, explicando claramente o que foi corrigido e quando a alteração foi feita.
        </p>

        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          6. Independência Editorial
        </h2>
        <p>
          O <strong>Concursos Agora</strong> é um veículo de comunicação independente. Não representamos nenhuma banca organizadora, curso preparatório, ou entidade governamental. Nossos conteúdos e destaques são determinados exclusivamente pelo interesse jornalístico e pela relevância da oportunidade para os candidatos.
        </p>

        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          7. Reporte um Erro
        </h2>
        <p>
          Incentivamos nossos leitores a nos ajudarem a manter a mais alta qualidade informativa. Se você notar qualquer erro, imprecisão, link quebrado ou inconsistência, pedimos a gentileza de nos informar imediatamente através do e-mail <strong>contato@concursosagora.com.br</strong>. Agradecemos imensamente o seu apoio.
        </p>
      </div>
    </article>
  );
}
