import { describe, expect, it } from 'vitest'
import { DEFAULT_STATE } from '../state/useTagStore'
import { linesFromTranslation, makeLayout } from '../braille/layout'
import { create3mf } from '../export/threeMf'
import { createFinalManifold } from './model'

describe('manufacturing manifold', () => it('merges plate, top-left lobe, hole, and raised dot into a mesh', async () => {
  const state = { ...DEFAULT_STATE, keychain: { ...DEFAULT_STATE.keychain, enabled: true } }
  const layout = makeLayout(linesFromTranslation('A', ['⠁']), state.platePadding, true)
  const mesh = await createFinalManifold(state, layout)
  expect(mesh.vertices.length).toBeGreaterThan(0)
  expect(mesh.triangles.length).toBeGreaterThan(0)
}))

describe('large inscriptions', () => it('batches many raised dots into printable geometry', async () => {
  const text = '⠿'.repeat(40)
  const layout = makeLayout(linesFromTranslation('A'.repeat(40), [text]), DEFAULT_STATE.platePadding)
  const mesh = await createFinalManifold(DEFAULT_STATE, layout)
  expect(mesh.vertices.length).toBeGreaterThan(1_000)
}))

describe('thin plates', () => it('clips dot volume at the underside and remains exportable', async () => {
  const state = { ...DEFAULT_STATE, plateThickness: 0.2, keychain: { ...DEFAULT_STATE.keychain, enabled: false } }
  const layout = makeLayout(linesFromTranslation('A', ['⠁']), state.platePadding)
  const mesh = await createFinalManifold(state, layout)
  const minimumZ = Math.min(...Array.from({ length: mesh.vertices.length / 3 }, (_, index) => mesh.vertices[index * 3 + 2]))
  expect(minimumZ).toBeGreaterThanOrEqual(-0.0001)
  expect(create3mf(mesh).length).toBeGreaterThan(0)
}))
