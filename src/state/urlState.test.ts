import { describe, expect, it } from 'vitest'
import { DEFAULT_STATE } from './useTagStore'
import { parseTagState, serializeTagState } from './urlState'

describe('shareable URL state', () => {
  it('round-trips Thai text and keychain settings', () => {
    const state = { ...DEFAULT_STATE, textContent: 'John ห้อง 204', keychain: { enabled: true, innerRadius: 2.2, outerRadius: 4.8 } }
    expect(parseTagState(serializeTagState(state), DEFAULT_STATE)).toEqual(state)
  })
  it('compresses a typical repeated text payload', () => {
    const state = { ...DEFAULT_STATE, textContent: 'ห้องประชุม John Smith 204\n'.repeat(12) }
    expect(serializeTagState(state).length).toBeLessThan(JSON.stringify(state).length)
  })
  it('falls back safely for an invalid payload', () => expect(parseTagState('not-valid', DEFAULT_STATE)).toEqual(DEFAULT_STATE))
})
