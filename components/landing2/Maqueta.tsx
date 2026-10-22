'use client'
// Landing → el barrio en maqueta blanca. Arrancan 4 negocios con Stampa y
// cada 1,9 s se suma otro: el local se pinta, cae el pin, la vista se acerca
// y aparece el chip. Cuando están todos, muestra actividad y vuelve a empezar.
// El dibujo es SVG armado a mano (isométrico); en el celular, menos manzanas.
import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { SHOPS, JOIN, EVENT, type Biz } from './data'

const BIZ: Biz[] = [SHOPS[0], SHOPS[1], SHOPS[2], SHOPS[3], ...JOIN]
const WHO = ['Lucía', 'Martín', 'Sofía', 'Ana', 'Pablo', 'Inés', 'Carla', 'Diego', 'Lara', 'Tomás', 'Rocío', 'Hugo']
const WHITE = ['#FFFFFF', '#EFEDE8', '#E0DDD6']
const C = .866, S = .5
const P = (x: number, y: number, z = 0): [number, number] => [(x - y) * C, (x + y) * S - z]
const pt = (a: number[][]) => a.map(p => P(p[0], p[1], p[2]).map(n => n.toFixed(1)).join(',')).join(' ')
const poly = (a: number[][], f: string, cls = '') => `<polygon class="${cls}" points="${pt(a)}" style="fill:${f}"/>`
const shade = (hex: string, f: number) => {
  const n = parseInt(hex.slice(1), 16)
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(f > 1 ? v + (255 - v) * (f - 1) : v * f)))
  return `rgb(${ch(n >> 16)},${ch((n >> 8) & 255)},${ch(n & 255)})`
}

type Lot = { anchor: [number, number] }

// Arma el SVG. small: versión liviana para el celular.
function build(small: boolean) {
  let sd = 5
  const R = () => { sd = (sd * 9301 + 49297) % 233280; return sd / 233280 }
  const B = 80, ST = 26, NX = small ? 8 : 10, NY = small ? 7 : 9, W = NX * (B + ST), H = NY * (B + ST)
  const items: { z: number; h: string }[] = []
  const add = (z: number, h: string) => items.push({ z, h })
  let base = poly([[-60, -60, 0], [W + 30, -60, 0], [W + 30, H + 30, 0], [-60, H + 30, 0]], '#F6F5F1')
  // Parque en el centro: caminos, fuente, laguna, flores, faroles y árboles
  const gx0 = small ? 3 : 4, gy0 = small ? 2 : 3
  const px0 = gx0 * (B + ST), py0 = gy0 * (B + ST), px1 = (gx0 + 2) * (B + ST) - ST, py1 = (gy0 + 2) * (B + ST) - ST, pcx = (px0 + px1) / 2, pcy = (py0 + py1) / 2
  base += poly([[px0, py0, 0], [px1, py0, 0], [px1, py1, 0], [px0, py1, 0]], '#F7F6F1') + poly([[px0 + 9, py0 + 9, 0], [px1 - 9, py0 + 9, 0], [px1 - 9, py1 - 9, 0], [px0 + 9, py1 - 9, 0]], '#E2E8D8')
  base += poly([[pcx - 6, py0 + 9, 0], [pcx + 6, py0 + 9, 0], [pcx + 6, py1 - 9, 0], [pcx - 6, py1 - 9, 0]], '#F7F6F1') + poly([[px0 + 9, pcy - 6, 0], [px1 - 9, pcy - 6, 0], [px1 - 9, pcy + 6, 0], [px0 + 9, pcy + 6, 0]], '#F7F6F1')
  const [fx, fy] = P(pcx, pcy)
  base += `<ellipse cx="${fx}" cy="${fy}" rx="44" ry="22" fill="#F7F6F1"/><ellipse cx="${fx}" cy="${fy}" rx="26" ry="13" fill="#E3DFD6"/><ellipse cx="${fx}" cy="${fy - 4}" rx="26" ry="13" fill="#F3F1EC"/><ellipse class="l2-water" cx="${fx}" cy="${fy - 4}" rx="20" ry="10" fill="#CFE2E8"/><rect x="${fx - 3}" y="${fy - 20}" width="6" height="16" rx="2" fill="#EDEAE3"/>`
  ;[[-32, 4], [32, 4], [0, -20], [0, 22]].forEach(([dx, dy], k) => { base += `<ellipse cx="${fx + dx}" cy="${fy + dy}" rx="6" ry="3" fill="${k % 2 ? '#F3DFA6' : '#F2C9B4'}"/>` })
  const [lx, ly] = P(px0 + 44, py1 - 44)
  base += `<ellipse cx="${lx}" cy="${ly}" rx="36" ry="15" fill="#D3E3E8"/><ellipse class="l2-water" cx="${lx - 5}" cy="${ly - 3}" rx="22" ry="8" fill="#E3EEF1"/>`
  const tree = (x: number, y: number, s: number, c: string) => { const [bx, by] = P(x, y), [cx, cy] = P(x, y, 14 * s); return `<line x1="${bx}" y1="${by}" x2="${bx}" y2="${by - 8 * s}" stroke="#C9C1B1" stroke-width="${1.6 * s}"/><circle cx="${cx}" cy="${cy}" r="${7.5 * s}" fill="${c}"/><circle cx="${cx - 2.4 * s}" cy="${cy - 2.4 * s}" r="${3.4 * s}" fill="#F0F3EA"/>` }
  ;[[px0 + 14, py0 + 14, pcx - 12, pcy - 12], [pcx + 12, py0 + 14, px1 - 14, pcy - 12], [px0 + 14, pcy + 12, pcx - 12, py1 - 14], [pcx + 12, pcy + 12, px1 - 14, py1 - 14]].forEach(([x0, y0, x1, y1], q) => {
    for (let k = 0; k < 11; k++) { const x = x0 + R() * (x1 - x0), y = y0 + R() * (y1 - y0); if (q === 2 && Math.hypot(x - (px0 + 44), y - (py1 - 44)) < 40) continue; add(x + y, tree(x, y, .9 + R() * .6, ['#D3DCC7', '#C5D2B8', '#DCE4D1'][Math.floor(R() * 3)])) }
  })
  const lamp = (x: number, y: number) => { const [a, b] = P(x, y), [c, d] = P(x, y, 24); return `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="#CFC9BD" stroke-width="2"/><circle cx="${c}" cy="${d}" r="3.5" fill="#F3DFA6"/>` }
  ;[[pcx - 9, py0 + 36], [pcx + 9, py1 - 36], [px0 + 36, pcy - 9], [px1 - 36, pcy + 9]].forEach(([x, y]) => add(x + y, lamp(x, y)))
  // Lotes de los negocios con Stampa, alrededor del parque
  const d0x = gx0 - 4, d0y = gy0 - 3
  const spots = [[3, 2, 1, 1], [6, 3, 0, 0], [4, 5, 1, 0], [6, 5, 0, 1], [3, 4, 1, 0], [5, 2, 0, 0], [7, 4, 0, 1], [2, 3, 1, 1], [5, 6, 1, 0], [7, 2, 0, 1], [3, 6, 0, 0], [2, 5, 1, 1]].map(([a, b, c, d]) => [a + d0x, b + d0y, c, d])
  const isLot: Record<string, number> = {}
  spots.forEach((s, k) => { isLot[s.join(',')] = k })
  const lots: Lot[] = []
  for (let gx = 0; gx < NX; gx++) for (let gy = 0; gy < NY; gy++) {
    if (gx >= gx0 && gx < gx0 + 2 && gy >= gy0 && gy < gy0 + 2) continue
    const x = gx * (B + ST), y = gy * (B + ST)
    for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
      const x0 = x + a * (B / 2) + 2, y0 = y + b * (B / 2) + 2, w = B / 2 - 4, d = B / 2 - 4
      const k = isLot[[gx, gy, a, b].join(',')]
      const near = Math.hypot(gx - gx0 - 1, gy - gy0 - 1) < 3.2
      const h = k !== undefined ? 64 + R() * 12 : 12 + R() * (near ? 30 : 58)
      if (near) add(x0 + y0 - 2000, poly([[x0, y0 + d, 0], [x0 + w, y0 + d, 0], [x0 + w + h * .5, y0 + d + h * .12, 0], [x0 + h * .5, y0 + d + h * .12, 0]], 'rgba(60,55,45,.06)'))
      const faces = poly([[x0, y0 + d, 0], [x0 + w, y0 + d, 0], [x0 + w, y0 + d, h], [x0, y0 + d, h]], WHITE[1], 'fl') + poly([[x0 + w, y0, 0], [x0 + w, y0 + d, 0], [x0 + w, y0 + d, h], [x0 + w, y0, h]], WHITE[2], 'fr') + poly([[x0, y0, h], [x0 + w, y0, h], [x0 + w, y0 + d, h], [x0, y0 + d, h]], WHITE[0], 'ftop')
      if (k !== undefined) {
        lots[k] = { anchor: P(x0 + w / 2, y0 + d / 2, h + 26) }
        add(x0 + y0, `<g class="l2-lot" data-k="${k}">${faces}${poly([[x0 + w * .15, y0 + d, h * .12], [x0 + w * .6, y0 + d, h * .12], [x0 + w * .6, y0 + d, h * .45], [x0 + w * .15, y0 + d, h * .45]], 'rgba(255,255,255,0)', 'fw')}</g>`)
      } else add(x0 + y0, `<g>${faces}</g>`)
    }
  }
  const [cx, cy] = P(pcx, pcy)
  const vb = [cx - 520, cy - 330, 1040, 620]
  let svg = `<svg class="l2-scene" viewBox="${vb.join(' ')}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Maqueta de un barrio: los negocios con Stampa aparecen en color">${base}`
  items.sort((p, q) => p.z - q.z).forEach(it => { svg += it.h })
  return { svg: svg + '<g class="l2-pins"></g></svg>', lots, vb }
}

export function Maqueta() {
  const stageRef = useRef<HTMLDivElement>(null)
  const [count, setCount] = useState(4)
  const [today, setToday] = useState(1248)
  const [chip, setChip] = useState<{ k: number; ev: string; x: number; y: number; n: number } | null>(null)

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const { svg, lots, vb } = build(window.innerWidth < 700)
    stage.innerHTML = svg
    const el = stage.querySelector('svg') as SVGSVGElement
    const pins = el.querySelector('.l2-pins') as SVGGElement
    const active = new Set<number>()
    let joined = 4, round = 0, anim = 0, cur = 0, n = 0, lastEv = ''

    const paint = (k: number, on: boolean) => {
      const g = el.querySelector(`.l2-lot[data-k="${k}"]`)
      if (!g) return
      const c = BIZ[k].color
      const set = (sel: string, v: string) => { const p = g.querySelector(sel) as SVGElement | null; if (p) p.style.fill = v }
      set('.ftop', on ? shade(c, 1.25) : WHITE[0]); set('.fl', on ? c : WHITE[1]); set('.fr', on ? shade(c, .72) : WHITE[2]); set('.fw', on ? 'rgba(255,240,215,.85)' : 'rgba(255,255,255,0)')
      pins.querySelector(`[data-k="${k}"]`)?.remove()
      if (on) {
        const [tx, ty] = lots[k].anchor
        pins.insertAdjacentHTML('beforeend', `<g data-k="${k}" class="l2-hit"><circle class="l2-ring" cx="${tx}" cy="${ty}" r="10" fill="none" stroke="${c}" stroke-width="2"/><g class="l2-pin"><line x1="${tx}" y1="${ty}" x2="${tx}" y2="${ty + 18}" stroke="${c}" stroke-width="2"/><circle cx="${tx}" cy="${ty}" r="10" fill="#fff" stroke="${c}" stroke-width="3"/><circle cx="${tx}" cy="${ty}" r="3.5" fill="${c}"/></g></g>`)
      }
    }
    const placeChip = (k: number, ev: string) => {
      const [ax, ay] = lots[k].anchor
      const m = el.getScreenCTM(), r = stage.getBoundingClientRect()
      if (!m) return
      const p = el.createSVGPoint(); p.x = ax; p.y = ay
      const q = p.matrixTransform(m)
      setChip({ k, ev, x: Math.min(Math.max(q.x - r.left - 110, 8), r.width - 240), y: Math.max(q.y - r.top - 64, 60), n: ++n })
    }
    // La vista se acerca un poco al local de turno
    const focus = (k: number, ev: string) => {
      const [ax, ay] = lots[k].anchor
      const tw = vb[2] * .82, th = vb[3] * .82
      const target = [ax - tw / 2, ay - th / 2 + 40, tw, th]
      const from = (el.getAttribute('viewBox') || '').split(' ').map(Number)
      const t0 = performance.now(), D = reduce ? 0 : 800
      cancelAnimationFrame(anim)
      const f = (t: number) => {
        const u = D ? Math.max(0, Math.min((t - t0) / D, 1)) : 1, e = 1 - Math.pow(1 - u, 3)
        el.setAttribute('viewBox', from.map((v, i) => v + (target[i] - v) * e).join(' '))
        if (u < 1) anim = requestAnimationFrame(f); else placeChip(k, ev)
      }
      anim = requestAnimationFrame(f)
    }
    const present = (k: number, ev: string) => { cur = k; lastEv = ev; setToday(t => t + 1 + Math.floor(Math.random() * 3)); focus(k, ev) }
    const step = () => {
      if (joined < BIZ.length) { const k = joined++; active.add(k); paint(k, true); setCount(active.size); present(k, 'Se sumó a Stampa'); return }
      if (round++ < 6) { const list = [...active]; const k = list[Math.floor(Math.random() * list.length)]; present(k, `${WHO[k % WHO.length]} · ${EVENT[BIZ[k].model]}`); return }
      round = 0
      for (let k = 4; k < BIZ.length; k++) { active.delete(k); paint(k, false) }
      joined = 4; setCount(4)
    }
    ;[0, 1, 2, 3].forEach(k => { active.add(k); paint(k, true) })
    present(0, `Lucía · ${EVENT.sellos}`)
    const timer = setInterval(step, reduce ? 4000 : 1900)
    const onClick = (e: MouseEvent) => {
      const g = (e.target as Element).closest('[data-k]')
      if (!g) return
      const k = Number(g.getAttribute('data-k'))
      if (active.has(k)) present(k, `${WHO[k % WHO.length]} · ${EVENT[BIZ[k].model]}`)
    }
    const onResize = () => placeChip(cur, lastEv)
    el.addEventListener('click', onClick)
    addEventListener('resize', onResize)
    return () => { clearInterval(timer); cancelAnimationFrame(anim); el.removeEventListener('click', onClick); removeEventListener('resize', onResize) }
  }, [])

  const b = chip ? BIZ[chip.k] : null
  return (
    <div className="l2-maq">
      <div className="l2-maq-stage" ref={stageRef} />
      <div className="l2-maq-fade" />
      <div className="l2-maq-top">
        <span className="l2-pill"><b>{count}</b> negocios del barrio con Stampa</span>
        <span className="l2-pill"><Icon name="analitica" size={16} />Hoy en el barrio: <b key={today} className="l2-bump">{today.toLocaleString('es-AR')}</b> visitas sumadas</span>
      </div>
      {b && chip && (
        <div key={chip.n} className="l2-chip" style={{ left: chip.x, top: chip.y }}>
          <span className="l2-mini" style={{ background: b.color }}><Icon name={b.icon} size={18} /></span>
          <span><b>{b.name}</b><small>{chip.ev}</small></span>
        </div>
      )}
    </div>
  )
}
