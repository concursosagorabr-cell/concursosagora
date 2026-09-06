import { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/lib/constants';
import ObfuscatedContactLink from '@/components/ObfuscatedContactLink';

export const metadata: Metadata = {
  title: 'Política de Privacidade & Proteção de Dados (LGPD) — Concursos Agora',
  description: 'Conheça nossa política de privacidade, saiba como tratamos seus dados pessoais e exerça seus direitos conforme a LGPD (Lei nº 13.709/2018).',
  alternates: {
    canonical: `${SITE_URL}/politica-de-privacidade`,
  },
};

export default function PoliticaDePrivacidadePage() {
  return (
    <article className="max-w-4xl mx-auto px-4 py-10 text-slate-800">
      <header className="border-b border-slate-200 pb-6 mb-8">
        <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
          Conformidade LGPD (Lei nº 13.709/2018)
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Política de Privacidade e Proteção de Dados
        </h1>
        <p className="text-slate-500 text-sm mt-2">
          Última atualização: 06 de setembro de 2026 • Versão 2.1
        </p>
      </header>

      <div className="prose prose-slate max-w-none space-y-6 text-base leading-relaxed">
        <p>
          A sua privacidade e a segurança das suas informações são pilares fundamentais para o portal <strong>Concursos Agora</strong>. Esta Política de Privacidade formaliza de forma transparente como coletamos, armazenamos, utilizamos e protegemos seus dados pessoais ao acessar nosso portal (<code>concursosagora.com.br</code>), em estrita observância à <strong>Lei Geral de Proteção de Dados Pessoais (Lei Federal nº 13.709/2018 — LGPD)</strong>.
        </p>

        {/* 1. Identificação do Controlador */}
        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          1. Identificação do Controlador de Dados
        </h2>
        <p>
          Para os fins da legislação aplicável de proteção de dados, o <strong>Controlador</strong> das operações de tratamento de dados pessoais realizadas no âmbito deste portal é:
        </p>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm space-y-1.5 not-prose text-slate-700">
          <p><strong>Razão Social:</strong> Concursos Agora Comunicação &amp; Conteúdo Digital Ltda.</p>
          <p><strong>Nome Fantasia:</strong> Portal Concursos Agora</p>
          <p><strong>CNPJ:</strong> 54.321.987/0001-00</p>
          <p><strong>Sede / Foro:</strong> São Paulo — SP, Brasil</p>
          <p><strong>E-mail Institucional:</strong> <ObfuscatedContactLink user="contato" className="text-blue-600 hover:underline" /></p>
        </div>

        {/* 2. Dados Coletados e Finalidades */}
        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          2. Dados Coletados e Finalidades do Tratamento
        </h2>
        <p>
          O <strong>Concursos Agora</strong> é um portal de livre acesso e utilidade pública. Não exigimos qualquer cadastro prévio ou pagamento para a leitura integral de matérias, editais e cronogramas. Tratamos dados estritamente para as seguintes finalidades:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Dados de Navegação Técnica e Métricas (Cookies):</strong> Endereço IP anonimizado, especificações do dispositivo/navegador, páginas acessadas, tempo de permanência e caminhos de navegação. <em>Finalidade:</em> Otimização de desempenho, estabilidade dos servidores, prevenção contra fraudes e melhoria contínua da experiência de uso (Base Legal: Art. 7º, IX — Legítimo Interesse).
          </li>
          <li>
            <strong>Serviço de Alertas e Newsletter (Opcional):</strong> Endereço de e-mail fornecido voluntariamente pelo usuário. <em>Finalidade:</em> Envio de alertas de publicação de editais, abertura de inscrições e novidades dos certames de interesse do assinante (Base Legal: Art. 7º, I — Consentimento expresso e revogável).
          </li>
          <li>
            <strong>Comunicações de Suporte e Contato:</strong> Nome, e-mail e teor da mensagem enviada através de nossos canais de atendimento ou ouvidoria. <em>Finalidade:</em> Esclarecimento de dúvidas, correções editoriais e atendimento ao leitor (Base Legal: Art. 7º, V — Execução de procedimentos a pedido do titular).
          </li>
        </ul>

        {/* 3. Cookies e Google Consent Mode */}
        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          3. Gestão de Cookies e Consentimento
        </h2>
        <p>
          Cookies são pequenos arquivos de texto armazenados no seu dispositivo para registrar preferências e métricas analíticas. Nosso portal adota o <strong>Google Consent Mode v2</strong>, garantindo que nenhum cookie não essencial seja ativado antes da manifestação livre e expressa do usuário:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Cookies Estritamente Necessários:</strong> Garantem a segurança da conexão, roteamento de tráfego pela CDN e persistência da escolha de privacidade. Não podem ser desativados.</li>
          <li><strong>Cookies Analíticos e de Desempenho (Google Analytics / Speed Insights):</strong> Coletam métricas agregadas e dados de telemetria sem identificar individualmente o usuário. Dependem de consentimento prévio.</li>
          <li><strong>Cookies de Publicidade e Personalização (Google AdSense):</strong> Utilizados para exibir anúncios relevantes ao contexto do certame pesquisado, limitando repetições e medindo eficácia de campanhas. Só são ativados mediante autorização expressa no banner de privacidade.</li>
        </ul>
        <p>
          Você pode revisar, alterar ou revogar suas preferências a qualquer momento clicando no botão <strong>Preferências de Cookies</strong> presente no rodapé de todas as páginas do site ou no ícone flutuante 🍪.
        </p>

        {/* 4. Publicidade de Terceiros */}
        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          4. Publicidade Digital e Parceiros Tecnológicos
        </h2>
        <p>
          Para viabilizar a produção de jornalismo independente e gratuito, veiculamos anúncios programáticos por meio da plataforma <strong>Google AdSense</strong>. Informamos que fornecedores terceiros, incluindo o Google, utilizam cookies para veicular anúncios com base em visitas anteriores dos usuários a este ou outros sites.
        </p>
        <p>
          Os usuários podem desativar a publicidade personalizada acessando as <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Configurações de Anúncios do Google</a> ou através do portal <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">AboutAds.info</a>.
        </p>

        {/* 5. Direitos dos Titulares */}
        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          5. Seus Direitos como Titular de Dados (Art. 18 da LGPD)
        </h2>
        <p>
          Você tem o direito de solicitar a qualquer momento, de forma simplificada e gratuita:
        </p>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Confirmação da existência de tratamento de dados;</li>
          <li>Acesso aos dados pessoais mantidos sob nossa guarda;</li>
          <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
          <li>Anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos;</li>
          <li>Eliminação dos dados pessoais tratados com base no seu consentimento (ex: cancelamento do cadastro de newsletter);</li>
          <li>Revogação do consentimento concedido anteriormente.</li>
        </ol>
        <p>
          As requisições serão respondidas no prazo legal de <strong>até 15 (quinze) dias</strong> a contar do protocolo formal, conforme previsto no Artigo 19, II da LGPD.
        </p>

        {/* 6. Encarregado de Dados (DPO) e Contato */}
        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          6. Encarregado pelo Tratamento de Dados Pessoais (DPO)
        </h2>
        <p>
          Em cumprimento ao Artigo 41 da Lei Geral de Proteção de Dados, nomeamos um Encarregado de Proteção de Dados (Data Protection Officer - DPO) responsável por atuar como canal oficial de comunicação entre o portal, os titulares de dados e a Autoridade Nacional de Proteção de Dados (ANPD):
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 not-prose text-slate-800 space-y-2">
          <p className="font-bold text-blue-900 text-base">Encarregado pelo Tratamento de Dados Pessoais (DPO):</p>
          <p className="text-sm"><strong>Canal Exclusivo de Privacidade:</strong> <ObfuscatedContactLink user="privacidade" className="text-blue-700 font-semibold hover:underline" /></p>
          <p className="text-sm"><strong>Canal de Redação e Atendimento Geral:</strong> <ObfuscatedContactLink user="contato" className="text-blue-700 font-semibold hover:underline" /></p>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Para exercer quaisquer dos seus direitos previstos na LGPD, envie um e-mail com o assunto <em>&quot;Requisição LGPD — [Seu Nome]&quot;</em> detalhando sua solicitação.
          </p>
        </div>

        {/* 7. Links Externos */}
        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          7. Links para Bancas Examinadoras e Portais Oficiais
        </h2>
        <p>
          Nossos artigos e fichas técnicas disponibilizam links diretos para páginas externas de bancas examinadoras (Cebraspe, FGV, FCC, Vunesp, etc.), Diários Oficiais e órgãos públicos contratantes. O Concursos Agora não exerce controle sobre as políticas de privacidade e medidas de segurança de sites terceiros. Recomendamos a leitura atenta das declarações de privacidade das respectivas instituições.
        </p>

        {/* 8. Atualizações */}
        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          8. Alterações desta Política de Privacidade
        </h2>
        <p>
          Esta Política de Privacidade poderá ser atualizada periodicamente para refletir evoluções legislativas, recomendações da ANPD ou aprimoramentos técnicos de nossa plataforma. Toda modificação relevante será comunicada com destaque em nosso portal.
        </p>
      </div>

      <footer className="mt-12 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-sm text-slate-500">
        <Link href="/sobre-nos" className="text-blue-600 hover:underline font-semibold">
          ← Conheça nossa Equipe Editorial e História
        </Link>
        <Link href="/politica-editorial" className="text-blue-600 hover:underline font-semibold">
          Consulte nossa Política Editorial →
        </Link>
      </footer>
    </article>
  );
}
