import { create } from 'zustand'
import type { TagState } from '../types/tag'
import { parseTagState, TAG_QUERY_PARAM } from './urlState'

export const DEFAULT_STATE: TagState = { textContent: 'Hello สวัสดี', plateThickness: 1.2, platePadding: 4, keychain: { enabled: true, innerRadius: 2, outerRadius: 4.5 } }
type Store = TagState & { patch: (patch: Partial<TagState>) => void; patchKeychain: (patch: Partial<TagState['keychain']>) => void }
const initialState = typeof window === 'undefined' ? DEFAULT_STATE : parseTagState(new URLSearchParams(window.location.search).get(TAG_QUERY_PARAM), DEFAULT_STATE)
export const useTagStore = create<Store>((set) => ({ ...initialState, patch: (patch) => set(patch), patchKeychain: (patch) => set((state) => ({ keychain: { ...state.keychain, ...patch } })) }))
