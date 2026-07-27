import { Link } from 'react-router-dom'
import { Banknote, Bell, CalendarDays, TrendingDown, TrendingUp, UserPlus, Clock } from 'lucide-react'
import PropertyImage from '../components/PropertyImage.jsx'
import { getScheme, ttmYield, pastDistributions, nextDistributions, alerts } from '../data/schemes.js'
import { rs } from '../utils/format.js'
import { useApp } from '../AppContext.jsx'

const ALERT_ICONS = {
  rent: Banknote,
  distribution: Banknote,
  occupancy: TrendingDown,
  tenant: UserPlus,
}

// Your share of last quarter's rent for a holding, from realized yield.
const lastQuarterRent = (scheme, units) => {
  const y = ttmYield(scheme)
  if (y == null) return 0
  const lastQ = scheme.yieldRealized[scheme.yieldRealized.length - 1]
  return (units * scheme.unitPrice * lastQ) / 100 / 4
}

export default function Portfolio() {
  const { holdings, pendingOrders } = useApp()

  const rows = holdings.map((h) => {
    const scheme = getScheme(h.schemeId)
    return {
      ...h,
      scheme,
      invested: h.units * h.avgCost,
      value: h.units * scheme.unitPrice,
      rent: lastQuarterRent(scheme, h.units),
    }
  })

  const invested = rows.reduce((a, r) => a + r.invested, 0)
  const value = rows.reduce((a, r) => a + r.value, 0)
  const rentToDate = pastDistributions.reduce((a, d) => a + d.amount, 0)
  const gain = value - invested

  return (
    <main className="mx-auto max-w-4xl px-4 pb-16 pt-6">
      <h1 className="font-display text-2xl font-bold">Your buildings</h1>

      {/* Totals */}
      <div className="tnum mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-line bg-card px-3 py-3">
          <p className="text-[11px] font-medium text-ink-faint">Invested</p>
          <p className="text-lg font-bold">{rs(invested)}</p>
        </div>
        <div className="rounded-xl border border-line bg-card px-3 py-3">
          <p className="text-[11px] font-medium text-ink-faint">Current value</p>
          <p className="flex items-baseline gap-1.5 text-lg font-bold">
            {rs(value)}
            <span className={`flex items-center text-xs font-semibold ${gain >= 0 ? 'text-moss' : 'text-rust'}`}>
              {gain >= 0 ? <TrendingUp className="mr-0.5 h-3 w-3" aria-hidden /> : <TrendingDown className="mr-0.5 h-3 w-3" aria-hidden />}
              {gain >= 0 ? '+' : ''}{rs(gain)}
            </span>
          </p>
        </div>
        <div className="rounded-xl border border-line bg-card px-3 py-3">
          <p className="text-[11px] font-medium text-ink-faint">Rent received to date</p>
          <p className="text-lg font-bold text-pine">{rs(rentToDate)}</p>
        </div>
      </div>

      {/* Pending orders from this session */}
      {pendingOrders.length > 0 && (
        <section className="mt-5">
          <h2 className="font-display text-[15px] font-semibold">In progress</h2>
          <div className="mt-2 space-y-2">
            {pendingOrders.map((o, i) => {
              const s = getScheme(o.schemeId)
              return (
                <div key={i} className="tnum flex items-center gap-3 rounded-xl border border-dashed border-ochre/50 bg-ochre-soft/50 px-3.5 py-2.5 text-sm">
                  <Clock className="h-4 w-4 shrink-0 text-ochre" aria-hidden />
                  <span className="min-w-0 truncate font-medium">
                    {o.kind === 'application' ? 'Applied' : 'Order placed'}: {o.units} {o.units === 1 ? 'unit' : 'units'} of {s.name}
                  </span>
                  <span className="ml-auto shrink-0 text-xs text-ink-soft">
                    {o.kind === 'application' ? `allotment ${o.settlesOn}` : `settles ${o.settlesOn}`}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Holdings */}
      <section className="mt-5">
        <h2 className="font-display text-[15px] font-semibold">Holdings</h2>
        <div className="mt-2 space-y-2">
          {rows.map((r) => (
            <Link
              key={r.schemeId}
              to={`/scheme/${r.schemeId}`}
              className="flex items-center gap-3.5 rounded-xl border border-line bg-card p-3 hover:border-pine"
            >
              <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg">
                <PropertyImage image={r.scheme.heroImage} label={r.scheme.name} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display truncate text-sm font-semibold">{r.scheme.name}</p>
                <p className="tnum text-xs text-ink-faint">
                  {r.units} {r.units === 1 ? 'unit' : 'units'} · worth {rs(r.value)}
                </p>
                <p className="tnum mt-1 text-xs">
                  <span className="font-semibold text-pine">{rs(r.rent)}</span>
                  <span className="text-ink-soft"> rent last quarter · next payout {nextDistributions[r.schemeId]}</span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {/* Distribution timeline */}
        <section>
          <h2 className="font-display flex items-center gap-1.5 text-[15px] font-semibold">
            <CalendarDays className="h-4 w-4 text-ink-faint" aria-hidden /> Past payouts
          </h2>
          <ol className="mt-2 space-y-0 rounded-xl border border-line bg-card px-4 py-2">
            {pastDistributions.map((d, i) => {
              const s = getScheme(d.schemeId)
              return (
                <li key={i} className="tnum flex items-baseline gap-3 border-b border-line py-2.5 text-sm last:border-0">
                  <span className="w-24 shrink-0 text-xs text-ink-faint">{d.date}</span>
                  <span className="min-w-0 flex-1 truncate text-ink-soft">{s.name}</span>
                  <span className="font-bold text-pine">{rs(d.amount)}</span>
                </li>
              )
            })}
          </ol>
        </section>

        {/* Alerts */}
        <section>
          <h2 className="font-display flex items-center gap-1.5 text-[15px] font-semibold">
            <Bell className="h-4 w-4 text-ink-faint" aria-hidden /> Alerts
          </h2>
          <ol className="mt-2 space-y-0 rounded-xl border border-line bg-card px-4 py-2">
            {alerts.map((a, i) => {
              const Icon = ALERT_ICONS[a.kind] || Bell
              return (
                <li key={i} className="flex gap-3 border-b border-line py-2.5 text-sm last:border-0">
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${a.kind === 'occupancy' ? 'text-rust' : 'text-pine'}`} aria-hidden />
                  <div className="min-w-0">
                    <p className="leading-snug text-ink">{a.text}</p>
                    <p className="mt-0.5 text-[11px] text-ink-faint">{a.on}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </section>
      </div>
    </main>
  )
}
