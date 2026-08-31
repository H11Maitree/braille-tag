import { describe, expect, it } from 'vitest'
import { DEFAULT_STATE } from '../state/useTagStore'
import { linesFromTranslation, makeLayout } from '../braille/layout'
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
