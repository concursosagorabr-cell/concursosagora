import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Aviso Legal — Concursos Agora',
  description: 'Confira o aviso legal e os termos de isenção de responsabilidade sobre o conteúdo publicado no portal Concursos Agora.',
  alternates: {
    canonical: 'https://concursosagora.com.br/aviso-legal',
  },
};

export default function AvisoLegalPage() {
  return (
    <article className="max-w-4xl mx-auto px-4 py-10 text-slate-800">
      <header className="border-b border-slate-200 pb-6 mb-8">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Aviso Legal e Termos de Uso
        </h1>
        <p className="text-slate-500 text-sm mt-2">
          Última atualização: 30 de julho de 2026
        </p>
      </header>

      <div className="prose prose-slate max-w-none space-y-6 text-base leading-relaxed">
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg text-amber-900 mb-6">
          <p className="font-semibold text-sm">
            ⚠️ O portal <strong>Concursos Agora</strong> é um veículo de imprensa e informação jornalística independente. Não somos uma banca organizadora e não vendemos inscrições ou aplicamos provas de concursos públicos.
          </p>
        </div>

        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          1. Caráter Informativo do Conteúdo
        </h2>
        <p>
          Todas as matérias, resumos de edital, cronogramas, tabelas de salários e vagas publicados no <strong>Concursos Agora</strong> possuem caráter puramente informativo e educativo. Embora façamos o máximo esforço para manter todas as informações atualizadas e corretas com base nos Diários Oficiais e sites formais das bancas organizadoras, não garantimos a isenção absoluta de eventuais retificações de última hora feitas pelos órgãos públicos.
        </p>

        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          2. Consulta Obrigatória aos Editais Oficiais
        </h2>
        <p>
          O candidato <strong>DEVE SEMPRE</strong> consultar o edital oficial e suas eventuais retificações diretamente nos canais e sites oficiais da banca organizadora do concurso (como Cebraspe, Vunesp, FGV, FCC, Selecon, IBFC, etc.) antes de tomar qualquer decisão de inscrição, pagamento de taxa ou planejamento de viagem para realização de prova.
        </p>

        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          3. Isenção de Responsabilidade
        </h2>
        <p>
          O <strong>Concursos Agora</strong> e sua equipe editorial não se responsabilizam por:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Alterações de última hora nos prazos, locais de prova, vagas ou salários feitos pela comissão do concurso público;</li>
          <li>Inscrições não homologadas, perdas de prazos de isenção ou comprovantes de pagamento não efetuados;</li>
          <li>Instabilidades nos sites oficiais das bancas organizadoras;</li>
          <li>Decisões tomadas com base em interpretações de matérias opinativas ou resumos informativos.</li>
        </ul>

        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          4. Direitos Autorais e Propriedade Intelectual
        </h2>
        <p>
          Todo o conteúdo original produzido pela nossa equipe editorial (textos reescritos, análises e organização gráfica) está protegido pelas leis de Direitos Autorais. A reprodução parcial de trechos é permitida desde que obrigatoriamente acompanhada do devido crédito e link direto para a matéria original em nosso portal.
        </p>
      </div>
    </article>
  );
}
