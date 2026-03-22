'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

type Scene = 'predawn' | 'morning' | 'afternoon' | 'night'
type View = 'beach' | 'city' | 'forest'

interface ThreeRoomProps {
  scene: Scene
  view: View
}

// ── RoundedBoxGeometry (Three.js r165 compatible) ──────────────────────────
function roundedBoxGeometry(
  width: number,
  height: number,
  depth: number,
): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry()
  const hw = width / 2, hh = height / 2, hd = depth / 2
  const positions: number[] = [], normals: number[] = [], uvs: number[] = []

  const faces: [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3][] = [
    [new THREE.Vector3(-hw, -hh,  hd), new THREE.Vector3( hw, -hh,  hd), new THREE.Vector3( hw,  hh,  hd), new THREE.Vector3(-hw,  hh,  hd)],
    [new THREE.Vector3( hw, -hh, -hd), new THREE.Vector3(-hw, -hh, -hd), new THREE.Vector3(-hw,  hh, -hd), new THREE.Vector3( hw,  hh, -hd)],
    [new THREE.Vector3(-hw, -hh, -hd), new THREE.Vector3(-hw, -hh,  hd), new THREE.Vector3(-hw,  hh,  hd), new THREE.Vector3(-hw,  hh, -hd)],
    [new THREE.Vector3( hw, -hh,  hd), new THREE.Vector3( hw, -hh, -hd), new THREE.Vector3( hw,  hh, -hd), new THREE.Vector3( hw,  hh,  hd)],
    [new THREE.Vector3(-hw,  hh,  hd), new THREE.Vector3( hw,  hh,  hd), new THREE.Vector3( hw,  hh, -hd), new THREE.Vector3(-hw,  hh, -hd)],
    [new THREE.Vector3(-hw, -hh, -hd), new THREE.Vector3( hw, -hh, -hd), new THREE.Vector3( hw, -hh,  hd), new THREE.Vector3(-hw, -hh,  hd)],
  ]

  for (const [a, b, c, d] of faces) {
    const n = new THREE.Vector3()
      .crossVectors(new THREE.Vector3().subVectors(b, a), new THREE.Vector3().subVectors(c, a))
      .normalize()
    for (const v of [a, b, c, c, d, a]) {
      positions.push(v.x, v.y, v.z)
      normals.push(n.x, n.y, n.z)
      uvs.push(0, 0)
    }
  }

  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  return geo
}

// ── Wave object type ────────────────────────────────────────────────────────
interface WaveObj {
  body: THREE.Mesh
  foam: THREE.Mesh
  speed: number
  startY: number
  shoreY: number
  phase: 'in' | 'hold' | 'out' | 'wait'
  timer: number
  baseOpacity: number
  foamBaseOpacity: number
}

export default function ThreeRoom({ scene, view }: ThreeRoomProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({ scene, view })

  useEffect(() => {
    stateRef.current = { scene, view }
  }, [scene, view])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // ── Renderer ─────────────────────────────────────────────────────────
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
    } catch {
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(canvas.clientWidth, canvas.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1

    // ── Scene & Camera ────────────────────────────────────────────────────
    const threeScene = new THREE.Scene()
    threeScene.background = new THREE.Color('#060410')
    const camera = new THREE.PerspectiveCamera(54, canvas.clientWidth / canvas.clientHeight, 0.1, 100)
    camera.position.set(0, 3.0, 7.2)
    camera.lookAt(0, 2.5, 0)

    // ── Lights ───────────────────────────────────────────────────────────
    const ambient = new THREE.AmbientLight('#14103A', 0.7)
    const dirLight = new THREE.DirectionalLight('#1A1040', 0.1)
    dirLight.position.set(0, 5, -3); dirLight.castShadow = true
    dirLight.shadow.mapSize.set(2048, 2048)
    dirLight.shadow.camera.near = 0.5; dirLight.shadow.camera.far = 30
    dirLight.shadow.camera.left = -8; dirLight.shadow.camera.right = 8
    dirLight.shadow.camera.top = 8; dirLight.shadow.camera.bottom = -8
    dirLight.shadow.bias = -0.001
    const fillLight = new THREE.PointLight('#D4A030', 0.5, 14); fillLight.position.set(-4, 3, 2)
    const doorLight = new THREE.PointLight('#3040C0', 0.6, 12); doorLight.position.set(0, 3.5, -3.5)
    const deskLamp = new THREE.PointLight('#FFB850', 3.2, 8); deskLamp.position.set(-3.68, 1.75, -1.55)
    const sofaLight = new THREE.PointLight('#D0A8FF', 1.4, 7); sofaLight.position.set(2.8, 2.2, 1.2)
    const shelfLight = new THREE.PointLight('#A080C0', 0.9, 6); shelfLight.position.set(-4.5, 3.5, -0.5)
    threeScene.add(ambient, dirLight, fillLight, doorLight, deskLamp, sofaLight, shelfLight)

    // ── Room dimensions & materials ───────────────────────────────────────
    const W = 11, H = 7, D = 9
    const wallMat  = new THREE.MeshStandardMaterial({ color: '#0A0812', roughness: 0.88 })
    const floorMat = new THREE.MeshStandardMaterial({ color: '#06040E', roughness: 0.85 })
    const ceilMat  = new THREE.MeshStandardMaterial({ color: '#08060F', roughness: 0.90 })
    const sideMat  = new THREE.MeshStandardMaterial({ color: '#0A0812', roughness: 0.88 })

    // ── Helper functions ──────────────────────────────────────────────────
    const mkPlane = (w: number, h: number, mat: THREE.Material, rx: number, ry: number, px: number, py: number, pz: number) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat)
      m.rotation.set(rx, ry, 0); m.position.set(px, py, pz); m.receiveShadow = true
      threeScene.add(m); return m
    }
    const mkBox = (w: number, h: number, d: number, mat: THREE.Material, px: number, py: number, pz: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
      m.position.set(px, py, pz); m.castShadow = true; m.receiveShadow = true
      threeScene.add(m); return m
    }
    const mkRounded = (w: number, h: number, d: number, mat: THREE.Material, px: number, py: number, pz: number) => {
      const m = new THREE.Mesh(roundedBoxGeometry(w, h, d), mat)
      m.position.set(px, py, pz); m.castShadow = true; m.receiveShadow = true
      threeScene.add(m); return m
    }

    // ── Room structure ────────────────────────────────────────────────────
    mkPlane(W, D, floorMat, -Math.PI / 2, 0, 0, 0, 0)
    mkPlane(W, D, ceilMat, Math.PI / 2, 0, 0, H, 0)
    mkPlane(D, H, sideMat, 0, Math.PI / 2, -W / 2, H / 2, 0)
    mkPlane(D, H, sideMat, 0, -Math.PI / 2, W / 2, H / 2, 0)

    const dW = 5.6, dH = 5.8, dY = dH / 2 + 0.15, bZ = -D / 2
    const lW = (W - dW) / 2
    mkPlane(lW, H, wallMat, 0, 0, -(dW / 2 + lW / 2), H / 2, bZ)
    mkPlane(lW, H, wallMat, 0, 0, (dW / 2 + lW / 2), H / 2, bZ)
    const tH = H - (dY + dH / 2); mkPlane(dW, tH, wallMat, 0, 0, 0, H - tH / 2, bZ)
    const sH = dY - dH / 2; if (sH > 0) mkPlane(dW, sH, wallMat, 0, 0, 0, sH / 2, bZ)

    const baseMat = new THREE.MeshStandardMaterial({ color: '#0A0812', roughness: 0.7 })
    mkBox(lW, 0.22, 0.07, baseMat, -(dW / 2 + lW / 2), 0.11, bZ + 0.04)
    mkBox(lW, 0.22, 0.07, baseMat, (dW / 2 + lW / 2), 0.11, bZ + 0.04)
    mkBox(0.07, 0.22, D, baseMat, -W / 2 + 0.035, 0.11, 0)
    mkBox(0.07, 0.22, D, baseMat, W / 2 - 0.035, 0.11, 0)

    const plankMat = new THREE.MeshStandardMaterial({ color: '#000', transparent: true, opacity: 0.14 })
    ;[-3.5, -2, -0.5, 1, 2.5, 4].forEach(z => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(W, 0.012), plankMat)
      m.rotation.x = -Math.PI / 2; m.position.set(0, 0.001, z); threeScene.add(m)
    })

    // Door frame & glass
    const frameMat = new THREE.MeshStandardMaterial({ color: '#1C1428', roughness: 0.5, metalness: 0.3 })
    mkBox(dW + 0.3, 0.16, 0.14, frameMat, 0, dY + dH / 2, bZ + 0.08)
    mkBox(dW + 0.3, 0.16, 0.14, frameMat, 0, dY - dH / 2 + 0.08, bZ + 0.08)
    mkBox(0.16, dH, 0.14, frameMat, -dW / 2, dY, bZ + 0.08)
    mkBox(0.16, dH, 0.14, frameMat, dW / 2, dY, bZ + 0.08)
    mkBox(0.12, dH, 0.12, frameMat, 0, dY, bZ + 0.08)

    const glassMat = new THREE.MeshStandardMaterial({
      color: '#A0B8D8', transparent: true, opacity: 0.15,
      emissive: '#C0A8D8', emissiveIntensity: 0.5,
      roughness: 0.05, metalness: 0.15, side: THREE.DoubleSide,
    })
    ;[-dW / 4, dW / 4].forEach(x => {
      const g = new THREE.Mesh(new THREE.PlaneGeometry(dW / 2 - 0.1, dH - 0.1), glassMat)
      g.position.set(x, dY, bZ + 0.06); threeScene.add(g)
    })
    const reflMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.06 })
    ;[-dW / 4, dW / 4].forEach(x => {
      const r = new THREE.Mesh(new THREE.PlaneGeometry(0.12, dH - 0.4), reflMat)
      r.position.set(x - 0.5, dY, bZ + 0.07); threeScene.add(r)
    })

    // ── Outside sky / horizon ─────────────────────────────────────────────
    const skyMat = new THREE.MeshBasicMaterial({ color: '#04030F', side: THREE.DoubleSide })
    const skyMesh = new THREE.Mesh(new THREE.PlaneGeometry(dW + 4, H + 2), skyMat)
    skyMesh.position.set(0, H / 2, bZ - 3); threeScene.add(skyMesh)

    const horizonMat = new THREE.MeshBasicMaterial({ color: '#040212', side: THREE.DoubleSide })
    const horizonMesh = new THREE.Mesh(new THREE.PlaneGeometry(dW + 4, 2.5), horizonMat)
    horizonMesh.position.set(0, 0.8, bZ - 2.5); threeScene.add(horizonMesh)

    // ── Beach group ───────────────────────────────────────────────────────
    const beachGroup = new THREE.Group()
    const oceanMat = new THREE.MeshBasicMaterial({ color: '#04080E' })
    const ocean = new THREE.Mesh(new THREE.PlaneGeometry(dW + 4, 4.0), oceanMat)
    ocean.position.set(0, 1.6, 0); beachGroup.add(ocean)
    const sand = new THREE.Mesh(new THREE.PlaneGeometry(dW + 4, 1.2), new THREE.MeshBasicMaterial({ color: '#D4B483' }))
    sand.position.set(0, -0.2, 0.08); beachGroup.add(sand)
    const wetSand = new THREE.Mesh(new THREE.PlaneGeometry(dW + 4, 0.35), new THREE.MeshBasicMaterial({ color: '#B8956A' }))
    wetSand.position.set(0, 0.17, 0.09); beachGroup.add(wetSand)

    const applyWaveShape = (geo: THREE.PlaneGeometry, seed: number) => {
      const pos = geo.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i)
        pos.setY(i, pos.getY(i) + Math.sin(x * 1.1 + seed) * 0.065 + Math.sin(x * 2.3 + seed * 1.7) * 0.030 + Math.sin(x * 0.5 + seed * 0.9) * 0.040)
      }
      pos.needsUpdate = true; geo.computeVertexNormals()
    }

    const waveObjs: WaveObj[] = []
    const waveParams = [
      { startY: 1.22, shoreY: 0.72, speed: 0.28, color: '#2060A0', opacity: 0.94, initWait: 0.4 },
      { startY: 1.65, shoreY: 0.74, speed: 0.22, color: '#2B6FA8', opacity: 0.80, initWait: 4.0 },
      { startY: 2.08, shoreY: 0.73, speed: 0.18, color: '#3580BC', opacity: 0.65, initWait: 7.5 },
    ]
    waveParams.forEach(({ startY, shoreY, speed, color, opacity, initWait }, i) => {
      const zOff = 0.30 - i * 0.08, seed = i * 1.3 + 0.4
      const bodyGeo = new THREE.PlaneGeometry(dW + 4, 1.4, 24, 1); applyWaveShape(bodyGeo, seed)
      const body = new THREE.Mesh(bodyGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0 }))
      body.position.set(0, startY, zOff); beachGroup.add(body)
      const foamGeo = new THREE.PlaneGeometry(dW + 4, 0.09, 24, 1); applyWaveShape(foamGeo, seed)
      const foam = new THREE.Mesh(foamGeo, new THREE.MeshBasicMaterial({ color: '#EEF8FF', transparent: true, opacity: 0 }))
      foam.position.set(0, startY - 0.66, zOff + 0.005); beachGroup.add(foam)
      waveObjs.push({ body, foam, speed, startY, shoreY, phase: 'wait', timer: initWait, baseOpacity: opacity, foamBaseOpacity: Math.min(1, opacity + 0.08) })
    })

    const bubbles: { mesh: THREE.Mesh; phase: number }[] = []
    for (let b = 0; b < 14; b++) {
      const bMesh = new THREE.Mesh(new THREE.SphereGeometry(0.022, 5, 4), new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.75 }))
      bMesh.position.set((b / 13 - 0.5) * (dW + 2), 0.74, 0.31); bMesh.scale.setScalar(0)
      beachGroup.add(bMesh); bubbles.push({ mesh: bMesh, phase: (b / 14) * Math.PI * 2 })
    }
    const palmMat = new THREE.MeshBasicMaterial({ color: '#1A1208' })
    ;[-2.2, 2.2].forEach(x => {
      const top = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 4), palmMat)
      top.scale.set(1.8, 0.7, 0.4); top.position.set(x, 1.5, 0.38); beachGroup.add(top)
    })
    beachGroup.position.set(0, 0, bZ - 1.8); threeScene.add(beachGroup)

    // ── City group ────────────────────────────────────────────────────────
    const cityGroup = new THREE.Group()
    const bldMat = new THREE.MeshBasicMaterial({ color: '#0A0820' })
    const bldMat2 = new THREE.MeshBasicMaterial({ color: '#14102C' })
    const winLit = new THREE.MeshBasicMaterial({ color: '#FFD060', transparent: true, opacity: 0.9 })
    const buildings = [
      { x: -2.4, w: 0.9, h: 3.2, mat: bldMat }, { x: -1.4, w: 0.7, h: 2.0, mat: bldMat2 },
      { x: -0.6, w: 1.0, h: 3.8, mat: bldMat }, { x: 0.6, w: 0.8, h: 2.6, mat: bldMat2 },
      { x: 1.5, w: 1.1, h: 4.2, mat: bldMat }, { x: 2.6, w: 0.7, h: 2.2, mat: bldMat2 },
    ]
    buildings.forEach(b => {
      const bld = new THREE.Mesh(new THREE.PlaneGeometry(b.w, b.h), b.mat)
      bld.position.set(b.x, b.h / 2 - 0.8, 0.1); cityGroup.add(bld)
      for (let wy = 0.1; wy < b.h - 0.3; wy += 0.45)
        for (let wx = -b.w / 2 + 0.1; wx < b.w / 2; wx += 0.22)
          if (Math.random() > 0.4) {
            const win = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.14), winLit)
            win.position.set(b.x + wx, b.h / 2 - b.h + wy, 0.12); cityGroup.add(win)
          }
    })
    cityGroup.position.set(0, 0, bZ - 1.8); threeScene.add(cityGroup)

    // ── Forest group ──────────────────────────────────────────────────────
    const forestGroup = new THREE.Group()
    const treeMat = new THREE.MeshBasicMaterial({ color: '#0A1A0E' })
    const treeMat2 = new THREE.MeshBasicMaterial({ color: '#0E2214' })
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(dW + 4, 1.5), new THREE.MeshBasicMaterial({ color: '#0C1808' }))
    ground.position.set(0, -0.5, 0.1); forestGroup.add(ground)
    ;[
      { x: -2.5, h: 3.0, r: 0.7, mat: treeMat }, { x: -1.5, h: 2.4, r: 0.55, mat: treeMat2 },
      { x: -0.5, h: 3.4, r: 0.8, mat: treeMat }, { x: 0.5, h: 2.8, r: 0.65, mat: treeMat2 },
      { x: 1.6, h: 3.2, r: 0.75, mat: treeMat }, { x: 2.6, h: 2.6, r: 0.6, mat: treeMat2 },
    ].forEach(t => {
      const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.08), treeMat)
      trunk.position.set(t.x, -0.5, 0.05); forestGroup.add(trunk)
      const cone = new THREE.Mesh(new THREE.ConeGeometry(t.r, t.h, 7), t.mat)
      cone.position.set(t.x, -0.5 + 0.4 + t.h / 2, 0.05); forestGroup.add(cone)
    })
    forestGroup.position.set(0, 0, bZ - 1.8); threeScene.add(forestGroup)

    // ── Curtains ──────────────────────────────────────────────────────────
    const curtainMat = new THREE.MeshStandardMaterial({ color: '#9070A8', roughness: 0.92, side: THREE.DoubleSide })
    const curtainH = dH + 0.6, curtainW = 0.90
    const bakePleats = (geo: THREE.PlaneGeometry) => {
      const pos = geo.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < pos.count; i++) {
        const xL = pos.getX(i), yL = pos.getY(i)
        const yN = (yL + curtainH / 2) / curtainH
        pos.setZ(i, Math.sin((xL / curtainW + 0.5) * Math.PI * 5) * 0.07 * (1 + (1 - yN) * 0.5))
      }
      pos.needsUpdate = true; geo.computeVertexNormals()
    }
    const leftCurtainGeo = new THREE.PlaneGeometry(curtainW, curtainH, 12, 26)
    const leftCurtain = new THREE.Mesh(leftCurtainGeo, curtainMat)
    leftCurtain.position.set(-(dW / 2 + 0.42), dY, bZ + 0.15); threeScene.add(leftCurtain); bakePleats(leftCurtainGeo)
    const rightCurtainGeo = new THREE.PlaneGeometry(curtainW, curtainH, 12, 26)
    const rightCurtain = new THREE.Mesh(rightCurtainGeo, curtainMat)
    rightCurtain.position.set(dW / 2 + 0.42, dY, bZ + 0.15); threeScene.add(rightCurtain); bakePleats(rightCurtainGeo)
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, dW + 2.2, 8), new THREE.MeshStandardMaterial({ color: '#2A1840', roughness: 0.4, metalness: 0.5 }))
    rod.rotation.x = Math.PI / 2; rod.position.set(0, dY + dH / 2 + 0.35, bZ + 0.1); threeScene.add(rod)

    // ── Furniture materials ───────────────────────────────────────────────
    const woodMat     = new THREE.MeshStandardMaterial({ color: '#8A6040', roughness: 0.65, metalness: 0.05 })
    const woodDarkMat = new THREE.MeshStandardMaterial({ color: '#3A2418', roughness: 0.80, metalness: 0.02 })
    const sofaMat     = new THREE.MeshStandardMaterial({ color: '#5A4870', roughness: 0.92 })
    const sofaAccMat  = new THREE.MeshStandardMaterial({ color: '#7060A0', roughness: 0.92 })
    const cushMat     = new THREE.MeshStandardMaterial({ color: '#9888C0', roughness: 0.96 })
    const rugMat      = new THREE.MeshStandardMaterial({ color: '#7860A0', roughness: 1.0 })
    const shelfMat    = new THREE.MeshStandardMaterial({ color: '#9A7850', roughness: 0.60, metalness: 0.05 })
    const chairMat    = new THREE.MeshStandardMaterial({ color: '#3A3050', roughness: 0.85, metalness: 0.1 })
    const potMat      = new THREE.MeshStandardMaterial({ color: '#7A4828', roughness: 0.80 })
    const leafMat     = new THREE.MeshStandardMaterial({ color: '#2A5C18', roughness: 0.90 })
    const lampBaseMat = new THREE.MeshStandardMaterial({ color: '#D4A830', roughness: 0.25, metalness: 0.75 })
    const lampShadeMat= new THREE.MeshStandardMaterial({ color: '#F8E898', roughness: 0.55, emissive: '#FFD040', emissiveIntensity: 1.2 })

    // Rug
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 2.8), rugMat)
    rug.rotation.x = -Math.PI / 2; rug.position.set(1.6, 0.005, 1.2); threeScene.add(rug)
    const rugBorder = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.6), new THREE.MeshStandardMaterial({ color: '#C0A8D8', roughness: 1.0 }))
    rugBorder.rotation.x = -Math.PI / 2; rugBorder.position.set(1.6, 0.006, 1.2); threeScene.add(rugBorder)
    const rugCenter = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 2.0), rugMat)
    rugCenter.rotation.x = -Math.PI / 2; rugCenter.position.set(1.6, 0.007, 1.2); threeScene.add(rugCenter)

    // Sofa
    const sX = 2.8
    ;[[-0.42, -0.9], [0.42, -0.9], [-0.42, 0.9], [0.42, 0.9]].forEach(([ox, oz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.22, 8), woodDarkMat)
      leg.position.set(sX + ox, 0.11, 1.2 + oz); leg.castShadow = true; threeScene.add(leg)
    })
    mkBox(0.92, 0.22, 2.15, sofaMat, sX, 0.33, 1.2)
    const seatEdge = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 2.15, 12), sofaMat)
    seatEdge.rotation.x = Math.PI / 2; seatEdge.position.set(sX - 0.46, 0.33, 1.2); seatEdge.castShadow = true; threeScene.add(seatEdge)
    mkRounded(0.82, 0.16, 0.92, cushMat, sX, 0.52, 0.65)
    mkRounded(0.82, 0.16, 0.92, sofaAccMat, sX, 0.52, 1.75)
    mkRounded(0.24, 0.68, 2.15, sofaMat, sX + 0.57, 0.72, 1.2)
    mkRounded(0.16, 0.58, 0.92, cushMat, sX + 0.52, 0.80, 0.65)
    mkRounded(0.16, 0.58, 0.92, sofaAccMat, sX + 0.52, 0.80, 1.75)
    const mkArmrest = (pz: number) => {
      mkBox(0.90, 0.44, 0.24, sofaMat, sX, 0.55, pz)
      const a = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.90, 12), sofaMat)
      a.rotation.z = Math.PI / 2; a.position.set(sX, 0.77, pz); a.castShadow = true; threeScene.add(a)
    }
    mkArmrest(0.10); mkArmrest(2.30)
    mkRounded(0.32, 0.32, 0.11, new THREE.MeshStandardMaterial({ color: '#EEC8D8', roughness: 0.96 }), sX + 0.36, 0.78, 0.40)
    mkRounded(0.32, 0.32, 0.11, new THREE.MeshStandardMaterial({ color: '#C8A8E0', roughness: 0.96 }), sX + 0.36, 0.78, 2.00)

    // Coffee table + candle + fishbowl
    mkBox(0.75, 0.06, 1.5, woodMat, 1.6, 0.40, 1.2)
    mkBox(0.58, 0.04, 1.3, shelfMat, 1.6, 0.22, 1.2)
    ;[[-0.3, 0.6], [0.3, 0.6], [-0.3, -0.6], [0.3, -0.6]].forEach(([ox, oz]) => mkBox(0.06, 0.38, 0.06, woodDarkMat, 1.6 + ox, 0.21, 1.2 + oz))
    const candleBody = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.22, 12), new THREE.MeshStandardMaterial({ color: '#F0E0C8', roughness: 0.85 }))
    candleBody.position.set(1.6, 0.535, 0.8); candleBody.castShadow = true; threeScene.add(candleBody)
    const waxTop = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.045, 0.018, 12), new THREE.MeshStandardMaterial({ color: '#F8EEE0', roughness: 0.95 }))
    waxTop.position.set(1.6, 0.654, 0.8); threeScene.add(waxTop)
    const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.04, 5), new THREE.MeshStandardMaterial({ color: '#1A1008', roughness: 1.0 }))
    wick.position.set(1.6, 0.676, 0.8); threeScene.add(wick)
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), new THREE.MeshStandardMaterial({ color: '#FFD060', emissive: '#FF8800', emissiveIntensity: 2.0, roughness: 0.5 }))
    flame.scale.set(1, 1.6, 1); flame.position.set(1.6, 0.710, 0.8); threeScene.add(flame)
    const candleLight = new THREE.PointLight('#FF9020', 1.6, 3.5); candleLight.position.set(1.6, 0.71, 0.8); threeScene.add(candleLight)

    // Fishbowl
    const fBX = 1.6, fBY = 0.615, fBZ = 1.52
    const waterFill = new THREE.Mesh(new THREE.SphereGeometry(0.162, 14, 10), new THREE.MeshStandardMaterial({ color: '#3080C0', transparent: true, opacity: 0.15, roughness: 0.3, depthWrite: false }))
    waterFill.position.set(fBX, fBY, fBZ); threeScene.add(waterFill)
    const fishBowl = new THREE.Mesh(new THREE.SphereGeometry(0.175, 16, 12), new THREE.MeshStandardMaterial({ color: '#C8E8FF', transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.15, side: THREE.DoubleSide, depthWrite: false }))
    fishBowl.position.set(fBX, fBY, fBZ); threeScene.add(fishBowl)
    const bowlRingMat = new THREE.MeshStandardMaterial({ color: '#A8C8E0', roughness: 0.1, metalness: 0.3 })
    const bowlRing = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.012, 6, 18), bowlRingMat)
    bowlRing.rotation.x = Math.PI / 2; bowlRing.position.set(fBX, fBY + 0.168, fBZ); threeScene.add(bowlRing)
    const bowlBase = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 12), bowlRingMat)
    bowlBase.position.set(fBX, fBY - 0.175, fBZ); threeScene.add(bowlBase)

    // Fish
    const fishGroup = new THREE.Group()
    const fishBody = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 7), new THREE.MeshStandardMaterial({ color: '#FF6010', roughness: 0.70, emissive: '#BB2800', emissiveIntensity: 0.25 }))
    fishBody.scale.set(1.2, 0.60, 1.65); fishGroup.add(fishBody)
    const tailPivot = new THREE.Group(); tailPivot.position.set(0, 0, -0.062); fishGroup.add(tailPivot)
    const tailLobeMat = new THREE.MeshStandardMaterial({ color: '#FF8828', roughness: 0.75, side: THREE.DoubleSide })
    const upperLobe = new THREE.Mesh(new THREE.PlaneGeometry(0.040, 0.050), tailLobeMat)
    upperLobe.position.set(0, 0.018, -0.018); upperLobe.rotation.set(-0.52, 0, 0); tailPivot.add(upperLobe)
    const lowerLobe = new THREE.Mesh(new THREE.PlaneGeometry(0.040, 0.050), tailLobeMat)
    lowerLobe.position.set(0, -0.018, -0.018); lowerLobe.rotation.set(0.52, 0, 0); tailPivot.add(lowerLobe)
    const dorsal = new THREE.Mesh(new THREE.PlaneGeometry(0.040, 0.032), new THREE.MeshStandardMaterial({ color: '#FF7020', roughness: 0.8, side: THREE.DoubleSide }))
    dorsal.position.set(0, 0.036, -0.005); fishGroup.add(dorsal)
    fishGroup.position.set(fBX + 0.09, fBY - 0.02, fBZ); threeScene.add(fishGroup)

    // Seaweed
    ;[{ ox: 0.04, oz: 0.02, rz: 0.32, rx: 0.10, h: 0.060 }, { ox: -0.05, oz: 0.01, rz: -0.28, rx: -0.06, h: 0.050 }, { ox: 0.01, oz: -0.05, rz: 0.14, rx: -0.32, h: 0.068 }]
      .forEach(({ ox, oz, rz, rx, h }) => {
        const sw = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.008, h, 5), new THREE.MeshStandardMaterial({ color: '#1A8032', roughness: 0.9 }))
        sw.position.set(fBX + ox, fBY - 0.13 + h / 2, fBZ + oz); sw.rotation.set(rx, 0, rz); threeScene.add(sw)
        const lf = new THREE.Mesh(new THREE.SphereGeometry(0.011, 5, 4), new THREE.MeshStandardMaterial({ color: '#22A040', roughness: 0.85 }))
        lf.scale.set(1, 1.6, 0.8); lf.position.set(fBX + ox + Math.sin(rz) * h * 0.45, fBY - 0.13 + h + 0.006, fBZ + oz + Math.sin(rx) * h * 0.45); threeScene.add(lf)
      })

    // Desk
    mkBox(1.1, 0.07, 2.4, woodMat, -4.2, 0.82, -0.8)
    mkBox(0.85, 0.80, 2.2, woodDarkMat, -4.7, 0.42, -0.8)
    ;[0.66, 0.40, 0.14].forEach(y => { mkBox(0.82, 0.22, 0.04, woodMat, -4.7, y, 0.18) })
    const handleMat = new THREE.MeshStandardMaterial({ color: '#C0A040', roughness: 0.3, metalness: 0.7 })
    ;[0.66, 0.40, 0.14].forEach(y => mkBox(0.18, 0.025, 0.025, handleMat, -4.7, y, 0.22))
    mkBox(0.38, 0.025, 0.30, new THREE.MeshStandardMaterial({ color: '#8B5A3A', roughness: 0.85 }), -4.0, 0.86, -0.6)
    mkBox(0.36, 0.003, 0.28, new THREE.MeshStandardMaterial({ color: '#F5EFE0' }), -4.0, 0.875, -0.6)
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.2, 8), woodDarkMat); cup.position.set(-3.8, 0.93, -1.6); threeScene.add(cup)
    ;[-0.02, 0.01, 0.04].forEach((ox, i) => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 6), new THREE.MeshStandardMaterial({ color: ['#E8C840', '#E87040', '#60A840'][i] }))
      p.position.set(-3.8 + ox, 1.02, -1.6 + ox * 0.5); threeScene.add(p)
    })
    const lX = -3.88, lZ = -1.55
    ;[
      () => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.05, 12), lampBaseMat); m.position.set(lX, 0.875, lZ); m.castShadow = true; threeScene.add(m) },
      () => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.72, 8), lampBaseMat); m.position.set(lX, 1.235, lZ); m.castShadow = true; threeScene.add(m) },
      () => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 6), lampBaseMat); m.position.set(lX, 1.60, lZ); threeScene.add(m) },
      () => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.40, 8), lampBaseMat); m.rotation.z = -0.55; m.position.set(lX + 0.11, 1.70, lZ); m.castShadow = true; threeScene.add(m) },
      () => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.22, 0.24, 12, 1, true), lampShadeMat); m.position.set(lX + 0.20, 1.88, lZ); m.castShadow = true; threeScene.add(m) },
      () => { const m = new THREE.Mesh(new THREE.CircleGeometry(0.19, 12), new THREE.MeshStandardMaterial({ color: '#FFF8D0', emissive: '#FFE080', emissiveIntensity: 1.5, side: THREE.DoubleSide })); m.rotation.x = Math.PI / 2; m.position.set(lX + 0.20, 1.77, lZ); threeScene.add(m) },
      () => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.03, 8), lampBaseMat); m.position.set(lX + 0.20, 2.00, lZ); threeScene.add(m) },
    ].forEach(fn => fn())
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.065, 0.15, 10), new THREE.MeshStandardMaterial({ color: '#C0A8E0', roughness: 0.7 }))
    mug.position.set(-4.05, 0.90, -0.3); threeScene.add(mug)

    // Chair
    const cX = -3.3, cZ = -0.8
    mkRounded(0.62, 0.09, 0.62, chairMat, cX, 0.54, cZ)
    mkRounded(0.62, 0.62, 0.09, chairMat, cX, 0.88, cZ - 0.31)
    const gasLift = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.38, 10), woodDarkMat); gasLift.position.set(cX, 0.30, cZ); threeScene.add(gasLift)
    const baseHub = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 10), woodDarkMat); baseHub.position.set(cX, 0.10, cZ); threeScene.add(baseHub)
    const armMat = new THREE.MeshStandardMaterial({ color: '#2A2238', roughness: 0.7, metalness: 0.2 })
    const casterMat = new THREE.MeshStandardMaterial({ color: '#1A1820', roughness: 0.5, metalness: 0.3 })
    ;[0, 72, 144, 216, 288].forEach(deg => {
      const r = deg * Math.PI / 180, ax = Math.cos(r) * 0.22, az = Math.sin(r) * 0.22
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.44, 8), armMat)
      arm.rotation.z = Math.PI / 2; arm.rotation.y = -r; arm.position.set(cX + ax * 0.5, 0.06, cZ + az * 0.5); arm.castShadow = true; threeScene.add(arm)
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.05, 10), casterMat)
      wheel.rotation.x = Math.PI / 2; wheel.position.set(cX + ax, 0.04, cZ + az); wheel.castShadow = true; threeScene.add(wheel)
    })

    // Shelves + books
    const shelfZs = [-0.2, -1.4, -2.6], shelfYs = [2.6, 3.5, 4.3], shelfDepth = 0.32, shelfCX = -5.5 + shelfDepth / 2
    shelfYs.forEach((y, i) => {
      mkBox(shelfDepth, 0.05, 1.3, shelfMat, shelfCX, y, shelfZs[i])
      mkBox(shelfDepth - 0.04, 0.04, 0.05, woodDarkMat, shelfCX - 0.02, y - 0.045, shelfZs[i] + 0.57)
      mkBox(shelfDepth - 0.04, 0.04, 0.05, woodDarkMat, shelfCX - 0.02, y - 0.045, shelfZs[i] - 0.57)
      mkBox(0.04, 0.22, 0.05, woodDarkMat, -5.48, y - 0.155, shelfZs[i] + 0.57)
      mkBox(0.04, 0.22, 0.05, woodDarkMat, -5.48, y - 0.155, shelfZs[i] - 0.57)
    })
    const bookColors = ['#C04040', '#4060C0', '#40A040', '#C0A030', '#9040C0', '#C06040', '#3090A0', '#A04080']
    const pageTopMat = new THREE.MeshStandardMaterial({ color: '#F0EAD6', roughness: 0.95 })
    const spineAccent = ['#E06060', '#6080D8', '#60B860', '#D8B840', '#A860D8', '#D88060', '#50A8C0', '#C06098']
    shelfYs.forEach((y, si) => {
      let zOff = shelfZs[si] - 0.52
      for (let b = 0; b < 4 + si; b++) {
        const bw = 0.09 + ((si * 7 + b * 3) % 5) * 0.012
        const bh = 0.22 + ((si * 5 + b * 4) % 6) * 0.022
        const bx = shelfCX - 0.02, by = y + 0.025 + bh / 2, bz = zOff + bw / 2
        mkBox(0.13, bh, bw, new THREE.MeshStandardMaterial({ color: bookColors[(si * 5 + b) % bookColors.length], roughness: 0.82 }), bx, by, bz)
        mkBox(0.09, bh - 0.01, bw - 0.01, pageTopMat, bx - 0.015, by, bz)
        mkBox(0.135, bh * 0.18, bw - 0.01, new THREE.MeshStandardMaterial({ color: spineAccent[(si * 5 + b) % spineAccent.length], roughness: 0.7 }), bx, by + bh * 0.28, bz)
        zOff += bw + 0.018
      }
    })
    const pot2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.14, 8), potMat); pot2.position.set(shelfCX - 0.02, shelfYs[2] + 0.025 + 0.07, shelfZs[2] + 0.52); threeScene.add(pot2)
    const leaves2 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 7, 5), leafMat); leaves2.position.set(shelfCX - 0.02, shelfYs[2] + 0.025 + 0.23, shelfZs[2] + 0.52); threeScene.add(leaves2)

    // Floor plants
    const addPlant = (x: number, z: number, h: number, r: number) => {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.6, r * 0.5, r * 1.2, 10), potMat); pot.position.set(x, r * 0.6, z); threeScene.add(pot)
      const soil = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.58, r * 0.58, 0.04, 10), new THREE.MeshStandardMaterial({ color: '#2A1808', roughness: 1 })); soil.position.set(x, r * 1.2, z); threeScene.add(soil)
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, h, 6), leafMat); stem.position.set(x, r * 1.2 + h / 2, z); threeScene.add(stem)
      ;[0.55, 0.78, 0.95].forEach((t, i) => {
        const lb = new THREE.Mesh(new THREE.SphereGeometry(r * (1.0 - i * 0.15), 7, 5), new THREE.MeshStandardMaterial({ color: i === 1 ? '#2A6018' : '#1E4A14', roughness: 0.95 }))
        lb.scale.set(1.4, 0.7, 0.9); lb.position.set(x + (i - 1) * 0.06, r * 1.2 + h * t, z); threeScene.add(lb)
      })
    }
    addPlant(-dW / 2 - 0.8, bZ + 0.9, 1.8, 0.28)
    addPlant(dW / 2 + 0.8, bZ + 0.9, 1.6, 0.24)
    addPlant(-W / 2 + 0.7, D / 2 - 0.6, 1.2, 0.20)

    // Pendant globe light
    const pendantCord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.6, 6), new THREE.MeshStandardMaterial({ color: '#1A1018', roughness: 0.9 }))
    pendantCord.position.set(-0.5, H - 0.8, 0.5); threeScene.add(pendantCord)
    const globeMat = new THREE.MeshStandardMaterial({ color: '#FFF8E8', roughness: 0.15, emissive: '#FFE8B0', emissiveIntensity: 1.0, transparent: true, opacity: 0.82 })
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), globeMat); globe.position.set(-0.5, H - 1.6, 0.5); threeScene.add(globe)
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 8), new THREE.MeshStandardMaterial({ color: '#C8A830', roughness: 0.3, metalness: 0.7 })); cap.position.set(-0.5, H - 1.32, 0.5); threeScene.add(cap)
    const pendantLight = new THREE.PointLight('#FFE8C0', 2.6, 9); pendantLight.position.set(-0.5, H - 1.6, 0.5); pendantLight.castShadow = true; pendantLight.shadow.mapSize.set(512, 512); threeScene.add(pendantLight)

    // Corkboard
    const cbX = 5.48, cbY = 2.85, cbZ = -0.4
    mkBox(0.05, 1.30, 1.80, new THREE.MeshStandardMaterial({ color: '#5A3818', roughness: 0.85 }), cbX, cbY, cbZ)
    mkBox(0.04, 1.12, 1.62, new THREE.MeshStandardMaterial({ color: '#C4906A', roughness: 0.95 }), cbX, cbY, cbZ)
    const pinMat = new THREE.MeshStandardMaterial({ color: '#E03030', roughness: 0.3, metalness: 0.6 })
    ;[{ color: '#FFED8A', y: 0.22, z: -0.28, rotY: 0.05 }, { color: '#C8F0C8', y: -0.16, z: 0.34, rotY: -0.08 }, { color: '#FFB8C8', y: 0.30, z: 0.48, rotY: 0.12 }, { color: '#B8D0FF', y: -0.08, z: -0.52, rotY: -0.06 }, { color: '#FFD8A8', y: 0.06, z: 0.10, rotY: 0.03 }]
      .forEach(({ color, y, z, rotY }) => {
        const note = new THREE.Mesh(new THREE.PlaneGeometry(0.30, 0.26), new THREE.MeshStandardMaterial({ color, roughness: 0.9 }))
        note.rotation.y = -Math.PI / 2 + rotY; note.position.set(cbX - 0.025, cbY + y, cbZ + z); note.receiveShadow = true; threeScene.add(note)
        const pin = new THREE.Mesh(new THREE.SphereGeometry(0.022, 6, 6), pinMat); pin.position.set(cbX - 0.032, cbY + y + 0.09, cbZ + z); threeScene.add(pin)
      })

    // Fairy lights
    const bulbMat = new THREE.MeshStandardMaterial({ color: '#FFE080', emissive: '#FFD040', emissiveIntensity: 1.2, roughness: 0.5 })
    const bulbPositions: THREE.Vector3[] = []
    for (let i = 0; i <= 18; i++) {
      const t = i / 18, fx = -dW / 2 + t * dW, fy = H - 0.5 + Math.sin(t * Math.PI * 3) * 0.18, fz = bZ + 0.15
      bulbPositions.push(new THREE.Vector3(fx, fy, fz))
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 4), bulbMat); bulb.position.set(fx, fy, fz); threeScene.add(bulb)
    }
    const stringCurve = new THREE.CatmullRomCurve3(bulbPositions)
    threeScene.add(new THREE.Mesh(new THREE.TubeGeometry(stringCurve, 54, 0.006, 4, false), new THREE.MeshStandardMaterial({ color: '#3A2820', roughness: 0.8 })))

    // Moon — two-disc crescent: gold circle behind, cutout disc in front that lerps to sky color
    const moonMat = new THREE.MeshBasicMaterial({ color: '#FFD060', transparent: true, opacity: 1.0 })
    const moon = new THREE.Mesh(new THREE.CircleGeometry(0.30, 32), moonMat)
    moon.position.set(1.6, 5.2, bZ - 2.48); threeScene.add(moon)
    const moonCutMat = new THREE.MeshBasicMaterial({ color: '#1A0A30' })
    const moonCut = new THREE.Mesh(new THREE.CircleGeometry(0.27, 32), moonCutMat)
    moonCut.position.set(1.6 + 0.16, 5.2 + 0.05, bZ - 2.47); threeScene.add(moonCut)
    const moonHaloMat = new THREE.MeshBasicMaterial({ color: '#FFB030', transparent: true, opacity: 0.0, side: THREE.DoubleSide })
    const moonHalo = new THREE.Mesh(new THREE.CircleGeometry(0.55, 24), moonHaloMat)
    moonHalo.position.set(1.6, 5.2, bZ - 2.50); moonHalo.visible = false; threeScene.add(moonHalo)
    const moonLight = new THREE.PointLight('#8080C0', 0.8, 10); moonLight.position.set(0, 4, bZ + 1); threeScene.add(moonLight)

    // Stars
    const starMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 1.0 })
    const starMeshes = [[-2.2,5.6],[-1.4,5.1],[-0.6,5.8],[0.2,5.3],[0.8,5.7],[-1.8,4.6],[-0.2,4.8],[0.6,4.4],[1.2,5.0],[-2.4,4.2],[2.1,5.5],[2.4,4.9],[-1.0,6.0],[0.4,6.1],[-0.8,4.3],[1.8,4.6],[2.6,5.1],[-2.0,5.2],[0.0,5.9],[-1.6,6.2]]
      .map(([sx, sy]) => {
        const s = new THREE.Mesh(new THREE.SphereGeometry(0.018 + Math.random() * 0.022, 4, 3), starMat)
        s.position.set(sx, sy, bZ - 2.7); threeScene.add(s); return s
      })

    // Sunrise + afternoon suns
    const sun = new THREE.Mesh(new THREE.CircleGeometry(0.38, 24), new THREE.MeshBasicMaterial({ color: '#FFAA40' })); sun.position.set(-0.3, 1.85, bZ - 2.44); threeScene.add(sun)
    const sunGlow1 = new THREE.Mesh(new THREE.CircleGeometry(0.75, 24), new THREE.MeshBasicMaterial({ color: '#FF7020', transparent: true, opacity: 0.45, side: THREE.DoubleSide })); sunGlow1.position.set(-0.3, 1.85, bZ - 2.45); threeScene.add(sunGlow1)
    const sunGlow2 = new THREE.Mesh(new THREE.CircleGeometry(1.25, 24), new THREE.MeshBasicMaterial({ color: '#FF4010', transparent: true, opacity: 0.20, side: THREE.DoubleSide })); sunGlow2.position.set(-0.3, 1.85, bZ - 2.46); threeScene.add(sunGlow2)
    const sunriseLight = new THREE.PointLight('#FF8040', 0.0, 14); sunriseLight.position.set(0, 2, bZ + 1); threeScene.add(sunriseLight)
    const aftSun = new THREE.Mesh(new THREE.CircleGeometry(0.26, 24), new THREE.MeshBasicMaterial({ color: '#FFEE60' })); aftSun.position.set(1.4, 5.5, bZ - 2.6); threeScene.add(aftSun)
    const aftGlow1 = new THREE.Mesh(new THREE.CircleGeometry(0.48, 24), new THREE.MeshBasicMaterial({ color: '#FFFFA0', transparent: true, opacity: 0.45, side: THREE.DoubleSide })); aftGlow1.position.set(1.4, 5.5, bZ - 2.61); threeScene.add(aftGlow1)
    const aftGlow2 = new THREE.Mesh(new THREE.CircleGeometry(0.75, 24), new THREE.MeshBasicMaterial({ color: '#FFFF60', transparent: true, opacity: 0.18, side: THREE.DoubleSide })); aftGlow2.position.set(1.4, 5.5, bZ - 2.62); threeScene.add(aftGlow2)

    // Fish state
    const fishState = { x: fBX, z: fBZ, angle: Math.random() * Math.PI * 2, speed: 0.045, timer: 1.5, swimming: true }

    // ── Lighting targets per scene ────────────────────────────────────────
    const skyColors: Record<View, Record<Scene, string>> = {
      beach:  { predawn: '#2A0E40', morning: '#6B2D5E', afternoon: '#4A9EDF', night: '#04030F' },
      city:   { predawn: '#180830', morning: '#5A2050', afternoon: '#3A78C0', night: '#060412' },
      forest: { predawn: '#0E0820', morning: '#4A1840', afternoon: '#4A88CC', night: '#030608' },
    }
    const horizonColors: Record<View, Record<Scene, string>> = {
      beach:  { predawn: '#100628', morning: '#E8602A', afternoon: '#2A6898', night: '#040212' },
      city:   { predawn: '#0C0420', morning: '#1A1828', afternoon: '#1A1A3A', night: '#060414' },
      forest: { predawn: '#080418', morning: '#0E1A08', afternoon: '#1A3A10', night: '#020604' },
    }
    const lightTargets: Record<Scene, { bg: THREE.Color; wall: THREE.Color; floor: THREE.Color; ceil: THREE.Color; amb: { c: string; i: number }; dir: { c: string; i: number }; fill: { c: string; i: number }; door: { c: string; i: number }; lamp: number; sofa: number; shelf: number; pendant: number; candle: number; moon: number; sunrise: number; ocean: string }> = {
      predawn:   { bg: new THREE.Color('#060410'), wall: new THREE.Color('#0C0818'), floor: new THREE.Color('#08060E'), ceil: new THREE.Color('#0A0816'), amb: { c: '#1A0E30', i: 0.5 }, dir: { c: '#302060', i: 0.2 }, fill: { c: '#28184A', i: 0.3 }, door: { c: '#1818A0', i: 0.4 }, lamp: 1.2, sofa: 0.3, shelf: 0.2, pendant: 0.8, candle: 0.5, moon: 0.5, sunrise: 0.0, ocean: '#060E1C' },
      morning:   { bg: new THREE.Color('#2A0E1E'), wall: new THREE.Color('#3A1830'), floor: new THREE.Color('#241028'), ceil: new THREE.Color('#2A1230'), amb: { c: '#5A2840', i: 1.1 }, dir: { c: '#FFB090', i: 2.2 }, fill: { c: '#E08868', i: 1.4 }, door: { c: '#FF9060', i: 3.2 }, lamp: 0.0, sofa: 0.7, shelf: 0.5, pendant: 1.4, candle: 0.6, moon: 0.0, sunrise: 2.0, ocean: '#1A4878' },
      afternoon: { bg: new THREE.Color('#B8B0A4'), wall: new THREE.Color('#D8D0C4'), floor: new THREE.Color('#B8A890'), ceil: new THREE.Color('#E0D8CC'), amb: { c: '#C8D8F0', i: 1.0 }, dir: { c: '#FFF8E8', i: 2.2 }, fill: { c: '#B0D0FF', i: 0.6 }, door: { c: '#FFFFFF', i: 3.0 }, lamp: 0.0, sofa: 0.2, shelf: 0.1, pendant: 0.5, candle: 0.0, moon: 0.0, sunrise: 0.0, ocean: '#1A5890' },
      night:     { bg: new THREE.Color('#060410'), wall: new THREE.Color('#0A0812'), floor: new THREE.Color('#06040E'), ceil: new THREE.Color('#08060F'), amb: { c: '#14103A', i: 0.7 }, dir: { c: '#1A1040', i: 0.1 }, fill: { c: '#D4A030', i: 0.5 }, door: { c: '#3040C0', i: 0.6 }, lamp: 3.2, sofa: 1.4, shelf: 0.9, pendant: 2.6, candle: 1.6, moon: 0.8, sunrise: 0.0, ocean: '#04080E' },
    }

    // ── Animation loop ────────────────────────────────────────────────────
    let rafId: number
    let prevT = 0
    const spd = 0.028
    const lrp = (a: number, b: number) => a + (b - a) * spd

    const animate = () => {
      rafId = requestAnimationFrame(animate)
      const t = performance.now() * 0.001
      const dt = prevT > 0 ? Math.min(t - prevT, 0.05) : 0.016
      prevT = t
      const { scene: sc, view: vw } = stateRef.current
      const lt = lightTargets[sc]

      ;(threeScene.background as THREE.Color).lerp(lt.bg, spd)
      wallMat.color.lerp(lt.wall, spd); floorMat.color.lerp(lt.floor, spd)
      ceilMat.color.lerp(lt.ceil, spd); sideMat.color.lerp(lt.wall, spd)
      ambient.color.lerp(new THREE.Color(lt.amb.c), spd); ambient.intensity = lrp(ambient.intensity, lt.amb.i)
      dirLight.color.lerp(new THREE.Color(lt.dir.c), spd); dirLight.intensity = lrp(dirLight.intensity, lt.dir.i)
      fillLight.color.lerp(new THREE.Color(lt.fill.c), spd); fillLight.intensity = lrp(fillLight.intensity, lt.fill.i)
      doorLight.color.lerp(new THREE.Color(lt.door.c), spd); doorLight.intensity = lrp(doorLight.intensity, lt.door.i)
      deskLamp.intensity = lrp(deskLamp.intensity, lt.lamp)
      sofaLight.intensity = lrp(sofaLight.intensity, lt.sofa)
      shelfLight.intensity = lrp(shelfLight.intensity, lt.shelf)
      pendantLight.intensity = lrp(pendantLight.intensity, lt.pendant)
      candleLight.intensity = lrp(candleLight.intensity, lt.candle)
      moonLight.intensity = lrp(moonLight.intensity, lt.moon)
      sunriseLight.intensity = lrp(sunriseLight.intensity, lt.sunrise)
      globeMat.emissiveIntensity = lrp(globeMat.emissiveIntensity, lt.pendant > 1 ? 1.0 : 0.4)
      oceanMat.color.lerp(new THREE.Color(lt.ocean), spd)

      const isNight = sc === 'night', isPredawn = sc === 'predawn', isMorning = sc === 'morning', isAfternoon = sc === 'afternoon'
      moon.visible = isNight || isPredawn; moonHalo.visible = isNight || isPredawn
      if (moon.visible) {
        const tgt = isPredawn ? 0.7 : 1.0
        moonMat.opacity = moonMat.opacity * 0.96 + tgt * 0.04
        moonHaloMat.opacity = moonHaloMat.opacity * 0.96 + (isPredawn ? 0.10 : 0.18) * 0.04
      }
      const showStars = isNight || isPredawn || (isMorning && vw !== 'beach')
      starMeshes.forEach((s, i) => {
        s.visible = showStars
        if (s.visible) (s.material as THREE.MeshBasicMaterial).opacity = 0.55 + 0.45 * Math.sin(t * 1.8 + i * 1.37)
      })
      const showSun = isMorning && vw !== 'beach'
      sun.visible = showSun; sunGlow1.visible = showSun; sunGlow2.visible = showSun
      aftSun.visible = isAfternoon; aftGlow1.visible = isAfternoon; aftGlow2.visible = isAfternoon
      skyMat.color.lerp(new THREE.Color(skyColors[vw][sc]), spd)
      horizonMat.color.lerp(new THREE.Color(horizonColors[vw][sc]), spd)
      beachGroup.visible = vw === 'beach'; cityGroup.visible = vw === 'city'; forestGroup.visible = vw === 'forest'

      // Beach waves
      if (vw === 'beach') {
        waveObjs.forEach(w => {
          const range = w.startY - w.shoreY
          if (w.phase === 'in') {
            const prog = Math.max(0, Math.min(1, (w.startY - w.body.position.y) / range))
            w.body.position.y -= w.speed * (0.5 + 0.8 * prog) * dt
            if (w.body.position.y <= w.shoreY) { w.body.position.y = w.shoreY; w.phase = 'hold'; w.timer = 0.9 + Math.random() * 0.7 }
            const alpha = Math.min(1, prog * 1.4)
            ;(w.body.material as THREE.MeshBasicMaterial).opacity = w.baseOpacity * alpha
            ;(w.foam.material as THREE.MeshBasicMaterial).opacity = w.foamBaseOpacity * alpha
          } else if (w.phase === 'hold') {
            w.timer -= dt
            ;(w.body.material as THREE.MeshBasicMaterial).opacity = w.baseOpacity
            ;(w.foam.material as THREE.MeshBasicMaterial).opacity = w.foamBaseOpacity
            if (w.timer <= 0) w.phase = 'out'
          } else if (w.phase === 'out') {
            const rp = Math.max(0, Math.min(1, (w.body.position.y - w.shoreY) / range))
            w.body.position.y += w.speed * 0.5 * (0.3 + 0.7 * (1 - rp)) * dt
            const alpha = Math.max(0, 1 - rp * 1.2)
            ;(w.body.material as THREE.MeshBasicMaterial).opacity = w.baseOpacity * alpha
            ;(w.foam.material as THREE.MeshBasicMaterial).opacity = w.foamBaseOpacity * alpha
            if (w.body.position.y >= w.startY) { w.body.position.y = w.startY; (w.body.material as THREE.MeshBasicMaterial).opacity = 0; (w.foam.material as THREE.MeshBasicMaterial).opacity = 0; w.phase = 'wait'; w.timer = 2.0 + Math.random() * 2.5 }
          } else { w.timer -= dt; if (w.timer <= 0) w.phase = 'in' }
          w.foam.position.y = w.body.position.y - 0.66
        })
        let proximity = 0
        waveObjs.forEach(w => {
          if (w.phase === 'hold') proximity = Math.max(proximity, 1.0)
          else if (w.phase === 'in') proximity = Math.max(proximity, Math.max(0, 1 - (w.body.position.y - w.shoreY) / 0.35))
        })
        bubbles.forEach(({ mesh, phase }) => {
          const pulse = Math.max(0, Math.sin(t * 3.5 + phase)) * proximity
          mesh.scale.setScalar(pulse * 0.85)
          ;(mesh.material as THREE.MeshBasicMaterial).opacity = pulse * 0.65
        })
      } else { bubbles.forEach(({ mesh }) => mesh.scale.setScalar(0)) }

      // Fish
      fishState.timer -= dt
      if (fishState.timer <= 0) {
        if (fishState.swimming) { fishState.swimming = false; fishState.speed = 0; fishState.timer = 0.6 + Math.random() * 1.2 }
        else { fishState.swimming = true; fishState.angle = Math.random() * Math.PI * 2; fishState.speed = 0.038 + Math.random() * 0.028; fishState.timer = 1.5 + Math.random() * 2.5 }
      }
      if (fishState.swimming) {
        const nx = fishState.x + Math.cos(fishState.angle) * fishState.speed * dt
        const nz = fishState.z + Math.sin(fishState.angle) * fishState.speed * dt
        const dx = nx - fBX, dz2 = nz - fBZ
        if (Math.sqrt(dx * dx + dz2 * dz2) < 0.082) { fishState.x = nx; fishState.z = nz }
        else { fishState.angle += Math.PI + (Math.random() - 0.5) * 0.8; fishState.timer = 0.2 }
      }
      fishGroup.position.set(fishState.x, fBY - 0.025 + Math.sin(t * 1.8) * 0.014, fishState.z)
      if (fishState.swimming) fishGroup.rotation.y = -fishState.angle + Math.PI / 2
      tailPivot.rotation.y = Math.sin(t * 5.2) * (fishState.swimming ? 0.38 : 0.05)
      fishGroup.rotation.z = Math.sin(t * 5.2 + Math.PI) * (fishState.swimming ? 0.07 : 0.01)

      // Curtains
      const wt = t * 1.1
      for (const cm of [leftCurtain, rightCurtain]) {
        const pos = cm.geometry.attributes.position as THREE.BufferAttribute
        for (let i = 0; i < pos.count; i++) {
          const yL = pos.getY(i), xL = pos.getX(i)
          const yN = (yL + curtainH / 2) / curtainH
          const hang = (1 - yN) * (1 - yN * 0.25)
          const pleatBase = Math.sin((xL / curtainW + 0.5) * Math.PI * 5) * 0.07 * (1 + (1 - yN) * 0.5)
          const wave = (Math.sin(wt + yN * Math.PI * 2.5 + xL * 2.0) * 0.5 + 0.5) * 0.20 * hang + (Math.sin(wt * 1.4 + yN * Math.PI * 3.8 + xL * 2.5) * 0.5 + 0.5) * 0.07 * hang
          pos.setZ(i, pleatBase + wave)
        }
        pos.needsUpdate = true; cm.geometry.computeVertexNormals()
      }

      renderer.render(threeScene, camera)
    }
    animate()

    // ── Resize ────────────────────────────────────────────────────────────
    const onResize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const w = parent.clientWidth
      const h = parent.clientHeight
      if (!w || !h) return
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    // Call once immediately so canvas fills container on first render
    onResize()

    window.addEventListener('resize', onResize)
    const ro = new ResizeObserver(onResize)
    ro.observe(canvas.parentElement!)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', onResize)
      ro.disconnect()
      renderer.dispose()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
    />
  )
}