import { useMemo, useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import ListingCard from '../components/ListingCard.jsx'
import { schemes, CITIES, ASSET_TYPES, ttmYield, avgProjected, currentOccupancy, LIQUIDITY_RANK } from '../data/schemes.js'
import { useApp } from '../AppContext.jsx'

const MIN_INVEST_OPTIONS = [
  { label: 'Any amount', value: Infinity },
  { label: 'Under Rs 500', value: 500 },
  { label: 'Under Rs 10,000', value: 10000 },
  { label: 'Under Rs 11,000', value: 11000 },
]

const SORTS = {
  yield: { label: 'Yield, high to low', fn: (a, b) => (ttmYield(b) ?? avgProjected(b)) - (ttmYield(a) ?? avgProjected(a)) },
  occupancy: { label: 'Occupancy, high to low', fn: (a, b) => currentOccupancy(b) - currentOccupancy(a) },
  minInvestment: { label: 'Minimum investment, low to high', fn: (a, b) => a.minInvestment - b.minInvestment },
  liquidity: { label: 'Liquidity, most liquid first', fn: (a, b) => LIQUIDITY_RANK[b.liquidityLabel] - LIQUIDITY_RANK[a.liquidityLabel] },
}

const selectCls = 'rounded-lg border border-line bg-card px-2.5 py-1.5 text-sm text-ink'

export default function Discover() {
  const { search } = useApp()
  const [city, setCity] = useState('All cities')
  const [assetType, setAssetType] = useState('All types')
  const [minYield, setMinYield] = useState(0)
  const [maxInvest, setMaxInvest] = useState(Infinity)
  const [instrument, setInstrument] = useState('All')
  const [sortKey, setSortKey] = useState('yield')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return schemes
      .filter((s) => {
        if (instrument !== 'All' && s.instrumentType !== instrument) return false
        if (city !== 'All cities' && s.city !== city) return false
        if (assetType !== 'All types' && s.assetType !== assetType) return false
        if ((ttmYield(s) ?? avgProjected(s)) < minYield) return false
        if (s.minInvestment > maxInvest) return false
        if (q) {
          const hay = [s.name, s.ticker, s.city, s.assetType, ...s.tenants.map((t) => t.name)].join(' ').toLowerCase()
          if (!hay.includes(q)) return false
        }
        return true
      })
      .sort(SORTS[sortKey].fn)
  }, [search, city, assetType, minYield, maxInvest, instrument, sortKey])

  const activeCount = [city !== 'All cities', assetType !== 'All types', minYield > 0, maxInvest !== Infinity].filter(Boolean).length

  const clearFilters = () => {
    setCity('All cities')
    setAssetType('All types')
    setMinYield(0)
    setMaxInvest(Infinity)
    setInstrument('All')
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {/* Instrument toggle */}
        <div className="flex rounded-lg border border-line bg-card p-0.5" role="group" aria-label="Instrument type">
          {['All', 'REIT', 'SM REIT'].map((t) => (
            <button
              key={t}
              onClick={() => setInstrument(t)}
              aria-pressed={instrument === t}
              className={`rounded-md px-3 py-1 text-sm font-medium ${instrument === t ? 'bg-pine text-white' : 'text-ink-soft hover:text-ink'}`}
            >
              {t}
            </button>
          ))}
        </div>

        <button
          onClick={() => setFiltersOpen((o) => !o)}
          aria-expanded={filtersOpen}
          className="flex items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-1.5 text-sm font-medium text-ink-soft sm:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          Filters{activeCount > 0 ? ` (${activeCount})` : ''}
        </button>

        <div className={`w-full flex-wrap items-center gap-2 sm:flex sm:w-auto ${filtersOpen ? 'flex' : 'hidden'}`}>
          <select value={city} onChange={(e) => setCity(e.target.value)} className={selectCls} aria-label="City">
            <option>All cities</option>
            {CITIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select value={assetType} onChange={(e) => setAssetType(e.target.value)} className={selectCls} aria-label="Asset type">
            <option>All types</option>
            {ASSET_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select value={maxInvest} onChange={(e) => setMaxInvest(Number(e.target.value))} className={selectCls} aria-label="Minimum investment">
            {MIN_INVEST_OPTIONS.map((o) => (
              <option key={o.label} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 rounded-lg border border-line bg-card px-2.5 py-1.5 text-sm text-ink-soft">
            <span className="whitespace-nowrap">Yield ≥</span>
            <input
              type="range"
              min="0"
              max="11"
              step="0.5"
              value={minYield}
              onChange={(e) => setMinYield(Number(e.target.value))}
              className="w-24 accent-pine"
              aria-label="Minimum yield percent"
            />
            <span className="tnum w-10 font-semibold text-ink">{minYield}%</span>
          </label>
          {activeCount > 0 && (
            <button onClick={clearFilters} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-ink-faint hover:text-ink">
              <X className="h-3.5 w-3.5" aria-hidden /> Clear
            </button>
          )}
        </div>

        <select value={sortKey} onChange={(e) => setSortKey(e.target.value)} className={`${selectCls} ml-auto`} aria-label="Sort by">
          {Object.entries(SORTS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      <p className="mb-3 text-sm text-ink-faint">
        {filtered.length} of {schemes.length} schemes
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-card p-10 text-center">
          <p className="font-medium">No schemes match these filters.</p>
          <button onClick={clearFilters} className="mt-3 rounded-lg bg-pine px-4 py-2 text-sm font-semibold text-white hover:bg-pine-deep">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <ListingCard key={s.id} scheme={s} />
          ))}
        </div>
      )}
    </main>
  )
}
