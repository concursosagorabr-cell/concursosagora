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
export const revalidate = 60;
const EDITORS = [
  {
    name: 'Marco Antonio',
    role: 'Redator, Desenvolvedor & Responsável pelo Portal',
    image: 'https://cdn.sanity.io/images/wobukj4j/production/200ab6e96347ffba72b00d0ca288a97d83a2ab30-191x191.jpg?w=160&h=160&fit=crop&q=85&auto=format',
    bio: 'Formado em Análise e Desenvolvimento de Sistemas (Univesp/SP). Responsável pelo conteúdo editorial, pela infraestrutura técnica e pela conformidade com a LGPD do Concursos Agora.',
    linkedin: 'https://www.linkedin.com/in/marco-antonio-de-agostino-mariano-de-melo-01309432b/',
    twitter: 'https://x.com/Marco26176183',
  },
  {
    name: 'Amanda Nunes',
    role: 'Repórter Especial de Concursos & Roteiros de Estudo',
    image: 'https://cdn.sanity.io/images/wobukj4j/production/667402ee1a565a00806a6731e2345eeb92b78203-1024x819.jpg?w=160&h=160&fit=crop&crop=top&q=85&auto=format',
    bio: 'Colaboradora freelance na cobertura e revisão de certames com foco em seleções municipais, prefeituras, magistério e saúde. Apoia na apuração de convocações de cadastro reserva e cronogramas práticos.',
  },
  {
    name: 'Gleice Melo',
    role: 'Especialista em Carreiras Policiais & Preparação para o TAF',
    image: 'https://cdn.sanity.io/images/wobukj4j/production/c3479cde43504faa7dd97f24afeea55be40bdf54-819x1024.jpg?w=160&h=160&fit=crop&crop=top&q=85&auto=format',
    bio: 'Colaboradora freelance dedicada ao acompanhamento de concursos de Segurança Pública (Polícias Militar, Civil, Federal e Penal) e levantamento de critérios eliminatórios de TAF e exames de aptidão.',
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
          👤 Quem Faz o Concursos Agora
        </h2>
        <p className="mb-6">
          Conheça quem está por trás do conteúdo do Concursos Agora:
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
              {(editor.linkedin || editor.twitter) ? (
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
              ) : null}
            </div>
          ))}
        </div>

        <h2 className="text-xl font-bold text-slate-900 mt-8 mb-4 border-l-4 border-blue-600 pl-3">
          🤝 Compromisso com a Transparência
        </h2>
        <p>
          O Concursos Agora é um projeto independente, mantido por mim, <strong>Marco Antonio de Agostino Mariano de Melo</strong> — redator e desenvolvedor do portal. Sou formado em Análise e Desenvolvimento de Sistemas pela Univesp (SP) e cuido pessoalmente da infraestrutura técnica, da segurança e da conformidade com a LGPD do site. Não represento nenhuma empresa registrada: é um projeto pessoal, criado para organizar e facilitar o acesso a informações públicas sobre concursos.
        </p>
        <p>
          Você pode falar comigo diretamente pelo{' '}
          <a
            href="https://www.linkedin.com/in/marco-antonio-de-agostino-mariano-de-melo-01309432b/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-semibold"
          >
            LinkedIn
          </a>{' '}
          ou pelo e-mail{' '}
          <ObfuscatedContactLink user="privacidade" className="text-blue-600 hover:underline font-semibold" />.
        </p>

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
