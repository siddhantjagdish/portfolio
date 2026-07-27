// Generated property art: gradient sky plus building silhouettes, seeded per
// scheme so every render is identical. Stands in for photography without
// hotlinking real assets.

function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function windows(rnd, x, y, w, h, lit) {
  const cells = []
  const cw = 5
  const ch = 7
  for (let wy = y + 4; wy < y + h - 6; wy += ch + 3) {
    for (let wx = x + 3; wx < x + w - 5; wx += cw + 3) {
      if (rnd() < lit) cells.push(<rect key={`${wx}-${wy}`} x={wx} y={wy} width={cw} height={ch} fill="#f8e3ae" opacity={0.55 + rnd() * 0.4} />)
    }
  }
  return cells
}

function Towers({ rnd, ground }) {
  const shapes = []
  let x = -10
  while (x < 210) {
    const w = 22 + rnd() * 30
    const h = 45 + rnd() * 70
    shapes.push(
      <g key={x}>
        <rect x={x} y={130 - h} width={w} height={h} fill={ground} opacity={0.55 + rnd() * 0.35} />
        {windows(rnd, x, 130 - h, w, h, 0.35)}
      </g>
    )
    x += w + 4 + rnd() * 10
  }
  return shapes
}

function Glass({ rnd, ground }) {
  // One hero building, centred, taller than its neighbours
  const neighbours = []
  let x = -10
  while (x < 210) {
    const w = 26 + rnd() * 24
    const h = 30 + rnd() * 35
    neighbours.push(<rect key={`n${x}`} x={x} y={130 - h} width={w} height={h} fill={ground} opacity={0.4} />)
    x += w + 8
  }
  const hw = 62
  const hx = 69
  const hh = 100
  const floors = []
  for (let fy = 130 - hh + 6; fy < 124; fy += 9) {
    floors.push(<rect key={fy} x={hx + 3} y={fy} width={hw - 6} height={5} fill="#f8e3ae" opacity={0.18 + rnd() * 0.5} />)
  }
  return (
    <>
      {neighbours}
      <rect x={hx} y={130 - hh} width={hw} height={hh} fill={ground} />
      {floors}
    </>
  )
}

function Sheds({ rnd, ground }) {
  const shapes = []
  let x = -6
  while (x < 210) {
    const w = 55 + rnd() * 40
    const h = 26 + rnd() * 14
    shapes.push(
      <g key={x}>
        <rect x={x} y={130 - h} width={w} height={h} fill={ground} opacity={0.85} />
        <polygon points={`${x},${130 - h} ${x + w},${130 - h} ${x + w - 6},${130 - h - 9} ${x + 6},${130 - h - 9}`} fill={ground} opacity={0.6} />
        <rect x={x + 8} y={130 - h + 8} width={12} height={h - 8} fill="#f8e3ae" opacity={0.35} />
        <rect x={x + 26} y={130 - h + 8} width={12} height={h - 8} fill="#f8e3ae" opacity={0.25} />
      </g>
    )
    x += w + 14
  }
  return shapes
}

function Villas({ rnd, ground }) {
  const shapes = []
  let x = 2
  while (x < 200) {
    const w = 26 + rnd() * 16
    const h = 18 + rnd() * 10
    shapes.push(
      <g key={x}>
        <polygon points={`${x - 3},${130 - h} ${x + w + 3},${130 - h} ${x + w / 2},${130 - h - 14}`} fill={ground} opacity={0.9} />
        <rect x={x} y={130 - h} width={w} height={h} fill={ground} opacity={0.7} />
        <rect x={x + w / 2 - 3} y={130 - h + 6} width={7} height={h - 6} fill="#f8e3ae" opacity={0.5} />
      </g>
    )
    x += w + 12 + rnd() * 10
  }
  // palms
  return (
    <>
      {shapes}
      {[30, 105, 175].map((px) => (
        <g key={px} opacity={0.8}>
          <rect x={px} y={100} width={2.5} height={30} fill={ground} />
          {[0, 1, 2, 3, 4].map((i) => (
            <ellipse key={i} cx={px + 1 + Math.cos((i / 4) * Math.PI) * 9} cy={98 - Math.sin((i / 4) * Math.PI) * 5} rx={7} ry={2.2} fill={ground} transform={`rotate(${-60 + i * 30} ${px + 1} 100)`} />
          ))}
        </g>
      ))}
    </>
  )
}

function Retail({ rnd, ground }) {
  const shapes = []
  let x = -4
  while (x < 210) {
    const w = 44 + rnd() * 30
    const h = 34 + rnd() * 16
    shapes.push(
      <g key={x}>
        <rect x={x} y={130 - h} width={w} height={h} fill={ground} opacity={0.8} />
        <rect x={x} y={130 - h - 5} width={w} height={5} fill="#f8e3ae" opacity={0.45} />
        <rect x={x + 4} y={130 - 16} width={w - 8} height={12} fill="#f8e3ae" opacity={0.4} />
        {windows(rnd, x, 130 - h, w, h - 18, 0.3)}
      </g>
    )
    x += w + 10
  }
  return shapes
}

function Campus({ rnd, ground }) {
  const shapes = []
  let x = -8
  while (x < 210) {
    const w = 40 + rnd() * 34
    const h = 34 + rnd() * 28
    shapes.push(
      <g key={x}>
        <rect x={x} y={130 - h} width={w} height={h} rx={2} fill={ground} opacity={0.7} />
        {windows(rnd, x, 130 - h, w, h, 0.3)}
      </g>
    )
    x += w + 16
    shapes.push(<circle key={`t${x}`} cx={x - 8} cy={124} r={6} fill={ground} opacity={0.5} />)
  }
  return shapes
}

const VARIANTS = { towers: Towers, glass: Glass, sheds: Sheds, villas: Villas, retail: Retail, campus: Campus, lobby: Glass }

export default function PropertyImage({ image, className = '', label = '' }) {
  const { sky, ground, variant, seed } = image
  const rnd = mulberry32(seed * 7919)
  const Variant = VARIANTS[variant] || Towers
  const gid = `sky-${seed}-${variant}`
  return (
    <svg viewBox="0 0 200 130" preserveAspectRatio="xMidYMax slice" className={`block h-full w-full ${className}`} role="img" aria-label={label || 'Property illustration'}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky[0]} />
          <stop offset="1" stopColor={sky[1]} />
        </linearGradient>
      </defs>
      <rect width="200" height="130" fill={`url(#${gid})`} />
      <circle cx={158} cy={30} r={13} fill="#fdf6e3" opacity={0.75} />
      <Variant rnd={rnd} ground={ground} />
      <rect y={126} width="200" height="4" fill={ground} />
    </svg>
  )
}
