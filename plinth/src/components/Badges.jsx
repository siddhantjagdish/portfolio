const LIQUIDITY_STYLES = {
  'Highly liquid': 'bg-moss-soft text-moss',
  'Moderately traded': 'bg-ochre-soft text-ochre',
  'Thinly traded': 'bg-rust-soft text-rust',
  'Not yet traded': 'bg-line text-ink-soft',
}

export function LiquidityChip({ label, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${LIQUIDITY_STYLES[label] || LIQUIDITY_STYLES['Not yet traded']} ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {label}
    </span>
  )
}

export function InstrumentTag({ type, className = '' }) {
  const isSm = type === 'SM REIT'
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-bold tracking-wide ${
        isSm ? 'bg-pine text-white' : 'bg-pine-soft text-pine'
      } ${className}`}
    >
      {type}
    </span>
  )
}

export function PrimaryTag({ className = '' }) {
  return (
    <span className={`inline-flex items-center rounded bg-ochre-soft px-1.5 py-0.5 text-[11px] font-bold tracking-wide text-ochre ${className}`}>
      Primary issue
    </span>
  )
}
