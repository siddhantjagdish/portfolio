import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
  Legend,
} from 'recharts'
import { QUARTERS_8, QUARTERS_4 } from '../data/schemes.js'

const AXIS = { fontSize: 11, fill: '#7d8a84' }
const TOOLTIP_STYLE = {
  contentStyle: { fontSize: 12, borderRadius: 8, border: '1px solid #e2e6e2', fontVariantNumeric: 'tabular-nums' },
}

// Occupancy over 8 quarters. Declines are deliberately loud: bars turn ochre
// then rust as occupancy falls below its own starting level.
export function OccupancyChart({ history }) {
  const start = history[0]
  const data = QUARTERS_8.map((q, i) => ({ q, occ: history[i] }))
  const min = Math.min(...history)
  const declining = history[history.length - 1] < start - 4
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e6e2" vertical={false} />
        <XAxis dataKey="q" tick={AXIS} tickLine={false} axisLine={{ stroke: '#e2e6e2' }} interval={1} />
        <YAxis domain={[Math.max(0, min - 10), 100]} tick={AXIS} tickLine={false} axisLine={false} unit="%" />
        <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${v}%`, 'Occupancy']} />
        {declining && <ReferenceLine y={start} stroke="#7d8a84" strokeDasharray="4 4" label={{ value: `start ${start}%`, position: 'insideTopRight', fontSize: 10, fill: '#7d8a84' }} />}
        <Bar dataKey="occ" radius={[3, 3, 0, 0]} isAnimationActive={false}>
          {data.map((d, i) => {
            const drop = start - d.occ
            const fill = drop >= 8 ? '#a8442e' : drop >= 4 ? '#c47b2a' : '#1e4d40'
            return <Cell key={i} fill={fill} />
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// Promised vs delivered, four quarters, grouped bars.
export function YieldChart({ projected, realized }) {
  const data = QUARTERS_4.map((q, i) => ({ q, Projected: projected[i], Realized: realized[i] ?? null }))
  return (
    <ResponsiveContainer width="100%" height={190}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barGap={3}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e6e2" vertical={false} />
        <XAxis dataKey="q" tick={AXIS} tickLine={false} axisLine={{ stroke: '#e2e6e2' }} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} unit="%" />
        <Tooltip {...TOOLTIP_STYLE} formatter={(v, name) => [v == null ? 'No data' : `${v}%`, name]} />
        <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
        <Bar dataKey="Projected" fill="#b8c4be" radius={[3, 3, 0, 0]} isAnimationActive={false} />
        <Bar dataKey="Realized" fill="#1e4d40" radius={[3, 3, 0, 0]} isAnimationActive={false}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.Realized != null && d.Realized < d.Projected * 0.95 ? '#a8442e' : '#1e4d40'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// Unit price over 8 quarters against a flat NAV reference.
export function NavChart({ unitPrice, nav, seed }) {
  // Derive a plausible price path ending at today's price, deterministic per scheme.
  const data = QUARTERS_8.map((q, i) => {
    const t = i / (QUARTERS_8.length - 1)
    const wave = Math.sin(seed + i * 1.7) * nav * 0.015
    const price = nav + (unitPrice - nav) * t * t + wave * (1 - t * 0.5)
    return { q, price: Math.round(i === QUARTERS_8.length - 1 ? unitPrice : price) }
  })
  const lo = Math.min(nav, ...data.map((d) => d.price))
  const hi = Math.max(nav, ...data.map((d) => d.price))
  const pad = (hi - lo) * 0.25 || nav * 0.02
  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -6, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e6e2" vertical={false} />
        <XAxis dataKey="q" tick={AXIS} tickLine={false} axisLine={{ stroke: '#e2e6e2' }} interval={1} />
        <YAxis domain={[Math.floor(lo - pad), Math.ceil(hi + pad)]} tick={AXIS} tickLine={false} axisLine={false} width={52} />
        <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`Rs ${v.toLocaleString('en-IN')}`, 'Unit price']} />
        <ReferenceLine y={nav} stroke="#7d8a84" strokeDasharray="5 4" label={{ value: `NAV Rs ${nav.toLocaleString('en-IN')}`, position: 'insideBottomLeft', fontSize: 10, fill: '#4d5a54' }} />
        <Line type="monotone" dataKey="price" stroke="#1e4d40" strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

// Horizontal stacked bar of tenants by share of rent.
const TENANT_COLOURS = ['#1e4d40', '#3d7a4f', '#6da882', '#a3c9b0', '#c9ddd1', '#e2e6e2']

export function TenantBar({ tenants, flagged }) {
  return (
    <div>
      <div className="flex h-7 w-full overflow-hidden rounded-md" role="img" aria-label="Tenants by share of rent">
        {tenants.map((t, i) => (
          <div
            key={t.name}
            style={{ width: `${t.rentShare}%`, background: flagged && i === 0 ? '#a8442e' : TENANT_COLOURS[i % TENANT_COLOURS.length] }}
            title={`${t.name}: ${t.rentShare}% of rent`}
          />
        ))}
      </div>
      <ul className="mt-3 space-y-1.5">
        {tenants.map((t, i) => (
          <li key={t.name} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: flagged && i === 0 ? '#a8442e' : TENANT_COLOURS[i % TENANT_COLOURS.length] }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate text-ink-soft">{t.name}</span>
            <span className="tnum font-semibold">{t.rentShare}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
