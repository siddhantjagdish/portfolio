import { Link } from 'react-router-dom'
import { X, Plus } from 'lucide-react'
import PropertyImage from '../components/PropertyImage.jsx'
import { LiquidityChip, InstrumentTag } from '../components/Badges.jsx'
import {
  schemes,
  getScheme,
  ttmYield,
  avgProjected,
  currentOccupancy,
  totalFeeDrag,
  navGapPct,
  topTenant,
  LIQUIDITY_RANK,
} from '../data/schemes.js'
import { rs, pct } from '../utils/format.js'
import { useApp } from '../AppContext.jsx'

// Each row: label, value renderer, and a score fn (higher = better) used to
// tint the best cell. Rows with score: null are informational only.
const ROWS = [
  { label: 'Instrument', render: (s) => <InstrumentTag type={s.instrumentType} />, score: null },
  { label: 'City · type', render: (s) => `${s.city} · ${s.assetType}`, score: null },
  {
    label: 'Yield, realized TTM',
    render: (s) => (ttmYield(s) != null ? pct(ttmYield(s)) : 'No history'),
    score: (s) => ttmYield(s) ?? -1,
  },
  { label: 'Yield, projected', render: (s) => pct(avgProjected(s)), score: null },
  {
    label: 'Delivered vs promise',
    render: (s) => {
      const t = ttmYield(s)
      if (t == null) return 'No history'
      const d = ((t - avgProjected(s)) / avgProjected(s)) * 100
      return `${d > 0 ? '+' : ''}${d.toFixed(0)}%`
    },
    score: (s) => (ttmYield(s) == null ? -99 : ((ttmYield(s) - avgProjected(s)) / avgProjected(s)) * 100),
  },
  { label: 'Occupancy now', render: (s) => `${currentOccupancy(s)}%`, score: (s) => currentOccupancy(s) },
  {
    label: 'Occupancy, 2 year change',
    render: (s) => {
      const d = currentOccupancy(s) - s.occupancyHistory[0]
      return `${d > 0 ? '+' : ''}${d} pts`
    },
    score: (s) => currentOccupancy(s) - s.occupancyHistory[0],
  },
  { label: 'Minimum investment', render: (s) => rs(s.minInvestment), score: (s) => -s.minInvestment },
  {
    label: 'Price vs NAV',
    render: (s) => {
      const g = navGapPct(s)
      return `${g > 0 ? '+' : ''}${g.toFixed(1)}%`
    },
    score: null,
  },
  { label: 'WALE', render: (s) => `${s.wale} yrs`, score: (s) => s.wale },
  {
    label: 'Largest tenant share',
    render: (s) => {
      const t = topTenant(s)
      return t ? `${t.rentShare}%` : 'Spread out'
    },
    score: (s) => -(topTenant(s)?.rentShare ?? 0),
  },
  { label: 'Liquidity', render: (s) => <LiquidityChip label={s.liquidityLabel} />, score: (s) => LIQUIDITY_RANK[s.liquidityLabel] },
  { label: 'All-in cost per year', render: (s) => pct(totalFeeDrag(s), 2), score: (s) => -totalFeeDrag(s) },
]

export default function Compare() {
  const { compareIds, toggleCompare } = useApp()
  const selected = compareIds.map(getScheme).filter(Boolean)
  const notSelected = schemes.filter((s) => !compareIds.includes(s.id))

  if (selected.length < 2) {
    return (
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
        <h1 className="font-display text-2xl font-bold">Compare schemes</h1>
        <div className="mt-4 rounded-xl border border-dashed border-line bg-card p-8 text-center">
          <p className="font-medium">
            {selected.length === 0 ? 'Nothing selected yet.' : 'Pick at least one more scheme.'}
          </p>
          <p className="mt-1 text-sm text-ink-soft">Add 2 or 3 schemes with the + button on any card, or pick from below.</p>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {notSelected.slice(0, 6).map((s) => (
            <button
              key={s.id}
              onClick={() => toggleCompare(s.id)}
              className="flex items-center gap-3 rounded-xl border border-line bg-card p-3 text-left hover:border-pine"
            >
              <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md">
                <PropertyImage image={s.heroImage} label={s.name} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{s.name}</p>
                <p className="text-xs text-ink-faint">{s.city} · {pct(ttmYield(s) ?? avgProjected(s))} yield</p>
              </div>
              <Plus className="ml-auto h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
            </button>
          ))}
        </div>
      </main>
    )
  }

  const bestByRow = ROWS.map((row) => {
    if (!row.score) return null
    const scores = selected.map(row.score)
    const max = Math.max(...scores)
    // No highlight when tied across all columns
    return scores.every((v) => v === max) ? null : max
  })

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-2xl font-bold">Compare schemes</h1>
        <p className="text-xs text-ink-faint">Green tint marks the better number in each row. It is not a recommendation.</p>
      </div>

      <div className="mt-4 overflow-x-auto pb-2">
        <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="w-44 min-w-36" aria-label="Metric" />
              {selected.map((s) => (
                <th key={s.id} className="min-w-44 px-2 pb-3 text-left align-top font-normal">
                  <div className="relative overflow-hidden rounded-lg border border-line">
                    <div className="aspect-[16/8]">
                      <PropertyImage image={s.heroImage} label={s.name} />
                    </div>
                    <button
                      onClick={() => toggleCompare(s.id)}
                      aria-label={`Remove ${s.name} from compare`}
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-card/90 text-ink-soft hover:text-rust"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <Link to={`/scheme/${s.id}`} className="mt-2 block font-display text-sm font-semibold leading-tight hover:text-pine">
                    {s.name}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, ri) => (
              <tr key={row.label}>
                <td className="border-b border-line py-2.5 pr-3 text-xs font-medium text-ink-soft">{row.label}</td>
                {selected.map((s) => {
                  const isBest = bestByRow[ri] != null && row.score(s) === bestByRow[ri]
                  return (
                    <td
                      key={s.id}
                      className={`tnum border-b border-line px-2 py-2.5 font-semibold ${isBest ? 'bg-moss-soft/70' : ''}`}
                    >
                      {row.render(s)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected.length < 3 && notSelected.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-pine">Add a third scheme</summary>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {notSelected.map((s) => (
              <button
                key={s.id}
                onClick={() => toggleCompare(s.id)}
                className="flex items-center gap-3 rounded-xl border border-line bg-card p-3 text-left hover:border-pine"
              >
                <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md">
                  <PropertyImage image={s.heroImage} label={s.name} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{s.name}</p>
                  <p className="text-xs text-ink-faint">{s.city} · {pct(ttmYield(s) ?? avgProjected(s))} yield</p>
                </div>
                <Plus className="ml-auto h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
              </button>
            ))}
          </div>
        </details>
      )}
    </main>
  )
}
