import type { TagState } from '../types/tag'
import { deflateSync, inflateSync, strFromU8, strToU8 } from 'fflate'

export const TAG_QUERY_PARAM = 'tag'

const encodeBytes = (bytes: Uint8Array) => {
  let binary = ''
  for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}
const decodeUtf8 = (value: string) => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4)
  return strFromU8(inflateSync(Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))))
}

export function serializeTagState(state: TagState) {
  // Short keys/array form reduce overhead before lossless DEFLATE compression.
  return encodeBytes(deflateSync(strToU8(JSON.stringify([state.textContent, state.plateThickness, state.platePadding, state.keychain.enabled, state.keychain.innerRadius, state.keychain.outerRadius]))))
}

export function parseTagState(value: string | null, fallback: TagState): TagState {
  if (!value) return fallback
  try {
    const raw = JSON.parse(decodeUtf8(value)) as unknown
    if (!Array.isArray(raw) || raw.length !== 6 || typeof raw[0] !== 'string' || !Number.isFinite(raw[1]) || !Number.isFinite(raw[2]) || typeof raw[3] !== 'boolean' || !Number.isFinite(raw[4]) || !Number.isFinite(raw[5])) return fallback
    return { textContent: raw[0], plateThickness: raw[1], platePadding: raw[2], keychain: { enabled: raw[3], innerRadius: raw[4], outerRadius: raw[5] } }
  } catch { return fallback }
}

export function isDefaultTagState(state: TagState, defaults: TagState) {
  return JSON.stringify(state) === JSON.stringify(defaults)
}
