import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { SITE_URL } from '@/lib/constants';
import ObfuscatedContactLink from '@/components/ObfuscatedContactLink';

export const metadata: Metadata = {
  title: 'Sobre Nós — Equipe Editorial, Missão & Governança | Concursos Agora',
  description: 'Conheça a história, a equipe editorial e os padrões de governança do Portal Concursos Agora, sua fonte confiável de editais públicos no Brasil.',
  alternates: {
    canonical: `${SITE_URL}/sobre-nos`,
  },
};

const EDITORS = [
  {
    name: 'Marco Antonio',
    role: 'Editor-Chefe & Especialista em Carreiras Fiscais e Jurídicas',
    image: 'https://cdn.sanity.io/images/wobukj4j/production/200ab6e96347ffba72b00d0ca288a97d83a2ab30-191x191.jpg?w=160&h=160&fit=crop&q=85&auto=format',
    bio: 'Mais de 10 anos de vivência no ecossistema de concursos públicos. Especialista em análise orçamentária, carreiras de controle, tribunais federais e perfil de bancas examinadoras.',
    linkedin: 'https://www.linkedin.com/in/marco-antonio-de-agostino-mariano-de-melo-01309432b',
    twitter: 'https://x.com/Marco26176183',
  },
  {
    name: 'Amanda Nunes',
    role: 'Repórter Especial de Concursos & Roteiros de Estudo',
    image: 'https://cdn.sanity.io/images/wobukj4j/production/667402ee1a565a00806a6731e2345eeb92b78203-1024x819.jpg?w=160&h=160&fit=crop&crop=top&q=85&auto=format',
    bio: 'Jornalista investigativa com foco em seleções municipais, prefeituras, magistério e saúde. Especialista em estratégias de reta final e análise de convocações de cadastro reserva.',
    linkedin: 'https://www.linkedin.com/company/concursosagora',
    twitter: 'https://x.com/ConcursosAgora1',
  },
  {
    name: 'Gleice Melo',
    role: 'Especialista em Carreiras Policiais & Preparação para o TAF',
    image: 'https://cdn.sanity.io/images/wobukj4j/production/c3479cde43504faa7dd97f24afeea55be40bdf54-819x1024.jpg?w=160&h=160&fit=crop&crop=top&q=85&auto=format',
    bio: 'Pesquisadora com foco exclusivo nas corporações policiais militares, civis, federais e penais. Cobertura diária de comissões, editais, testes físicos e critérios médicos eliminatórios.',
    linkedin: 'https://www.linkedin.com/company/concursosagora',
    twitter: 'https://x.com/ConcursosAgora1',
  },
];

export default function SobreNosPage() {
  return (
    <article className="max-w-4xl mx-auto px-4 py-10 text-slate-800">
      <header className="border-b border-slate-200 pb-6 mb-8 text-center sm:text-left">
        <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
          Quem Somos &amp; Princípios Editoriais
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Sobre o Concursos Agora
        </h1>
        <p className="text-slate-600 text-lg mt-2 font-medium">
          Jornalismo independente, ágil e aprofundado para concurseiros em todo o Brasil.
        </p>
      </header>

      <div className="prose prose-slate max-w-none space-y-6 text-base leading-relaxed">
        <p>
          O <strong>Concursos Agora</strong> é um portal de notícias e inteligência sobre o serviço público brasileiro. Nossa missão central é democratizar o acesso à informação de qualidade, transformando editais burocráticos e complexos em análises claras, práticas e diretamente aplicáveis à rotina de estudos de quem busca a estabilidade financeira e profissional.
        </p>

        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          🎯 Nossa Missão &amp; Valores
        </h2>
        <p>
          Acreditamos que o concurso público é o mais democrático instrumento de ascensão social e de seleção meritocrática do Estado brasileiro. Pautamos nossa cobertura jornalística sob três pilares inegociáveis:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Veracidade Absoluta:</strong> Todo certame noticiado passa por conferência com Diários Oficiais da União, dos Estados ou dos Municípios, e documentos oficiais das bancas organizadoras.</li>
          <li><strong>Agilidade com Profundidade:</strong> Não nos limitamos a replicar comunicados; entregamos raio-x de bancas, históricos de nomeações e detalhamento de remuneração real.</li>
          <li><strong>Acesso Livre e Gratuito:</strong> Informações de utilidade pública essenciais não devem estar trancadas sob barreiras de cobrança (paywall).</li>
        </ul>

        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          👥 Nossa Equipe Editorial
        </h2>
        <p className="mb-6">
          Nosso conselho de redatores e analistas reúne especialistas com formação em comunicação, direito e serviço público:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 not-prose my-8">
          {EDITORS.map((editor) => (
            <div
              key={editor.name}
              className="bg-white rounded-2xl p-5 text-center border border-slate-200 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="w-24 h-24 mx-auto rounded-full overflow-hidden mb-3 relative border-2 border-blue-600 shadow-md">
                  <Image
                    src={editor.image}
                    alt={`Foto de perfil de ${editor.name} — Equipe Concursos Agora`}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-bold text-slate-900 text-base">{editor.name}</h3>
                <p className="text-xs text-blue-700 font-bold mt-0.5 leading-snug">{editor.role}</p>
                <p className="text-xs text-slate-600 mt-3 leading-relaxed text-left">{editor.bio}</p>
              </div>

              {/* Redes sociais do editor */}
              <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-slate-100 text-xs">
                {editor.linkedin && (
                  <a
                    href={editor.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0a66c2] hover:underline font-semibold flex items-center gap-1"
                    title={`Perfil de ${editor.name} no LinkedIn`}
                  >
                    LinkedIn
                  </a>
                )}
                {editor.twitter && (
                  <a
                    href={editor.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-800 hover:underline font-semibold flex items-center gap-1"
                    title={`Perfil de ${editor.name} no X`}
                  >
                    X (Twitter)
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          🏢 Identificação Corporativa &amp; Transparência
        </h2>
        <p>
          O <strong>Portal Concursos Agora</strong> opera de forma totalmente regular sob os preceitos da legislação de imprensa brasileira e da Lei Geral de Proteção de Dados:
        </p>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 not-prose text-sm text-slate-700 space-y-2">
          <p><strong>Entidade Mantenedora:</strong> Concursos Agora Comunicação &amp; Conteúdo Digital Ltda.</p>
          <p><strong>Sede:</strong> São Paulo — SP, Brasil</p>
          <p><strong>Redação e Furos de Reportagem:</strong> <ObfuscatedContactLink user="contato" className="text-blue-600 hover:underline" /></p>
          <p><strong>Ouvidoria e Proteção de Dados (DPO):</strong> <ObfuscatedContactLink user="privacidade" className="text-blue-600 hover:underline" /></p>
        </div>

        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          📖 Diretrizes e Governança Institucional
        </h2>
        <p>
          Convidamos nossos leitores a conhecer em profundidade nossas políticas e padrões de verificação:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <Link href="/politica-editorial" className="text-blue-600 hover:underline font-semibold">
              Política Editorial:
            </Link>{' '}
            Metodologia de checagem, correções e conduta ética jornalística.
          </li>
          <li>
            <Link href="/fontes-oficiais" className="text-blue-600 hover:underline font-semibold">
              Fontes Oficiais:
            </Link>{' '}
            Relação completa de Diários Oficiais e bancas organizadoras auditadas pela nossa redação.
          </li>
          <li>
            <Link href="/politica-de-privacidade" className="text-blue-600 hover:underline font-semibold">
              Política de Privacidade (LGPD):
            </Link>{' '}
            Diretrizes rigorosas sobre coleta, anonimização e direitos dos titulares de dados.
          </li>
          <li>
            <Link href="/termos-de-uso" className="text-blue-600 hover:underline font-semibold">
              Termos de Uso:
            </Link>{' '}
            Condições gerais de navegação e utilização dos serviços informativos.
          </li>
        </ul>
      </div>
    </article>
  );
}
