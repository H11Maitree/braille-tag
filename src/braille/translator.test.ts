import { describe, expect, it } from 'vitest'
import { translator } from './translator'

describe('Liblouis Thai mixed-language path', () => {
  it('returns Unicode Braille for Thai text', async () => {
    const result = await translator.translate('ห้อง')
    expect(result).toMatch(/^[\u2800-\u28ff]+$/)
    expect(result).not.toMatch(/[\u0e00-\u0e7f]/)
  })
  it('translates Thai and English in one table chain', async () => {
    const result = await translator.translate('John ห้อง 204')
    expect(result).toMatch(/^[\u2800-\u28ff]+$/)
  })
})
