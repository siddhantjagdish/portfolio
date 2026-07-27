import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Search, Briefcase, Scale } from 'lucide-react'
import { useApp } from '../AppContext.jsx'

export default function Header() {
  const { search, setSearch, compareIds } = useApp()
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link to="/" className="flex items-baseline gap-1.5 shrink-0">
          <span className="font-display text-xl font-bold tracking-tight text-pine">Plinth</span>
          <span className="hidden text-[11px] font-medium text-ink-faint sm:block">REITs and SM REITs</span>
        </Link>

        <label className="relative ml-auto flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              if (location.pathname !== '/') navigate('/')
            }}
            placeholder="Search schemes, cities, tenants"
            className="w-full rounded-lg border border-line bg-card py-1.5 pl-8 pr-3 text-sm placeholder:text-ink-faint"
            aria-label="Search schemes"
          />
        </label>

        <nav className="flex items-center gap-1">
          <NavLink
            to="/compare"
            className={({ isActive }) =>
              `relative flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium ${isActive ? 'bg-pine-soft text-pine' : 'text-ink-soft hover:bg-line/60'}`
            }
          >
            <Scale className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Compare</span>
            {compareIds.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-ochre text-[10px] font-bold text-white sm:static sm:h-auto sm:w-auto sm:rounded sm:bg-transparent sm:text-xs sm:text-ochre">
                {compareIds.length}
              </span>
            )}
          </NavLink>
          <NavLink
            to="/portfolio"
            className={({ isActive }) =>
              `flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium ${isActive ? 'bg-pine-soft text-pine' : 'text-ink-soft hover:bg-line/60'}`
            }
          >
            <Briefcase className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Portfolio</span>
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
