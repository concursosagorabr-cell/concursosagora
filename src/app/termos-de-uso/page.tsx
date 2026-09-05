import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Termos de Uso | Concursos Agora',
  description: 'Leia nossos Termos de Uso. Saiba mais sobre as regras de utilização, escopo dos serviços, direitos autorais e isenção de responsabilidade do Concursos Agora.',
  alternates: {
    canonical: 'https://concursosagora.com.br/termos-de-uso',
  },
};

export default function TermosDeUsoPage() {
  return (
    <article className="max-w-4xl mx-auto px-4 py-10 text-slate-800">
      <header className="border-b border-slate-200 pb-6 mb-8">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Termos de Uso
        </h1>
        <p className="text-slate-500 text-sm mt-2">
          Última atualização: Setembro de 2026
        </p>
      </header>

      <div className="prose prose-slate max-w-none space-y-6 text-base leading-relaxed">
        <p>
          Bem-vindo ao <strong>Concursos Agora</strong>. Ao acessar e utilizar este portal, você concorda expressamente com os Termos de Uso aqui descritos. Caso não concorde com alguma das condições, solicitamos que não utilize nossos serviços.
        </p>

        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          1. Escopo dos Serviços
        </h2>
        <p>
          O <strong>Concursos Agora</strong> é um portal de notícias e informações com o objetivo de divulgar editais, vagas e novidades sobre concursos públicos em todo o Brasil. Não somos uma banca organizadora, tampouco realizamos inscrições ou aplicamos provas de qualquer natureza. Nosso foco é exclusivamente informativo.
        </p>

        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          2. Propriedade Intelectual
        </h2>
        <p>
          Todo o conteúdo publicado neste site, incluindo textos, artigos, resumos, design e layout, é de propriedade do <strong>Concursos Agora</strong> ou de parceiros devidamente creditados, sendo protegido pelas leis brasileiras de direitos autorais. A reprodução, cópia ou distribuição sem a devida citação e link para a fonte original é estritamente proibida.
        </p>

        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          3. Obrigações do Usuário
        </h2>
        <p>
          Ao utilizar nosso portal, o usuário compromete-se a:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Fazer uso das informações para fins lícitos e pessoais;</li>
          <li>Não utilizar ferramentas automatizadas (bots, scrapers) para extrair dados sem autorização prévia;</li>
          <li>Respeitar a legislação vigente, especialmente no que tange a direitos de imagem e propriedade intelectual.</li>
        </ul>

        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          4. Limitação de Responsabilidade
        </h2>
        <p>
          Trabalhamos arduamente para manter as informações do portal precisas e atualizadas. No entanto, informações sobre editais, datas e vagas podem ser alteradas pelas bancas organizadoras a qualquer momento. Portanto, as informações fornecidas têm caráter meramente referencial e podem estar desatualizadas. O candidato deve <strong>sempre consultar os editais e comunicados oficiais</strong> das bancas organizadoras. O portal não se responsabiliza por eventuais danos, perdas de prazos ou prejuízos decorrentes do uso das informações aqui contidas.
        </p>

        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          5. Privacidade
        </h2>
        <p>
          A proteção dos seus dados pessoais é muito importante para nós. Para entender como coletamos, utilizamos e protegemos as suas informações, por favor, leia a nossa <Link href="/politica-de-privacidade" className="text-blue-600 hover:underline">Política de Privacidade</Link>.
        </p>

        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          6. Legislação Aplicável e Foro
        </h2>
        <p>
          Estes Termos de Uso são regidos e interpretados de acordo com as leis da República Federativa do Brasil. Fica eleito o foro da comarca da sede do <strong>Concursos Agora</strong> para dirimir quaisquer dúvidas ou litígios oriundos da utilização deste portal.
        </p>

        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          7. Contato
        </h2>
        <p>
          Para eventuais dúvidas, críticas ou sugestões a respeito destes Termos de Uso, entre em contato conosco através do e-mail <strong>contato@concursosagora.com.br</strong>.
        </p>
      </div>
    </article>
  );
}
