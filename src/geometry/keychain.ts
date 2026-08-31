import { BRAILLE } from '../braille/constants'
import type { TagLayout, TagState } from '../types/tag'
export const MIN_KEYCHAIN_WALL = 1.2
export const MIN_BRAILLE_CLEARANCE = 0.5

/** Maximum hole radius that still clears every raised Braille footprint. */
export function maximumHoleRadius(layout: TagLayout): number {
  if (!layout.keychainCenter || layout.dots.length === 0) return Infinity
  return Math.min(...layout.dots.map((dot) => Math.hypot(dot.x - layout.keychainCenter!.x, dot.y - layout.keychainCenter!.y) - BRAILLE.dotRadius - MIN_BRAILLE_CLEARANCE))
}

export function keychainErrors(state: TagState, layout?: TagLayout): string[] {
  const { platePadding, plateThickness, keychain } = state
  if (!(plateThickness > 0)) return ['Plate thickness must be greater than 0 mm.']
  if (!(platePadding > 0)) return ['Plate padding must be greater than 0 mm.']
  if (!keychain.enabled) return []
  const errors: string[] = []
  if (!(keychain.innerRadius > 0)) errors.push('Inner radius must be greater than 0 mm.')
  if (!(keychain.outerRadius > keychain.innerRadius)) errors.push('Outer radius must be greater than inner radius.')
  // Thickness does not constrain a through-hole's radius. At the corner, the
  // relevant geometry is radial clearance to the nearest tactile dot.
  if (layout && keychain.innerRadius > maximumHoleRadius(layout)) errors.push(`Inner radius must leave at least ${MIN_BRAILLE_CLEARANCE} mm clear of raised Braille.`)
  if (keychain.outerRadius - keychain.innerRadius < MIN_KEYCHAIN_WALL) errors.push(`Keep at least ${MIN_KEYCHAIN_WALL} mm of material around the hole.`)
  return errors
}
