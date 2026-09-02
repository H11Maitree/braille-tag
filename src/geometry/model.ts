import type { TagLayout, TagState } from '../types/tag'
import { plateOutline } from './plate'
import { DOME_CIRCULAR_SEGMENTS, DOME_RADIUS, domeCenterZ } from './dome'

export interface TriangleMesh { vertices: Float32Array; triangles: Uint32Array }

const UNION_BATCH_SIZE = 64

/** Builds a balanced CSG tree so a long inscription does not create a deep, memory-heavy boolean chain. */
function unionInBatches(Manifold: { Manifold: { union: unknown } }, solids: unknown[]): unknown {
  const union = Manifold.Manifold.union as (manifolds: unknown[]) => unknown
  let level = solids
  while (level.length > 1) {
    const next: unknown[] = []
    for (let index = 0; index < level.length; index += UNION_BATCH_SIZE) {
      const batch = level.slice(index, index + UNION_BATCH_SIZE)
      next.push(batch.length === 1 ? batch[0] : union(batch))
    }
    level = next
  }
  return level[0]
}

export async function createFinalManifold(state: TagState, layout: TagLayout): Promise<TriangleMesh> {
  const module = (await import('manifold-3d')).default
  const Manifold = await module()
  Manifold.setup()
  const outline = plateOutline(layout.plateWidth, layout.plateHeight, state.platePadding, state.keychain.enabled)
  let solid = Manifold.Manifold.extrude(outline.map(p => [p.x, p.y] as [number, number]), state.plateThickness)
  if (state.keychain.enabled && layout.keychainCenter) {
    const c = layout.keychainCenter
    const outer = Manifold.Manifold.cylinder(state.plateThickness, state.keychain.outerRadius, state.keychain.outerRadius, 48).translate(c.x, c.y, 0)
    const hole = Manifold.Manifold.cylinder(state.plateThickness + .2, state.keychain.innerRadius, state.keychain.innerRadius, 48).translate(c.x, c.y, -.1)
    solid = solid.add(outer).subtract(hole)
  }
  // Keep the tactile cap shape, but remove the hidden sphere volume below the
  // plate underside so thin plates cannot expose a dot through the back.
  const domes = layout.dots.map((dot) => Manifold.Manifold.sphere(DOME_RADIUS, DOME_CIRCULAR_SEGMENTS)
    .translate(dot.x, dot.y, domeCenterZ(state.plateThickness))
    .trimByPlane([0, 0, 1], 0))
  if (domes.length > 0) solid = solid.add(unionInBatches(Manifold, domes) as typeof solid)
  if (solid.status() !== 'NoError') throw new Error(`Manufacturing geometry failed: ${solid.status()}`)
  const mesh = solid.getMesh()
  return { vertices: mesh.vertProperties, triangles: mesh.triVerts }
}
