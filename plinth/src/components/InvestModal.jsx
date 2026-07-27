import { useEffect, useMemo, useState } from 'react'
import { X, Check, ChevronLeft, Building2 } from 'lucide-react'
import { useApp } from '../AppContext.jsx'
import { rs, rs2, shareOfProperty } from '../utils/format.js'

const BROKERS = [
  { id: 'zerodha', name: 'Zerodha', note: 'Connected · demat ending 4821' },
  { id: 'groww', name: 'Groww', note: 'Connected · demat ending 1174' },
  { id: 'upstox', name: 'Upstox', note: 'Not connected' },
]

const BROKERAGE = 20
const STAMP_RATE = 0.00015 // 0.015% buy-side stamp duty

export default function InvestModal() {
  const { investScheme: scheme, setInvestScheme, placeOrder } = useApp()
  const isPrimary = scheme?.status === 'primary'
  const [step, setStep] = useState(1)
  const [unitCount, setUnitCount] = useState(1)
  const [broker, setBroker] = useState('zerodha')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (scheme) {
      setStep(1)
      setUnitCount(1)
      setDone(false)
    }
  }, [scheme])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setInvestScheme(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setInvestScheme])

  const calc = useMemo(() => {
    if (!scheme) return null
    const value = unitCount * scheme.unitPrice
    if (scheme.status === 'primary') return { value, stamp: 0, total: value }
    const stamp = value * STAMP_RATE
    return { value, stamp, total: value + stamp + BROKERAGE }
  }, [scheme, unitCount])

  if (!scheme) return null

  const brokerName = BROKERS.find((b) => b.id === broker)?.name
  const propertyShort = scheme.propertyDetails.address.split(',')[0]

  const close = () => setInvestScheme(null)

  const confirm = () => {
    placeOrder({
      schemeId: scheme.id,
      units: unitCount,
      broker: brokerName,
      total: calc.total,
      kind: isPrimary ? 'application' : 'order',
      placedOn: '19 Jul 2026',
      settlesOn: isPrimary ? scheme.allotmentDate : '21 Jul 2026',
    })
    setDone(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={isPrimary ? `Apply in ${scheme.name} issue` : `Invest in ${scheme.name}`} onClick={close}>
      <div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-card shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center gap-2 border-b border-line bg-card px-4 py-3">
          {!done && step > 1 && (
            <button onClick={() => setStep(step - 1)} aria-label="Back" className="rounded p-1 text-ink-soft hover:bg-line/60">
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          <div className="min-w-0">
            <p className="font-display truncate text-sm font-bold">{scheme.name}</p>
            {!done && <p className="text-[11px] text-ink-faint">{isPrimary ? 'Apply in issue' : 'Buy on exchange'} · step {step} of 3</p>}
          </div>
          <button onClick={close} aria-label="Close" className="ml-auto rounded p-1 text-ink-soft hover:bg-line/60">
            <X className="h-4 w-4" />
          </button>
        </div>

        {done ? (
          <div className="px-5 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-moss-soft">
              <Check className="h-6 w-6 text-moss" aria-hidden />
            </div>
            <h2 className="font-display mt-4 text-xl font-bold">{isPrimary ? 'Applied in issue' : 'Order placed'}</h2>
            <p className="tnum mt-2 text-sm text-ink-soft">
              {isPrimary
                ? `Application for ${unitCount} ${unitCount === 1 ? 'unit' : 'units'} of ${scheme.ticker}, ${rs(calc.total)} blocked via ${brokerName}. Allotment on ${scheme.allotmentDate}.`
                : `${unitCount} ${unitCount === 1 ? 'unit' : 'units'} of ${scheme.ticker} at ${rs(scheme.unitPrice)} via ${brokerName}. Units land in your demat account on 21 Jul 2026.`}
            </p>
            <p className="mt-3 text-xs text-ink-faint">Track it in your portfolio.</p>
            <button onClick={close} className="mt-5 w-full rounded-lg bg-pine py-2.5 text-sm font-bold text-white hover:bg-pine-deep">
              Done
            </button>
          </div>
        ) : (
          <div className="px-4 py-4 sm:px-5">
            {step === 1 && (
              <>
                <label className="text-xs font-medium text-ink-soft" htmlFor="unit-input">
                  {isPrimary ? 'Units to bid for' : 'Units to buy'}
                </label>
                <div className="mt-1.5 flex items-center gap-2">
                  <button
                    onClick={() => setUnitCount(Math.max(1, unitCount - 1))}
                    aria-label="One unit fewer"
                    className="h-10 w-10 rounded-lg border border-line text-lg font-bold text-ink-soft hover:border-pine"
                  >
                    −
                  </button>
                  <input
                    id="unit-input"
                    type="number"
                    min="1"
                    value={unitCount}
                    onChange={(e) => setUnitCount(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
                    className="tnum h-10 w-full rounded-lg border border-line bg-card text-center text-lg font-bold"
                  />
                  <button
                    onClick={() => setUnitCount(unitCount + 1)}
                    aria-label="One unit more"
                    className="h-10 w-10 rounded-lg border border-line text-lg font-bold text-ink-soft hover:border-pine"
                  >
                    +
                  </button>
                </div>
                <div className="tnum mt-4 space-y-2 rounded-xl bg-paper p-3.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-ink-soft">Price per unit{isPrimary ? ' (issue price)' : ''}</span>
                    <span className="font-semibold">{rs(scheme.unitPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-soft">{isPrimary ? 'Bid amount' : 'Investment'}</span>
                    <span className="font-semibold">{rs(calc.value)}</span>
                  </div>
                  <div className="flex items-start justify-between gap-4 border-t border-line pt-2">
                    <span className="flex items-center gap-1.5 text-ink-soft">
                      <Building2 className="h-3.5 w-3.5 shrink-0" aria-hidden /> Your share
                    </span>
                    <span className="text-right font-semibold">
                      {shareOfProperty(calc.value, scheme.assetValue)} of {propertyShort}
                    </span>
                  </div>
                </div>
                {isPrimary && (
                  <p className="mt-3 text-xs text-ink-faint">
                    Issue closes {scheme.issueCloses}. Money stays blocked in your bank account until allotment on {scheme.allotmentDate}. If the issue is oversubscribed you may get fewer units.
                  </p>
                )}
                <button onClick={() => setStep(2)} className="mt-4 w-full rounded-lg bg-pine py-2.5 text-sm font-bold text-white hover:bg-pine-deep">
                  Continue
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <p className="text-xs font-medium text-ink-soft">Choose your broker</p>
                <div className="mt-2 space-y-2" role="radiogroup" aria-label="Broker">
                  {BROKERS.map((b) => {
                    const disabled = b.note === 'Not connected'
                    return (
                      <button
                        key={b.id}
                        role="radio"
                        aria-checked={broker === b.id}
                        disabled={disabled}
                        onClick={() => setBroker(b.id)}
                        className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-3 text-left ${
                          broker === b.id ? 'border-pine bg-pine-soft' : 'border-line bg-card'
                        } ${disabled ? 'opacity-45' : 'hover:border-pine'}`}
                      >
                        <div>
                          <p className="text-sm font-bold">{b.name}</p>
                          <p className="text-xs text-ink-faint">{b.note}</p>
                        </div>
                        {broker === b.id && <Check className="h-4 w-4 text-pine" aria-hidden />}
                      </button>
                    )
                  })}
                </div>
                <p className="mt-3 rounded-lg bg-paper p-3 text-xs leading-relaxed text-ink-soft">
                  Plinth does not hold your money or units. The {isPrimary ? 'application' : 'order'} executes on the exchange through {brokerName}, and units {isPrimary ? 'are allotted' : 'land'} in your demat account there. KYC and settlement stay with your broker.
                </p>
                <button onClick={() => setStep(3)} className="mt-4 w-full rounded-lg bg-pine py-2.5 text-sm font-bold text-white hover:bg-pine-deep">
                  Continue
                </button>
              </>
            )}

            {step === 3 && (
              <>
                <p className="text-xs font-medium text-ink-soft">Confirm {isPrimary ? 'application' : 'order'}</p>
                <div className="tnum mt-2 space-y-2 rounded-xl bg-paper p-3.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-ink-soft">{unitCount} {unitCount === 1 ? 'unit' : 'units'} × {rs(scheme.unitPrice)}</span>
                    <span className="font-semibold">{rs(calc.value)}</span>
                  </div>
                  {!isPrimary && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-ink-soft">Brokerage ({brokerName})</span>
                        <span className="font-semibold">{rs(BROKERAGE)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-soft">Stamp duty</span>
                        <span className="font-semibold">{rs2(calc.stamp)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between border-t border-line pt-2 text-base font-bold">
                    <span>Total</span>
                    <span>{rs2(calc.total)}</span>
                  </div>
                </div>
                <dl className="tnum mt-3 space-y-1.5 px-1 text-xs text-ink-soft">
                  {isPrimary ? (
                    <>
                      <div className="flex justify-between"><dt>Type</dt><dd className="font-medium text-ink">Application in primary issue</dd></div>
                      <div className="flex justify-between"><dt>Issue closes</dt><dd className="font-medium text-ink">{scheme.issueCloses}</dd></div>
                      <div className="flex justify-between"><dt>Allotment date</dt><dd className="font-medium text-ink">{scheme.allotmentDate}</dd></div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between"><dt>Order type</dt><dd className="font-medium text-ink">Limit at {rs(scheme.unitPrice)}</dd></div>
                      <div className="flex justify-between">
                        <dt>Estimated fill</dt>
                        <dd className="font-medium text-ink">
                          {scheme.liquidityLabel === 'Highly liquid' ? 'Today' : scheme.liquidityLabel === 'Moderately traded' ? '1 to 2 days' : 'May take days, could fill partially'}
                        </dd>
                      </div>
                      <div className="flex justify-between"><dt>Settlement</dt><dd className="font-medium text-ink">T+1, 21 Jul 2026</dd></div>
                    </>
                  )}
                </dl>
                <button onClick={confirm} className="mt-4 w-full rounded-lg bg-pine py-2.5 text-sm font-bold text-white hover:bg-pine-deep">
                  {isPrimary ? 'Apply in issue' : 'Place order'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
