import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de Privacidade — Concursos Agora',
  description: 'Conheça nossa política de privacidade e saiba como o Concursos Agora trata e protege seus dados pessoais.',
  alternates: {
    canonical: 'https://concursosagora.com.br/politica-de-privacidade',
  },
};

export default function PoliticaDePrivacidadePage() {
  return (
    <article className="max-w-4xl mx-auto px-4 py-10 text-slate-800 dark:text-slate-200">
      <header className="border-b border-slate-200 dark:border-slate-800 pb-6 mb-8">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Política de Privacidade
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
          Última atualização: 30 de julho de 2026
        </p>
      </header>

      <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-base leading-relaxed">
        <p>
          A sua privacidade é de extrema importância para o portal <strong>Concursos Agora</strong>. Esta Política de Privacidade descreve como suas informações pessoais são coletadas, usadas e compartilhadas quando você visita ou faz uso do nosso site (<code>concursosagora.com.br</code>).
        </p>

        <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          1. Coleta de Informações
        </h2>
        <p>
          O <strong>Concursos Agora</strong> é um portal informativo público de notícias e editais de concursos públicos. Não solicitamos cadastro obrigatório para a leitura do conteúdo. No entanto, coletamos informações automaticamente quando você navega pelo site, tais como:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Endereço IP e tipo de navegador utilizado;</li>
          <li>Páginas visitadas, tempo de permanência e links clicados;</li>
          <li>Dispositivo utilizado (computador, celular ou tablet);</li>
          <li>Dados de cookies para melhorar a experiência de navegação e exibição de conteúdos relevantes.</li>
        </ul>

        <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          2. Uso de Cookies e Tecnologias de Rastreamento
        </h2>
        <p>
          Utilizamos cookies para personalizar a sua experiência no site, analisar o tráfego de visitantes e oferecer funcionalidades de redes sociais. Você pode a qualquer momento desativar a aceitação de cookies nas configurações do seu navegador de internet, embora isso possa afetar algumas funcionalidades do portal.
        </p>

        <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          3. Links para Sites de Terceiros e Bancas Organizadoras
        </h2>
        <p>
          Nossos artigos e editais contêm links direcionados para sites externos de bancas organizadoras (como Cespe/Cebraspe, Vunesp, FGV, FCC, etc.) e órgãos públicos oficiais. Não nos responsabilizamos pelas práticas de privacidade ou conteúdo praticados por esses sites externos. Recomendamos que leia a política de privacidade de cada site visitado.
        </p>

        <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          4. Proteção de Dados e Lei Geral de Proteção de Dados (LGPD)
        </h2>
        <p>
          Em conformidade com a <strong>Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 - LGPD)</strong>, garantimos a transparência no tratamento dos seus dados. Qualquer dado eventualmente fornecido via formulários de contato é armazenado com segurança e utilizado estritamente para o propósito indicado.
        </p>

        <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          5. Alterações nesta Política
        </h2>
        <p>
          Podemos atualizar esta Política de Privacidade periodicamente para refletir mudanças em nossas práticas ou por razões operacionais, legais ou regulamentares.
        </p>

        <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          6. Contato
        </h2>
        <p>
          Se você tiver dúvidas ou esclarecimentos sobre esta Política de Privacidade, entre em contato conosco através do nosso site ou pelas informações disponibilizadas em nossa página <Link href="/sobre-nos" className="text-blue-600 hover:underline">Sobre Nós</Link>.
        </p>
      </div>
    </article>
  );
}
