import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fontes Oficiais e Metodologia | Concursos Agora',
  description: 'Conheça a metodologia e as principais fontes oficiais monitoradas pelo Concursos Agora, garantindo informações precisas sobre os certames.',
  alternates: {
    canonical: 'https://concursosagora.com.br/fontes-oficiais',
  },
};

export default function FontesOficiaisPage() {
  return (
    <article className="max-w-4xl mx-auto px-4 py-10 text-slate-800">
      <header className="border-b border-slate-200 pb-6 mb-8">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Fontes Oficiais e Metodologia
        </h1>
        <p className="text-slate-500 text-sm mt-2">
          Última atualização: Setembro de 2026
        </p>
      </header>

      <div className="prose prose-slate max-w-none space-y-6 text-base leading-relaxed">
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg text-amber-900 mb-6">
          <p className="font-semibold text-sm">
            ⚠️ O <strong>Concursos Agora</strong> reforça que, embora nosso conteúdo seja fundamentado rigorosamente em fontes primárias, as informações têm caráter informativo. Recomendamos que você <strong>sempre valide os dados no edital oficial</strong> e na página da banca antes de realizar sua inscrição.
          </p>
        </div>

        <p>
          Transparência é o pilar fundamental do nosso trabalho. Para garantir a veracidade e atualidade dos dados divulgados no <strong>Concursos Agora</strong>, empregamos uma metodologia rigorosa de captação e validação das informações provenientes exclusivamente de canais oficiais e consolidados.
        </p>

        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          1. Fontes Primárias Monitoradas
        </h2>
        <p>
          Monitoramos diariamente centenas de publicações governamentais. Nossas fontes primárias de consulta incluem:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>DOU (Diário Oficial da União):</strong> Para autorizações, portarias e editais no âmbito federal.</li>
          <li><strong>DOE (Diários Oficiais Estaduais e do DF):</strong> Para todos os comunicados referentes às polícias civis, militares, secretarias estaduais e governos de Estado.</li>
          <li><strong>Diários Oficiais dos Municípios:</strong> Para certames de prefeituras, câmaras municipais e guardas civis.</li>
          <li><strong>Portais de Transparência:</strong> Para cruzamento de dados sobre cargos vagos e salários reais, sempre que aplicável.</li>
        </ul>

        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          2. Bancas Organizadoras Acompanhadas
        </h2>
        <p>
          As bancas organizadoras são entidades cruciais para o desenvolvimento e a lisura de um concurso. Acompanhamos as publicações de todas as principais instituições de organização de certames no Brasil, destacando-se:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Cebraspe (Cespe/UnB)</strong></li>
          <li><strong>Fundação Getulio Vargas (FGV)</strong></li>
          <li><strong>Fundação Vunesp</strong></li>
          <li><strong>Fundação Carlos Chagas (FCC)</strong></li>
          <li><strong>IBFC (Instituto Brasileiro de Formação e Capacitação)</strong></li>
          <li><strong>Instituto AOCP</strong></li>
          <li><strong>Fundatec</strong></li>
          <li><strong>Instituto Quadrix</strong></li>
          <li><strong>Fundação Cesgranrio</strong></li>
        </ul>

        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          3. Metodologia
        </h2>
        <p>
          Nossa equipe segue um fluxo metódico para a publicação das notícias, minimizando riscos de distorções:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Identificação:</strong> Notamos a movimentação oficial (como portarias autorizativas, definição da banca, etc.) nos Diários ou sites oficiais.</li>
          <li><strong>Validação:</strong> Os dados são cruzados e verificados para confirmar sua validade e vigência atual.</li>
          <li><strong>Classificação:</strong> O certame é categorizado (status: autorizado, comissão formada, edital publicado, inscrições abertas) e classificado por nível de escolaridade, região e salários.</li>
          <li><strong>Publicação:</strong> Um resumo detalhado, em linguagem acessível e didática, é disponibilizado aos leitores, facilitando a compreensão dos requisitos e do cronograma.</li>
        </ul>
      </div>
    </article>
  );
}
