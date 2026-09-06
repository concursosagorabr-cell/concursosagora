import Link from 'next/link';
import CookiePreferencesButton from './CookiePreferencesButton';
import ObfuscatedContactLink from './ObfuscatedContactLink';
import Image from 'next/image';
import { InstagramIcon, FacebookIcon, XIcon, ThreadsIcon, YouTubeIcon, TelegramIcon } from './SocialIcons';
import { SOCIAL_LINKS } from '@/lib/constants';

const SOCIAL_ICON_MAP: Record<string, React.ElementType> = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  x: XIcon,
  threads: ThreadsIcon,
  telegram: TelegramIcon,
  youtube: YouTubeIcon,
};

const SOCIAL_COLORS: Record<string, string> = {
  instagram: 'text-pink-400 hover:border-pink-500',
  facebook: 'text-blue-400 hover:border-blue-500',
  x: 'text-slate-200 hover:border-slate-500',
  threads: 'text-slate-300 hover:border-slate-500',
  telegram: 'text-sky-400 hover:border-sky-500',
  youtube: 'text-red-400 hover:border-red-500',
};

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Coluna 1: Logo & Sobre */}
          <div className="space-y-4 sm:col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 text-2xl font-black text-white">
              <div className="relative h-10 w-20 shrink-0">
                <Image
                  src="/logo.png"
                  alt="Logotipo oficial do Portal Concursos Agora"
                  width={80}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </div>
              <span>Concursos<span className="text-blue-500">Agora</span></span>
            </Link>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
              O portal definitivo de notícias sobre concursos públicos no Brasil. Inscrições abertas, editais previstos e materiais de estudo.
            </p>
          </div>

          {/* Coluna 2: Concursos por Status & Hubs */}
          <div>
            <h3 className="text-white font-bold text-xs tracking-wider uppercase mb-4">Hubs & Destaques</h3>
            <ul className="space-y-2 text-xs md:text-sm">
              <li><Link href="/concursos" className="text-emerald-400 font-extrabold hover:underline">🔍 Explorar Todas as Vagas</Link></li>
              <li><Link href="/hub" className="text-blue-400 font-bold hover:underline">🎯 Hubs de Conteúdo</Link></li>
              <li><Link href="/hub/concursos-municipais" className="hover:text-white transition-colors">🏛️ Hub Municipais</Link></li>
              <li><Link href="/hub/concursos-policiais" className="hover:text-white transition-colors">🚓 Hub Policiais</Link></li>
              <li><Link href="/hub/concursos-tribunais" className="hover:text-white transition-colors">⚖️ Hub Tribunais</Link></li>
              <li><Link href="/search?q=aberto" className="hover:text-emerald-400 transition-colors">🔥 Inscrições Abertas</Link></li>
            </ul>
          </div>

          {/* Coluna 3: Concursos por Região */}
          <div>
            <h3 className="text-white font-bold text-xs tracking-wider uppercase mb-4">Por Região</h3>
            <ul className="space-y-2 text-xs md:text-sm">
              <li><Link href="/categoria/sudeste" className="hover:text-white transition-colors">🏢 Sudeste (SP, RJ, MG, ES)</Link></li>
              <li><Link href="/categoria/sul" className="hover:text-white transition-colors">🌾 Sul (PR, RS, SC)</Link></li>
              <li><Link href="/categoria/nordeste" className="hover:text-white transition-colors">☀️ Nordeste (BA, PE, CE...)</Link></li>
              <li><Link href="/categoria/norte" className="hover:text-white transition-colors">🌲 Norte (AM, PA, RO...)</Link></li>
              <li><Link href="/categoria/centro-oeste" className="hover:text-white transition-colors">🏛️ Centro-Oeste (DF, GO...)</Link></li>
            </ul>
          </div>

          {/* Coluna 4: Institucional & Redes */}
          <div>
            <h3 className="text-white font-bold text-xs tracking-wider uppercase mb-4">Institucional & Redes</h3>
            <ul className="space-y-2 text-xs md:text-sm mb-6">
              <li><Link href="/sobre-nos" className="hover:text-white transition-colors">Quem Somos</Link></li>
              <li><Link href="/termos-de-uso" className="hover:text-white transition-colors">Termos de Uso</Link></li>
              <li><Link href="/politica-editorial" className="hover:text-white transition-colors">Política Editorial</Link></li>
              <li><Link href="/fontes-oficiais" className="hover:text-white transition-colors">Fontes Oficiais</Link></li>
            </ul>
            <h4 className="text-white font-bold text-xs tracking-wider uppercase mb-3">Siga o Concursos Agora</h4>
            <div className="flex flex-wrap gap-2 text-xs">
              {SOCIAL_LINKS.map((link) => {
                const Icon = SOCIAL_ICON_MAP[link.icon];
                const colorClass = SOCIAL_COLORS[link.icon] || 'text-slate-300 hover:border-slate-500';
                
                return (
                  <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:text-white transition-colors flex items-center gap-1.5 ${colorClass}`}
                    title={link.name}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    <span>{link.name}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-900 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 text-center sm:text-left">
            <p>© {new Date().getFullYear()} Concursos Agora. Todos os direitos reservados.</p>
            <span className="hidden sm:inline text-slate-700" aria-hidden="true">•</span>
            <p className="text-slate-400 text-xs">
              Tecnologia & IA por{' '}
              <a
                href="https://www.vetorestrategico.com/"
                target="_blank"
                rel="noopener"
                className="text-blue-400 font-bold hover:text-blue-300 hover:underline transition-colors"
                title="Vetor Estratégico — Criação de Sites e Inteligência Artificial"
              >
                Vetor Estratégico
              </a>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs justify-center md:justify-end">
            <Link href="/sobre-nos" className="hover:underline">Sobre Nós</Link>
            <span aria-hidden="true">•</span>
            <Link href="/termos-de-uso" className="hover:underline">Termos de Uso</Link>
            <span aria-hidden="true">•</span>
            <Link href="/politica-de-privacidade" className="hover:underline">Privacidade</Link>
            <span aria-hidden="true">•</span>
            <Link href="/aviso-legal" className="hover:underline">Aviso Legal</Link>
            <span aria-hidden="true">•</span>
            <Link href="/politica-editorial" className="hover:underline">Política Editorial</Link>
            <span aria-hidden="true">•</span>
            <Link href="/fontes-oficiais" className="hover:underline">Fontes Oficiais</Link>
            <span aria-hidden="true">•</span>
            <CookiePreferencesButton />
          </div>
        </div>

        {/* Identificação Corporativa e Legal (LGPD & Google EEAT) */}
        <div className="mt-4 pt-4 border-t border-slate-900/60 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <p>
            <strong>Concursos Agora Comunicação &amp; Conteúdo Digital Ltda.</strong> — CNPJ: 42.228.952/0001-01
          </p>
          <p>
            {/* FIX: E-mails ofuscados contra robôs e scrapers - 2026-09-06 */}
            Redação: <ObfuscatedContactLink user="contato" /> | Encarregado LGPD (DPO): <ObfuscatedContactLink user="privacidade" />
          </p>
        </div>
      </div>
    </footer>
  );
}
