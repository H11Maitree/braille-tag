import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Button, Drawer, Input, Label, Spinner, Switch, TextArea, TextField } from '@heroui/react'
import { Download, Link2, RotateCcw, Ruler, SlidersHorizontal, Type, X } from 'lucide-react'
import { useTagStore, DEFAULT_STATE } from '../state/useTagStore'
import { isDefaultTagState, serializeTagState, TAG_QUERY_PARAM } from '../state/urlState'
import { translator } from '../braille/translator'
import { linesFromTranslation, makeLayout } from '../braille/layout'
import { keychainErrors } from '../geometry/keychain'
import { createFinalManifold } from '../geometry/model'
import { create3mf, download3mf } from '../export/threeMf'
import { TagPreview } from '../components/preview/TagPreview'
import type { TagLayout, TagState } from '../types/tag'
import './app.css'

type TranslationStatus = 'initializing' | 'ready' | 'error'
type PanelProps = {
  state: TagState; translated: string[]; status: TranslationStatus; translationError: string
  layout: TagLayout; errors: string[]; exporting: boolean; exportError: string; canExport: boolean; showExport?: boolean
  patch: (next: Partial<TagState>) => void
  patchKeychain: (next: Partial<TagState['keychain']>) => void
  onExport: () => void
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <h2 className="section-title">{icon}{children}</h2>
}

function GrowingTextArea({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [value])
  return <TextArea ref={textareaRef} id="tag-message" value={value} onChange={(event) => onChange(event.target.value)} rows={1} spellCheck={false} placeholder="Type Thai or English…" />
}

function ExportButton({ exporting, canExport, onExport, className }: Pick<PanelProps, 'exporting' | 'canExport' | 'onExport'> & { className?: string }) {
  return <Button className={className} variant="primary" fullWidth isPending={exporting} isDisabled={!canExport} onPress={onExport}>
    {({ isPending }) => <>{isPending ? <Spinner color="current" size="sm" /> : <Download size={17}/>} {isPending ? 'Building…' : 'Export 3MF'}</>}
  </Button>
}

function ControlsPanel({ state, translated, status, translationError, layout, errors, exporting, exportError, canExport, showExport = true, patch, patchKeychain, onExport }: PanelProps) {
  const hasText = state.textContent !== ''
  const numberField = (id: string, label: string, value: number, onChange: (value: number) => void) => <TextField className="number-field"><Label htmlFor={id}>{label}</Label><Input id={id} type="number" inputMode="decimal" min="0.1" step="0.1" value={String(value)} onChange={(event) => onChange(Number(event.target.value))}/><span className="field-unit">mm</span></TextField>
  return <div>
    <section className="control-section">
      <SectionTitle icon={<Type size={16}/>} >Text</SectionTitle>
      <TextField fullWidth><Label className="sr-only" htmlFor="tag-message">Tag text</Label><GrowingTextArea value={state.textContent} onChange={(textContent) => patch({ textContent })}/></TextField>
      {hasText && <div className="braille-output"><output>{translated.join('\n')}</output>{status !== 'ready' && <small aria-live="polite">{status === 'initializing' ? 'Translating…' : translationError}</small>}</div>}
    </section>

    <section className="control-section">
      <SectionTitle icon={<Ruler size={16}/>}>Plate</SectionTitle>
      <div className="field-grid">{numberField('plate-thickness', 'Thickness', state.plateThickness, (plateThickness) => patch({ plateThickness }))}{numberField('plate-padding', 'Padding', state.platePadding, (platePadding) => patch({ platePadding }))}</div>
    </section>

    <section className="control-section">
      <Switch isSelected={state.keychain.enabled} onChange={(enabled) => patchKeychain({ enabled })}>
        <Switch.Content><Switch.Control><Switch.Thumb /></Switch.Control><Label><span className="switch-label"><Link2 size={16}/>Keychain</span></Label></Switch.Content>
      </Switch>
      {state.keychain.enabled && <div className="field-grid keychain-fields">{numberField('inner-radius', 'Hole radius', state.keychain.innerRadius, (innerRadius) => patchKeychain({ innerRadius }))}{numberField('outer-radius', 'Lobe radius', state.keychain.outerRadius, (outerRadius) => patchKeychain({ outerRadius }))}</div>}
    </section>

    {errors.length > 0 && <div className="validation-errors" role="alert">{errors.map((error) => <p key={error}>{error}</p>)}</div>}
    {hasText && <div className="model-summary"><div><span>Size</span><strong>{layout.plateWidth.toFixed(1)} × {layout.plateHeight.toFixed(1)} × {state.plateThickness.toFixed(1)} mm</strong></div><div><span>Braille</span><strong>{layout.translatedLines.reduce((count, line) => count + line.cells.length, 0)} cells · {layout.dots.length} dots</strong></div></div>}
    {exportError && <div className="validation-errors" role="alert"><p>{exportError}</p></div>}
    {showExport && hasText && <ExportButton className="export-button" exporting={exporting} canExport={canExport} onExport={onExport}/>} 
  </div>
}

export default function App() {
  const state = useTagStore(); const { patch, patchKeychain } = state
  const [translated, setTranslated] = useState<string[]>([]); const [translatedFor, setTranslatedFor] = useState(''); const [status, setStatus] = useState<TranslationStatus>('initializing'); const [translationError, setTranslationError] = useState(''); const [exporting, setExporting] = useState(false); const [exportError, setExportError] = useState(''); const [resetNonce, setResetNonce] = useState(0)
  const stablePreview = useRef<{ state: TagState; layout: TagLayout } | null>(null)
  const normalizedText = state.textContent.replace(/\r\n?/g, '\n')
  const shareState = useMemo<TagState>(() => ({ textContent: state.textContent, plateThickness: state.plateThickness, platePadding: state.platePadding, keychain: { ...state.keychain } }), [state.textContent, state.plateThickness, state.platePadding, state.keychain])
  useEffect(() => { const timer = window.setTimeout(() => { const url = new URL(window.location.href); if (isDefaultTagState(shareState, DEFAULT_STATE)) url.searchParams.delete(TAG_QUERY_PARAM); else url.searchParams.set(TAG_QUERY_PARAM, serializeTagState(shareState)); window.history.replaceState(null, '', url) }, 180); return () => window.clearTimeout(timer) }, [shareState])
  useEffect(() => { let stale = false; setStatus('initializing'); const source = normalizedText; const timer = setTimeout(async () => { try { const results = await Promise.all(source.split('\n').map((line) => translator.translate(line))); if (!stale) { setTranslated(results); setTranslatedFor(source); setStatus('ready'); setTranslationError('') } } catch (error) { if (!stale) { setStatus('error'); setTranslationError(error instanceof Error ? error.message : 'Braille translation could not start.') } } }, 140); return () => { stale = true; clearTimeout(timer) } }, [normalizedText])
  const layout = useMemo(() => makeLayout(linesFromTranslation(state.textContent, translated.length ? translated : normalizedText.split('\n').map(() => '')), state.platePadding, state.keychain.enabled), [state.textContent, translated, normalizedText, state.platePadding, state.keychain.enabled])
  const previewPending = translatedFor !== normalizedText
  useEffect(() => { if (!previewPending && state.textContent !== '') stablePreview.current = { state: { ...state, keychain: { ...state.keychain } }, layout } }, [previewPending, state, layout])
  const preview = previewPending && stablePreview.current ? stablePreview.current : { state, layout }
  const errors = keychainErrors(state, layout); const canExport = state.textContent !== '' && status === 'ready' && errors.length === 0 && !exporting
  const panelProps: PanelProps = { state, translated, status, translationError, layout, errors, exporting, exportError, canExport, patch, patchKeychain, onExport: exportModel }
  async function exportModel() { setExporting(true); setExportError(''); try { download3mf(create3mf(await createFinalManifold(state, layout))) } catch (error) { const message = error instanceof Error ? error.message : 'Could not generate printable geometry.'; setExportError(/memory access out of bounds/i.test(message) ? 'This tag is too detailed for the available browser memory. Try fewer characters or fewer rows.' : message) } finally { setExporting(false) } }

  return <main className="app-shell">
    <div className="desktop-layout">
      <section className="viewer-pane" aria-label="3D model preview">
        <Button className="reset-button" variant="secondary" aria-label="Reset 3D view" onPress={() => setResetNonce((value) => value + 1)}><RotateCcw size={17}/><span>Reset view</span></Button>
        <TagPreview state={preview.state} layout={preview.layout} resetNonce={resetNonce} loading={previewPending}/>
      </section>
      <aside className="desktop-controls" aria-label="Tag settings"><ControlsPanel {...panelProps}/></aside>
    </div>
    <div className="mobile-editor">
      <Drawer>
        <Button className="mobile-edit-button" variant="primary"><SlidersHorizontal size={19}/><span>Edit tag</span></Button>
        <Drawer.Backdrop variant="blur"><Drawer.Content placement="bottom"><Drawer.Dialog aria-label="Edit tag"><Drawer.Handle /><Drawer.Header><Drawer.CloseTrigger><X size={19}/></Drawer.CloseTrigger></Drawer.Header><Drawer.Body><ControlsPanel {...panelProps} showExport={false}/></Drawer.Body>{state.textContent !== '' && <Drawer.Footer><ExportButton exporting={exporting} canExport={canExport} onExport={exportModel}/></Drawer.Footer>}</Drawer.Dialog></Drawer.Content></Drawer.Backdrop>
      </Drawer>
    </div>
  </main>
}
