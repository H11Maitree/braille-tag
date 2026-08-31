import { describe, expect, it } from 'vitest'
import { DEFAULT_STATE } from '../state/useTagStore'
import { keychainErrors, maximumHoleRadius } from './keychain'
import { makeLayout, linesFromTranslation } from '../braille/layout'

describe('keychain constraints', () => {
  const enabled = { ...DEFAULT_STATE, keychain: { ...DEFAULT_STATE.keychain, enabled: true } }
  it('does not treat thickness as a constraint on a through-hole radius', () => expect(keychainErrors({ ...enabled, keychain: { ...enabled.keychain, innerRadius: 3 } })).toEqual([]))
  it('rejects an insufficient wall', () => expect(keychainErrors({ ...enabled, keychain: { ...enabled.keychain, outerRadius: 2.5 } }).length).toBeGreaterThan(0))
  it('centers the lobe on the top-left plate corner', () => {
    const layout = makeLayout(linesFromTranslation('A', ['⠁']), 4, true)
    expect(layout.keychainCenter).toEqual({ x: 0, y: layout.plateHeight })
  })
  it('uses radial clearance to protect the nearest raised dot', () => {
    const layout = makeLayout(linesFromTranslation('A', ['⠁']), 4, true)
    expect(maximumHoleRadius(layout)).toBeGreaterThan(4)
    expect(keychainErrors({ ...enabled, keychain: { ...enabled.keychain, innerRadius: 7, outerRadius: 8.5 } }, layout)).toContain('Inner radius must leave at least 0.5 mm clear of raised Braille.')
  })
})
