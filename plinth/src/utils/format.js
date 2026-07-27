// Indian number system formatting. The spec asks for "Rs 1,20,000" style
// throughout, with lakh and crore where natural.

const inFmt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })
const inFmt2 = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const rs = (n) => `Rs ${inFmt.format(Math.round(n))}`
export const rs2 = (n) => `Rs ${inFmt2.format(n)}`

export const rsCompact = (n) => {
  if (n >= 1e7) {
    const cr = n / 1e7
    return `Rs ${cr >= 100 ? inFmt.format(Math.round(cr)) : +cr.toFixed(1)} crore`
  }
  if (n >= 1e5) {
    const lakh = n / 1e5
    return `Rs ${lakh >= 100 ? inFmt.format(Math.round(lakh)) : +lakh.toFixed(1)} lakh`
  }
  return rs(n)
}

export const pct = (n, dp = 1) => `${n.toFixed(dp)}%`

export const units = (n) => `${inFmt.format(n)} ${n === 1 ? 'unit' : 'units'}`

// Ownership share of the property, in plain terms.
export const shareOfProperty = (investment, assetValue) => {
  const share = (investment / assetValue) * 100
  if (share >= 0.01) return `${share.toFixed(2)}%`
  if (share >= 0.0001) return `${share.toFixed(4)}%`
  return share > 0 ? `under 0.0001%` : '0%'
}
