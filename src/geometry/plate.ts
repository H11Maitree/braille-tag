import type { Vec2 } from '../types/tag'

const arc = (cx: number, cy: number, r: number, start: number, end: number, segments = 12): Vec2[] =>
  Array.from({ length: segments + 1 }, (_, i) => { const a = start + (end - start) * i / segments; return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) } })

export function plateOutline(width: number, height: number, radius: number, keychain: boolean, cornerHoleRadius = 0): Vec2[] {
  const r = Math.min(radius, width / 2, height / 2)
  const hole = keychain ? cornerHoleRadius : 0
  const raw = keychain ? [
    { x: hole, y: height }, { x: width - r, y: height }, ...arc(width - r, height - r, r, Math.PI / 2, 0),
    { x: width, y: r }, ...arc(width - r, r, r, 0, -Math.PI / 2), { x: r, y: 0 },
    ...arc(r, r, r, -Math.PI / 2, -Math.PI), { x: 0, y: height - hole },
    ...(hole > 0 ? arc(0, height, hole, -Math.PI / 2, 0) : []),
  ] : [...arc(r, r, r, Math.PI, Math.PI * 1.5), ...arc(width-r, r, r, Math.PI*1.5, Math.PI*2), ...arc(width-r, height-r, r, 0, Math.PI/2), ...arc(r, height-r, r, Math.PI/2, Math.PI)]
  // Manifold closes paths itself; remove arc-junction and closing duplicates.
  const clean = raw.filter((point, index) => index === 0 || point.x !== raw[index - 1].x || point.y !== raw[index - 1].y).filter((point, index, points) => index !== points.length - 1 || point.x !== points[0].x || point.y !== points[0].y)
  return keychain ? clean.reverse() : clean
}
