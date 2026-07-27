import { useParams, Link, Navigate } from 'react-router-dom'
import { MapPin, AlertTriangle, Scale, ArrowLeft, CalendarClock } from 'lucide-react'
import PropertyImage from '../components/PropertyImage.jsx'
import { LiquidityChip, InstrumentTag, PrimaryTag } from '../components/Badges.jsx'
import { OccupancyChart, YieldChart, NavChart, TenantBar } from '../components/charts.jsx'
import {
  getScheme,
  ttmYield,
  avgProjected,
  currentOccupancy,
  totalFeeDrag,
  navGapPct,
  topTenant,
} from '../data/schemes.js'
import { rs, pct } from '../utils/format.js'
import { useApp } from '../AppContext.jsx'

function Module({ title, children, aside }) {
  return (
    <section className="rounded-xl border border-line bg-card p-4 sm:p-5">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="font-display text-[15px] font-semibold">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

const num = (v, cls = '') => <span className={`tnum ${cls}`}>{v}</span>

export default function SchemeDetail() {
  const { id } = useParams()
  const scheme = getScheme(id)
  const { compareIds, toggleCompare, setInvestScheme } = useApp()
  if (!scheme) return <Navigate to="/" replace />

  const yTtm = ttmYield(scheme)
  const yProj = avgProjected(scheme)
  const occ = currentOccupancy(scheme)
  const occStart = scheme.occupancyHistory[0]
  const gap = navGapPct(scheme)
  const drag = totalFeeDrag(scheme)
  const top = topTenant(scheme)
  const topFlag = top && top.rentShare > 50
  const inCompare = compareIds.includes(scheme.id)
  const isPrimary = scheme.status === 'primary'

  // Plain-English yield verdict from realized vs projected.
  let verdict = null
  if (yTtm != null) {
    const shortfall = ((yProj - yTtm) / yProj) * 100
    if (shortfall > 2) verdict = { text: `Paid ${Math.round(shortfall)} percent below projection over the last year.`, bad: true }
    else if (shortfall < -2) verdict = { text: `Paid ${Math.round(-shortfall)} percent above projection over the last year.`, bad: false }
    else verdict = { text: 'Paid roughly in line with projection over the last year.', bad: false }
  }

  const exitDays = scheme.avgDailyVolume > 0 ? Math.ceil(3 / Math.max(scheme.avgDailyVolume * 0.1, 0.5)) : null

  return (
    <main className="mx-auto max-w-4xl px-4 pb-28 pt-4">
      <Link to="/" className="mb-3 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All schemes
      </Link>

      {/* 1. Hero */}
      <div className="overflow-hidden rounded-xl border border-line bg-card">
        <div className="relative aspect-[21/9]">
          <PropertyImage image={scheme.heroImage} label={scheme.name} />
          <div className="absolute left-3 top-3 flex gap-1.5">
            <InstrumentTag type={scheme.instrumentType} />
            {isPrimary && <PrimaryTag />}
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="font-display text-2xl font-bold leading-tight">{scheme.name}</h1>
            <span className="tnum text-sm font-semibold text-ink-faint">{scheme.ticker}</span>
          </div>
          <p className="mt-1 flex items-center gap-1 text-sm text-ink-soft">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            {scheme.city} · {scheme.assetType}
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">{scheme.description}</p>
        </div>
      </div>

      {/* 2. Key numbers strip */}
      <div className="tnum mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {[
          {
            label: yTtm != null ? 'Yield, realized TTM' : 'Yield, projected only',
            value: pct(yTtm ?? yProj),
            cls: yTtm != null && yTtm < yProj * 0.94 ? 'text-rust' : 'text-pine',
          },
          { label: 'Occupancy', value: `${occ}%`, cls: occ < occStart - 4 ? 'text-rust' : '' },
          { label: 'Min investment', value: rs(scheme.minInvestment) },
          {
            label: 'Price vs NAV',
            value: `${gap > 0 ? '+' : ''}${gap.toFixed(1)}%`,
            sub: gap < 0 ? 'discount' : gap > 0 ? 'premium' : 'at NAV',
          },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-line bg-card px-3 py-2.5">
            <p className="text-[11px] font-medium text-ink-faint">{k.label}</p>
            <p className={`text-lg font-bold ${k.cls || ''}`}>
              {k.value} {k.sub && <span className="text-[11px] font-medium text-ink-faint">{k.sub}</span>}
            </p>
          </div>
        ))}
        <div className="flex items-center rounded-xl border border-line bg-card px-3 py-2.5">
          <LiquidityChip label={scheme.liquidityLabel} />
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {/* 3. Occupancy trend */}
        <Module
          title="Occupancy, last 8 quarters"
          aside={occ < occStart - 4 && (
            <span className="flex items-center gap-1 text-xs font-semibold text-rust">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> Down {occStart - occ} points in 2 years
            </span>
          )}
        >
          <OccupancyChart history={scheme.occupancyHistory} />
        </Module>

        {/* 4. Yield: promised vs delivered */}
        <Module title="Yield: promised vs delivered">
          {yTtm == null ? (
            <div className="rounded-lg bg-paper p-4 text-sm text-ink-soft">
              <p>
                This scheme is in its primary issue. The manager projects {pct(yProj)} annually. There is no payout history to
                judge it by yet. First distribution expected after {scheme.allotmentDate}.
              </p>
            </div>
          ) : (
            <>
              <YieldChart projected={scheme.yieldProjected} realized={scheme.yieldRealized} />
              <p className={`mt-2 rounded-lg px-3 py-2 text-sm font-medium ${verdict.bad ? 'bg-rust-soft text-rust' : 'bg-moss-soft text-moss'}`}>
                {verdict.text}
              </p>
            </>
          )}
        </Module>

        {/* 5. Tenant concentration */}
        <Module
          title="Who pays the rent"
          aside={num(`WALE ${scheme.wale} ${scheme.wale === 1 ? 'year' : 'years'}`, 'text-xs font-semibold text-ink-soft')}
        >
          {topFlag && (
            <p className="mb-3 flex items-start gap-2 rounded-lg bg-rust-soft px-3 py-2 text-sm font-medium text-rust">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {top.name} pays {top.rentShare} percent of the rent. If this one tenant leaves, most of the income goes with them.
            </p>
          )}
          <TenantBar tenants={scheme.tenants} flagged={topFlag} />
        </Module>

        {/* 6. Price vs NAV */}
        <Module title="Price vs NAV">
          <NavChart unitPrice={scheme.unitPrice} nav={scheme.nav} seed={scheme.heroImage.seed} />
          <p className="mt-2 text-sm text-ink-soft">
            {gap < -0.5
              ? `Units trade ${Math.abs(gap).toFixed(1)} percent below the appraised value of the underlying property. A discount can reflect doubts about the appraisal, the income, or simply few buyers.`
              : gap > 0.5
                ? `Units trade ${gap.toFixed(1)} percent above the appraised value of the underlying property. A premium means buyers are paying more than the appraiser thinks the assets are worth.`
                : 'Units trade at roughly the appraised value of the underlying property.'}
          </p>
        </Module>

        {/* 7. Liquidity panel */}
        <Module title="How easily can you exit" aside={<LiquidityChip label={scheme.liquidityLabel} />}>
          <div className="tnum grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="rounded-lg bg-paper px-3 py-2.5">
              <p className="text-[11px] font-medium text-ink-faint">Avg daily volume</p>
              <p className="text-base font-bold">{scheme.avgDailyVolume.toLocaleString('en-IN')} units</p>
            </div>
            <div className="rounded-lg bg-paper px-3 py-2.5">
              <p className="text-[11px] font-medium text-ink-faint">Bids near last price</p>
              <p className="text-base font-bold">{scheme.bidDepthUnits.toLocaleString('en-IN')} units</p>
            </div>
            <div className="col-span-2 rounded-lg bg-paper px-3 py-2.5 sm:col-span-1">
              <p className="text-[11px] font-medium text-ink-faint">Value traded daily</p>
              <p className="text-base font-bold">
                {scheme.avgDailyVolume > 0 ? rs(scheme.avgDailyVolume * scheme.unitPrice) : 'Nil'}
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm text-ink-soft">
            {scheme.liquidityLabel === 'Highly liquid' &&
              'Trades like a liquid stock. Exiting a typical holding should take minutes at market price.'}
            {scheme.liquidityLabel === 'Moderately traded' &&
              `Some buyers on most days. Exiting 3 units may take a day or two, or a price cut to fill faster.`}
            {scheme.liquidityLabel === 'Thinly traded' &&
              `Thinly traded. Exiting 3 units may take several days${exitDays && exitDays > 3 ? ' or longer' : ''}, and a rushed sale will likely mean accepting a lower price.`}
            {scheme.liquidityLabel === 'Not yet traded' &&
              'Not listed yet. Until trading begins after allotment, there is no exit at all.'}
          </p>
        </Module>

        {/* 8. Cost breakdown */}
        <Module title="What it costs you" aside={num(`${pct(drag, 2)} a year`, 'text-xs font-bold text-ink')}>
          <table className="tnum w-full text-sm">
            <tbody>
              {[
                ['Management fee', scheme.fees.management],
                ['Trustee fee', scheme.fees.trustee],
                ['Platform fee', scheme.fees.platform],
              ].map(([label, v]) => (
                <tr key={label} className="border-b border-line last:border-0">
                  <td className="py-1.5 text-ink-soft">{label}</td>
                  <td className="py-1.5 text-right font-medium">{pct(v, 2)}</td>
                </tr>
              ))}
              <tr className="bg-paper font-bold">
                <td className="rounded-l-lg px-2 py-2">Total annual drag on yield</td>
                <td className="rounded-r-lg px-2 py-2 text-right">{pct(drag, 2)}</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-2 text-xs text-ink-faint">
            A {pct(yProj)} gross yield lands at about {pct(Math.max(yProj - drag, 0))} after these costs, before tax.
          </p>
        </Module>

        {/* 9. The property itself */}
        <Module title="The property">
          <div className="grid grid-cols-3 gap-2">
            {scheme.gallery.map((g, i) => (
              <div key={i} className="aspect-[4/3] overflow-hidden rounded-lg">
                <PropertyImage image={g} label={`${scheme.name} view ${i + 1}`} />
              </div>
            ))}
          </div>
          <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-ink-faint">Address</dt>
              <dd className="font-medium">{scheme.propertyDetails.address}</dd>
            </div>
            <div>
              <dt className="text-ink-faint">Built up area</dt>
              <dd className="tnum font-medium">{scheme.propertyDetails.area}</dd>
            </div>
            <div>
              <dt className="text-ink-faint">Completed</dt>
              <dd className="tnum font-medium">{scheme.propertyDetails.yearCompleted}</dd>
            </div>
            <div>
              <dt className="text-ink-faint">Tenants</dt>
              <dd className="font-medium">{scheme.tenants.map((t) => t.name).join(', ')}</dd>
            </div>
          </dl>
        </Module>
      </div>

      {/* 10. Sticky actions */}
      <div className="fixed inset-x-0 bottom-7 z-30 border-t border-line bg-card/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <div className="tnum mr-auto leading-tight">
            <p className="text-base font-bold">{rs(scheme.unitPrice)} <span className="text-xs font-medium text-ink-faint">per unit</span></p>
            {isPrimary && (
              <p className="flex items-center gap-1 text-[11px] text-ink-faint">
                <CalendarClock className="h-3 w-3" aria-hidden /> Issue closes {scheme.issueCloses}
              </p>
            )}
          </div>
          <button
            onClick={() => toggleCompare(scheme.id)}
            aria-pressed={inCompare}
            className={`flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-semibold ${
              inCompare ? 'border-pine bg-pine-soft text-pine' : 'border-line bg-card text-ink-soft hover:border-pine hover:text-pine'
            }`}
          >
            <Scale className="h-4 w-4" aria-hidden />
            {inCompare ? 'In compare' : 'Compare'}
          </button>
          <button
            onClick={() => setInvestScheme(scheme)}
            className="rounded-lg bg-pine px-5 py-2 text-sm font-bold text-white hover:bg-pine-deep"
          >
            {isPrimary ? 'Apply in issue' : 'Invest'}
          </button>
        </div>
      </div>
    </main>
  )
}
