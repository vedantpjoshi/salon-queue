import { Link, useLocation } from 'react-router-dom';
import { ArrowUpRight, Monitor, Scissors, Sparkles } from 'lucide-react';

export default function Navbar() {
  const { pathname } = useLocation();
  const isMenu = pathname === '/';

  return (
    <header className="sticky top-0 z-30 border-b border-violet-100/80 bg-[#fffdfb]/90 backdrop-blur-xl">
      <nav className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <Link to="/" className="group flex shrink-0 items-center gap-3" aria-label="Glamour Queue home">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#6b4b8b] text-white shadow-lg shadow-violet-200 transition group-hover:-rotate-6">
            <Scissors className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-serif text-lg font-bold leading-tight tracking-tight text-[#34263e]">Glamour Queue</span>
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a38ba8] sm:block">Your time, beautifully spent</span>
          </span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-3">
          {isMenu && <a href="#services" className="hidden rounded-full px-3 py-2 text-sm font-semibold text-[#716176] transition hover:bg-violet-50 hover:text-[#6b4b8b] sm:inline-flex">Explore services</a>}
          <Link to="/display" className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition ${pathname === '/display' ? 'bg-violet-100 text-[#6b4b8b]' : 'text-[#716176] hover:bg-violet-50 hover:text-[#6b4b8b]'}`}>
            <Monitor className="h-4 w-4" /><span className="hidden sm:inline">Live queue</span>
          </Link>
          <Link to="/admin" className="inline-flex items-center gap-1.5 rounded-full bg-[#34263e] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-200 transition hover:bg-[#513c60]">
            <Sparkles className="h-4 w-4" /><span className="hidden sm:inline">Salon team</span><span className="sm:hidden">Team</span><ArrowUpRight className="hidden h-3.5 w-3.5 opacity-70 sm:block" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
