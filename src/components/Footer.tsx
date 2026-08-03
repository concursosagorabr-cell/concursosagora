import Link from 'next/link';
import Image from 'next/image';
import { InstagramIcon, FacebookIcon, XIcon, ThreadsIcon, YouTubeIcon } from './SocialIcons';

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
                  alt="Concursos Agora Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span>Concursos<span className="text-blue-500">Agora</span></span>
            </Link>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
              O portal definitivo de notícias sobre concursos públicos no Brasil. Inscrições abertas, editais previstos, gabaritos e materiais de estudo.
            </p>
          </div>

          {/* Coluna 2: Concursos por Status & Hubs */}
          <div>
            <h3 className="text-white font-bold text-xs tracking-wider uppercase mb-4">Hubs & Destaques</h3>
            <ul className="space-y-2 text-xs md:text-sm">
              <li><Link href="/hub" className="text-blue-400 font-bold hover:underline">🎯 Hubs de Conteúdo (Silos)</Link></li>
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

          {/* Coluna 4: Institucional & Links Legais */}
          <div>
            <h3 className="text-white font-bold text-xs tracking-wider uppercase mb-4">Institucional & Redes</h3>
            <ul className="space-y-2 text-xs md:text-sm mb-4">
              <li><Link href="/sobre-nos" className="hover:text-white transition-colors font-medium">👥 Sobre Nós</Link></li>
              <li><Link href="/politica-de-privacidade" className="hover:text-white transition-colors font-medium">🔒 Política de Privacidade</Link></li>
              <li><Link href="/aviso-legal" className="hover:text-white transition-colors font-medium">⚖️ Aviso Legal e Termos</Link></li>
            </ul>
            <h4 className="text-white font-bold text-[11px] tracking-wider uppercase mb-3">Siga o Concursos Agora</h4>
            <div className="flex flex-wrap gap-2 text-xs">
              <a href="https://www.instagram.com/concursosagorabr/" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-pink-400 hover:text-white hover:border-pink-500 transition-colors flex items-center gap-1.5" title="Instagram">
                <InstagramIcon className="w-4 h-4" />
                <span>Instagram</span>
              </a>
              <a href="https://www.facebook.com/profile.php?id=61592443961535" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-blue-400 hover:text-white hover:border-blue-500 transition-colors flex items-center gap-1.5" title="Facebook">
                <FacebookIcon className="w-4 h-4" />
                <span>Facebook</span>
              </a>
              <a href="https://x.com/home" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white hover:border-slate-500 transition-colors flex items-center gap-1.5" title="X (Twitter)">
                <XIcon className="w-4 h-4" />
                <span>X</span>
              </a>
              <a href="https://www.threads.com/@concursosagorabr?hl=pt-br" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-500 transition-colors flex items-center gap-1.5" title="Threads">
                <ThreadsIcon className="w-4 h-4" />
                <span>Threads</span>
              </a>
              <a href="https://www.youtube.com/@ConcursosAgora" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-red-400 hover:text-white hover:border-red-500 transition-colors flex items-center gap-1.5" title="YouTube">
                <YouTubeIcon className="w-4 h-4" />
                <span>YouTube</span>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-900 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Concursos Agora. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/sobre-nos" className="hover:underline">Sobre Nós</Link>
            <span>•</span>
            <Link href="/politica-de-privacidade" className="hover:underline">Privacidade</Link>
            <span>•</span>
            <Link href="/aviso-legal" className="hover:underline">Aviso Legal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
