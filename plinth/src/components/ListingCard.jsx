import { Link } from 'react-router-dom'
import { MapPin, Plus, Check } from 'lucide-react'
import PropertyImage from './PropertyImage.jsx'
import { LiquidityChip, InstrumentTag, PrimaryTag } from './Badges.jsx'
import { ttmYield, avgProjected, currentOccupancy } from '../data/schemes.js'
import { rs, pct } from '../utils/format.js'
import { useApp } from '../AppContext.jsx'

export default function ListingCard({ scheme }) {
  const { compareIds, toggleCompare } = useApp()
  const inCompare = compareIds.includes(scheme.id)
  const yieldTtm = ttmYield(scheme)

  return (
    <article className="group relative overflow-hidden rounded-xl border border-line bg-card shadow-sm transition-shadow hover:shadow-md">
      <Link to={`/scheme/${scheme.id}`} className="block focus-visible:outline-offset-[-2px]">
        <div className="relative aspect-[16/9]">
          <PropertyImage image={scheme.heroImage} label={scheme.name} />
          <div className="absolute left-2 top-2 flex gap-1.5">
            <InstrumentTag type={scheme.instrumentType} />
            {scheme.status === 'primary' && <PrimaryTag />}
          </div>
          <LiquidityChip label={scheme.liquidityLabel} className="absolute bottom-2 left-2" />
        </div>
        <div className="p-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-display truncate text-[15px] font-semibold leading-tight">{scheme.name}</h3>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-faint">
                <MapPin className="h-3 w-3" aria-hidden />
                {scheme.city} · {scheme.assetType}
              </p>
            </div>
          </div>
          <dl className="tnum mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-paper px-1 py-1.5">
              <dt className="text-[10px] font-medium uppercase tracking-wide text-ink-faint">{yieldTtm != null ? 'Yield TTM' : 'Projected'}</dt>
              <dd className={`text-sm font-bold ${yieldTtm != null && yieldTtm < avgProjected(scheme) * 0.94 ? 'text-rust' : 'text-pine'}`}>
                {pct(yieldTtm ?? avgProjected(scheme))}
              </dd>
            </div>
            <div className="rounded-lg bg-paper px-1 py-1.5">
              <dt className="text-[10px] font-medium uppercase tracking-wide text-ink-faint">Occupancy</dt>
              <dd className="text-sm font-bold">{currentOccupancy(scheme)}%</dd>
            </div>
            <div className="rounded-lg bg-paper px-1 py-1.5">
              <dt className="text-[10px] font-medium uppercase tracking-wide text-ink-faint">Min invest</dt>
              <dd className="text-sm font-bold">{rs(scheme.minInvestment)}</dd>
            </div>
          </dl>
        </div>
      </Link>
      <button
        onClick={() => toggleCompare(scheme.id)}
        aria-pressed={inCompare}
        aria-label={inCompare ? `Remove ${scheme.name} from compare` : `Add ${scheme.name} to compare`}
        className={`absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border text-xs shadow-sm transition-colors ${
          inCompare ? 'border-pine bg-pine text-white' : 'border-line bg-card text-ink-soft hover:border-pine hover:text-pine'
        }`}
      >
        {inCompare ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
      </button>
    </article>
  )
}
