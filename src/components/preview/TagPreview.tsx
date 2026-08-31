import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { TagLayout, TagState } from '../../types/tag'
import { BRAILLE } from '../../braille/constants'
import { plateOutline } from '../../geometry/plate'

/** Creates a printable-looking extruded ring without Shape/Earcut hole triangulation. */
function annularPrism(innerRadius: number, outerRadius: number, height: number, segments = 64) {
  const positions: number[] = []
  const triangle = (a: number[], b: number[], c: number[]) => positions.push(...a, ...b, ...c)
  for (let index = 0; index < segments; index++) {
    const a = index / segments * Math.PI * 2, b = (index + 1) / segments * Math.PI * 2
    const otA = [outerRadius * Math.cos(a), outerRadius * Math.sin(a), height], otB = [outerRadius * Math.cos(b), outerRadius * Math.sin(b), height]
    const itA = [innerRadius * Math.cos(a), innerRadius * Math.sin(a), height], itB = [innerRadius * Math.cos(b), innerRadius * Math.sin(b), height]
    const obA = [otA[0], otA[1], 0], obB = [otB[0], otB[1], 0], ibA = [itA[0], itA[1], 0], ibB = [itB[0], itB[1], 0]
    triangle(otA, otB, itB); triangle(otA, itB, itA) // top
    triangle(obA, ibB, obB); triangle(obA, ibA, ibB) // bottom
    triangle(otA, obB, otB); triangle(otA, obA, obB) // outer wall
    triangle(itA, itB, ibB); triangle(itA, ibB, ibA) // inner wall
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.computeVertexNormals()
  return geometry
}

function Fit({ layout, resetNonce }: { layout: TagLayout; resetNonce: number }) {
  const { camera } = useThree()
  const previousCenter = useRef(new THREE.Vector3(layout.plateWidth / 2, layout.plateHeight / 2, 0))
  const previousReset = useRef(-1)
  useEffect(() => {
    const centerX = layout.plateWidth / 2, centerY = layout.plateHeight / 2
    const nextCenter = new THREE.Vector3(centerX, centerY, 0)
    const direction = camera.position.clone().sub(previousCenter.current)
    const wasReset = previousReset.current !== resetNonce
    if (wasReset || direction.lengthSq() < 0.001) {
      direction.set(.72, .72, Math.tan(THREE.MathUtils.degToRad(45)))
    }
    // Content edits retain the user's viewing direction, but recalculate the
    // distance from the new plate bounds so the object stays usefully framed.
    const fitDistance = Math.max(layout.plateWidth, layout.plateHeight) * 1.18
    camera.position.copy(nextCenter).add(direction.normalize().multiplyScalar(fitDistance))
    camera.lookAt(nextCenter)
    camera.updateProjectionMatrix()
    previousCenter.current.copy(nextCenter)
    previousReset.current = resetNonce
  }, [camera, layout.plateWidth, layout.plateHeight, resetNonce])
  return null
}
function Plate({ state, layout }: { state: TagState; layout: TagLayout }) {
  const geometry = useMemo(() => {
    // The corner-opening is part of the outline rather than a Shape hole:
    // Three.js holes cannot cross their parent shape's boundary.
    const shape = new THREE.Shape(plateOutline(layout.plateWidth, layout.plateHeight, state.platePadding, state.keychain.enabled, state.keychain.innerRadius).map(p => new THREE.Vector2(p.x, p.y)))
    return new THREE.ExtrudeGeometry(shape, { depth: state.plateThickness, bevelEnabled: false, curveSegments: 48 })
  }, [layout.plateWidth, layout.plateHeight, layout.keychainCenter?.x, layout.keychainCenter?.y, state.plateThickness, state.platePadding, state.keychain.enabled, state.keychain.innerRadius])
  useEffect(() => () => geometry.dispose(), [geometry])
  return <mesh geometry={geometry} castShadow receiveShadow><meshStandardMaterial color="#2563eb" metalness={.1} roughness={.36}/></mesh>
}
function TagObjects({ state, layout }: { state: TagState; layout: TagLayout }) {
  const domeRadius = (BRAILLE.dotRadius ** 2 + BRAILLE.dotHeight ** 2) / (2 * BRAILLE.dotHeight)
  const keychainGeometry = useMemo(() => {
    if (!layout.keychainCenter || !state.keychain.enabled) return null
    return annularPrism(state.keychain.innerRadius, state.keychain.outerRadius, state.plateThickness)
  }, [layout.keychainCenter?.x, layout.keychainCenter?.y, state.keychain.enabled, state.keychain.innerRadius, state.keychain.outerRadius, state.plateThickness])
  useEffect(() => () => keychainGeometry?.dispose(), [keychainGeometry])
  return <><Plate state={state} layout={layout}/>{keychainGeometry && layout.keychainCenter && <mesh geometry={keychainGeometry} position={[layout.keychainCenter.x, layout.keychainCenter.y, 0]}><meshStandardMaterial color="#2563eb" metalness={.1} roughness={.36}/></mesh>}{layout.dots.map((dot, i) => <mesh key={i} position={[dot.x, dot.y, state.plateThickness + BRAILLE.dotHeight - domeRadius]} castShadow><sphereGeometry args={[domeRadius, 24, 16]}/><meshStandardMaterial color="#fbbf24" roughness={.28}/></mesh>)}</>
}
export function TagPreview({ state, layout, resetNonce, loading = false }: { state: TagState; layout: TagLayout; resetNonce: number; loading?: boolean }) {
  const center: [number, number, number] = [layout.plateWidth / 2, layout.plateHeight / 2, 0]
  const empty = state.textContent.length === 0
  return <div className="canvas-wrap"><Canvas className={loading ? 'is-updating' : undefined} shadows="percentage" dpr={[1, 1.5]} gl={{ antialias: true, powerPreference: 'high-performance' }} camera={{ fov: 35, near: 0.01, far: 10000, position: [40, -40, 40] }} onCreated={({ gl }) => gl.domElement.addEventListener('webglcontextlost', (event) => event.preventDefault(), false)}><color attach="background" args={['#f7f8fc']}/>{!empty && <><ambientLight intensity={1.3}/><directionalLight position={[20,-10,40]} intensity={2.5} castShadow/><TagObjects state={state} layout={layout}/><OrbitControls makeDefault target={center} minDistance={2} maxDistance={8000}/><Fit layout={layout} resetNonce={resetNonce}/></>}</Canvas>{loading && <div className="preview-loading" aria-live="polite"><span>Updating 3D model…</span></div>}</div>
}
