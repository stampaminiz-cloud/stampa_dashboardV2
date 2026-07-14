'use client'
import React, { useState, useEffect, useRef } from 'react'
import { apiOnboarding } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────
type CardType    = 'stamp' | 'points' | 'membership'
type RewardMode  = 'customer' | 'fixed'

interface OBState {
  businessName:   string
  sector:         string
  cardType:       CardType
  stampsRequired: number
  pointsPerVisit: number
  rewardMode:     RewardMode
  rewardValue:    string
  brandColor:     string
  brandLogo:      string | null
}

// ─── Sector → card recommendation ────────────────────────────────────────────
const SECTOR_CARD: Record<string, CardType> = {
  cafe: 'stamp', restaurant: 'stamp', hair: 'membership',
  gym: 'points', bakery: 'stamp', spa: 'points',
  clothing: 'membership', bookstore: 'stamp', other: 'stamp',
}

const SECTOR_STAMPS: Record<string, number> = {
  cafe: 8, restaurant: 8, bakery: 6, bookstore: 10,
  hair: 8, gym: 10, spa: 10, clothing: 8, other: 8,
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
function IcoCoffee()    { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg> }
function IcoFork()      { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg> }
function IcoScissors()  { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg> }
function IcoDumbbell()  { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="5" x2="6" y2="19"/><line x1="18" y1="5" x2="18" y2="19"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg> }
function IcoBread()     { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg> }
function IcoLeaf()      { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 4 13c0-7 7-12 7-12s7 5 7 12a7 7 0 0 1-7 7z"/><path d="M11 20V13"/></svg> }
function IcoShirt()     { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/></svg> }
function IcoBook()      { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> }
function IcoStore()     { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> }
function IcoCheck()     { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> }
function IcoArrowR()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg> }
function IcoArrowL()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> }

const SECTORS = [
  { id: 'cafe',      label: 'Cafetería / Bar',        icon: <IcoCoffee /> },
  { id: 'restaurant',label: 'Restaurante',             icon: <IcoFork /> },
  { id: 'hair',      label: 'Peluquería / Barbería',   icon: <IcoScissors /> },
  { id: 'gym',       label: 'Gym / Fitness',           icon: <IcoDumbbell /> },
  { id: 'bakery',    label: 'Panadería / Pastelería',  icon: <IcoBread /> },
  { id: 'spa',       label: 'Spa / Belleza',           icon: <IcoLeaf /> },
  { id: 'clothing',  label: 'Ropa / Indumentaria',     icon: <IcoShirt /> },
  { id: 'bookstore', label: 'Librería',                icon: <IcoBook /> },
  { id: 'other',     label: 'Otro rubro',              icon: <IcoStore /> },
]


// ─── Step info (left panel content) ──────────────────────────────────────────
const STEP_INFO: Record<number, { title: string; subtitle: string; tip: string }> = {
  1: {
    title: 'Contanos sobre tu negocio',
    subtitle: 'Nombre y rubro — con esto configuramos todo lo demás.',
    tip: 'Elegí bien el rubro, lo usamos para recomendarte el programa de fidelización ideal para vos.',
  },
  2: {
    title: '¿Qué tipo de programa querés?',
    subtitle: 'Te recomendamos uno según tu rubro, pero podés elegir el que quieras.',
    tip: 'La tarjeta de sellos es la más usada — simple, efectiva y los clientes la entienden al instante.',
  },
  3: {
    title: 'Configurá tu programa',
    subtitle: 'Definí los parámetros del programa de fidelización.',
    tip: '8 visitas es el número más popular. Suficiente para motivar sin que el cliente se canse de esperar.',
  },
  4: {
    title: '¿Cómo se define el premio?',
    subtitle: 'Decidí quién elige el premio al completar la tarjeta.',
    tip: 'Que el cliente elija su premio genera más expectativa — y más ganas de volver a completar la tarjeta.',
  },
  5: {
    title: 'Dale identidad a tu tarjeta',
    subtitle: 'El logo y el color se muestran en la wallet pass de tus clientes.',
    tip: 'Una tarjeta con tus colores se ve más profesional y genera más confianza en tus clientes.',
  },
  6: {
    title: '¡Casi listo!',
    subtitle: 'Así queda tu tarjeta. Esto es lo que van a ver tus clientes.',
    tip: 'Una vez en el dashboard podés editar todo esto cuando quieras — el programa nunca es fijo.',
  },
}

const PRESET_COLORS = ['#1E3329','#C75D3A','#185FA5','#533FB7','#854F0B','#2C2C2A','#5B8C5A','#9C3030']

function darken(hex: string): string {
  const c = hex.replace('#','')
  if (c.length !== 6) return hex
  return '#' + [0,2,4].map(i => Math.round(parseInt(c.slice(i,i+2),16)*0.72).toString(16).padStart(2,'0')).join('')
}

// ─── Stampa mascot ────────────────────────────────────────────────────────────
function StampaFrog({ size = 28 }: { size?: number }) {
  return (
    <img src="/stampa-mascot.png" alt="Stampy" width={size} height={size} style={{ objectFit: 'contain' }} />
  )
}

// ─── Stampy icon (exact vector from Logo.ai, reused for tips/hints) ──────────
const STAMPY_PATH = "M 611.515625 390.210938 C 631.171875 390.210938 631.203125 359.664062 611.515625 359.664062 C 591.859375 359.664062 591.828125 390.210938 611.515625 390.210938 M 518.382812 390.210938 C 538.035156 390.210938 538.070312 359.664062 518.382812 359.664062 C 498.726562 359.664062 498.695312 390.210938 518.382812 390.210938 M 662.726562 731.242188 L 662.902344 731.578125 C 667.019531 737.570312 674.152344 735.371094 680.445312 733.425781 C 682.566406 732.773438 684.730469 732.101562 686.734375 731.75 C 686.59375 731.800781 686.445312 731.847656 686.296875 731.898438 C 685.734375 732.085938 685.226562 732.257812 684.824219 732.421875 C 676.351562 735.894531 651.445312 743.265625 646.980469 742.019531 C 634.851562 710.550781 623.75 678.085938 613.011719 646.683594 C 604.890625 622.929688 596.492188 598.367188 587.703125 574.398438 L 587.625 574.191406 C 589.777344 574.199219 591.957031 574.289062 594.195312 574.554688 C 598.144531 575.023438 602.003906 575.820312 605.785156 576.878906 Z M 558.652344 741.957031 C 560.871094 742.039062 563.128906 742.117188 565.140625 742.445312 C 564.992188 742.445312 564.839844 742.441406 564.683594 742.441406 C 564.089844 742.433594 563.550781 742.425781 563.117188 742.449219 C 553.972656 742.941406 528.035156 741.703125 524.222656 739.054688 C 523.128906 705.347656 523.335938 671.039062 523.535156 637.855469 C 523.585938 629.144531 523.632812 620.316406 523.660156 611.453125 C 528.988281 605.730469 534.453125 600.175781 540.152344 595.175781 L 542.640625 734.058594 L 542.691406 734.433594 C 544.605469 741.453125 552.066406 741.71875 558.652344 741.957031 M 497.492188 343.71875 C 515.738281 342.460938 531.421875 349.605469 539.082031 366.675781 C 542.117188 373.445312 544.234375 380.605469 545.585938 387.929688 C 545.652344 392.914062 545.945312 397.925781 546.234375 402.929688 L 444.660156 402.929688 C 443.628906 373.03125 466.117188 345.878906 497.492188 343.71875 M 562.652344 368.59375 C 566.378906 354.457031 578.511719 342.34375 593.199219 340.039062 C 608.832031 337.582031 621.507812 348.765625 628.234375 361.847656 C 634.691406 374.390625 635.71875 388.820312 635.691406 402.929688 L 562.636719 402.929688 C 562.378906 396.796875 561.730469 390.628906 560.601562 384.570312 C 560.726562 379.171875 561.277344 373.828125 562.652344 368.59375 M 677.597656 616.0625 C 720.660156 637.035156 770.347656 603.078125 767.992188 555.238281 C 767.667969 548.640625 766.929688 543.941406 765.464844 542.988281 C 762.320312 540.949219 717.355469 534.675781 705.980469 530.402344 C 660.046875 513.140625 636.742188 476.59375 578.011719 470.703125 C 536.339844 466.523438 495.132812 487.578125 453.09375 486.78125 L 453.097656 486.792969 C 440.523438 487.160156 420.957031 481.453125 418.160156 477.183594 C 414.453125 471.523438 417.480469 469.023438 420.300781 467.464844 C 424.753906 465.007812 425.320312 470.195312 433.53125 474.738281 C 440.597656 478.644531 447.78125 479.105469 449.652344 479.15625 C 449.8125 479.160156 449.96875 479.160156 450.128906 479.164062 L 450.136719 479.164062 C 455.34375 479.289062 460.761719 479.691406 465.335938 479.003906 C 502.023438 473.5 540.414062 455.378906 578.699219 455.453125 C 609.699219 455.515625 643.351562 469.207031 673.074219 475.605469 C 691.507812 479.574219 709.628906 481.300781 727.964844 481.933594 C 749.882812 482.6875 767.820312 465.265625 767.820312 443.332031 C 767.820312 421.019531 749.734375 402.929688 727.421875 402.929688 L 650.886719 402.929688 C 650.777344 385.023438 649.019531 366.851562 639.804688 351.171875 C 630.171875 334.773438 612.832031 322.574219 593.191406 324.71875 C 575.253906 326.679688 558.976562 338.914062 551.359375 355.195312 C 551.210938 355.519531 551.074219 355.84375 550.929688 356.167969 C 550.460938 355.296875 550 354.417969 549.5 353.5625 C 538.289062 334.421875 516.644531 326.582031 495.171875 328.632812 C 456.214844 332.355469 428.496094 365.664062 429.425781 402.929688 L 376.089844 402.929688 C 340.652344 402.929688 311.925781 431.660156 311.925781 467.09375 C 311.925781 497.828125 333.699219 524.222656 363.855469 530.144531 C 386.542969 534.597656 409.207031 539.703125 431.207031 541.632812 C 470.019531 545.039062 491.863281 519.863281 524.886719 507.222656 C 554.234375 495.992188 585.917969 494.460938 612.328125 508.113281 C 616.191406 510.113281 614.082031 515.9375 609.816406 515.078125 C 579.984375 509.046875 553.902344 520.203125 526.445312 541.355469 C 484.707031 573.503906 476.902344 599.941406 417.648438 613.125 C 408.089844 615.253906 398.414062 616.972656 388.679688 618.511719 C 369.550781 618.671875 339.527344 620.273438 337.332031 643.148438 C 335.066406 666.742188 356.675781 676.75 376.058594 681.066406 C 399.160156 686.210938 423.71875 685.359375 446.300781 678.179688 C 460.238281 673.746094 470.859375 666.742188 479.578125 656.96875 C 482.753906 653.410156 486.25 650.15625 489.835938 647.003906 C 497.109375 640.613281 504.195312 632.921875 511.375 624.96875 C 511.3125 629 511.25 633.042969 511.183594 637.039062 C 510.6875 667.0625 510.179688 698.113281 511.296875 728.550781 C 511.332031 729.5625 511.339844 730.664062 511.347656 731.816406 C 511.386719 738.871094 511.4375 748.527344 519.035156 751.53125 C 526.300781 754.402344 544.078125 755.328125 557.171875 755.328125 C 561.96875 755.328125 566.136719 755.203125 568.933594 755.003906 C 577.652344 754.390625 598.292969 752.195312 601.625 745.15625 C 602.238281 743.863281 602.589844 741.789062 600.792969 739.25 C 598.71875 736.320312 590.195312 733.773438 572.289062 730.726562 L 571.132812 730.53125 C 569.894531 730.316406 568.167969 730.25 566.167969 730.171875 C 562.636719 730.03125 556.160156 729.777344 555.144531 728.09375 L 552.851562 585.398438 C 559.894531 580.773438 567.371094 577.292969 575.421875 575.503906 C 575.863281 576.738281 576.289062 577.910156 576.6875 578.988281 C 585.363281 602.402344 593.355469 626.589844 601.082031 649.984375 C 610.5 678.5 620.238281 707.984375 631.316406 736.359375 C 631.6875 737.300781 632.054688 738.339844 632.4375 739.425781 C 634.800781 746.074219 638.03125 755.175781 646.191406 755.511719 C 646.429688 755.519531 646.675781 755.523438 646.933594 755.523438 C 658.105469 755.523438 685.070312 746.402344 694.453125 742.367188 C 702.480469 738.90625 721.253906 730.03125 722.078125 722.296875 C 722.230469 720.875 721.878906 718.800781 719.34375 716.992188 C 716.421875 714.914062 707.53125 715.308594 689.609375 718.335938 L 688.46875 718.527344 C 687.230469 718.734375 685.578125 719.238281 683.664062 719.820312 C 680.523438 720.78125 674.097656 722.746094 672.570312 721.488281 L 621.75 582.933594 C 640.808594 591.925781 658.105469 605.78125 675.289062 614.886719 C 676.058594 615.296875 676.832031 615.6875 677.597656 616.0625"
function StampyIcon({ size = 32, color = '#E46C31' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="300 310 480 455" style={{ flexShrink: 0 }}>
      <path d={STAMPY_PATH} fill={color} />
    </svg>
  )
}

// ─── QR code ──────────────────────────────────────────────────────────────────
function QRCode({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 21 21" fill="none">
      <rect x="0" y="0" width="7" height="7" fill="#000"/><rect x="1" y="1" width="5" height="5" fill="#fff"/><rect x="2" y="2" width="3" height="3" fill="#000"/>
      <rect x="14" y="0" width="7" height="7" fill="#000"/><rect x="15" y="1" width="5" height="5" fill="#fff"/><rect x="16" y="2" width="3" height="3" fill="#000"/>
      <rect x="0" y="14" width="7" height="7" fill="#000"/><rect x="1" y="15" width="5" height="5" fill="#fff"/><rect x="2" y="16" width="3" height="3" fill="#000"/>
      <rect x="9" y="0" width="1" height="1" fill="#000"/><rect x="11" y="1" width="2" height="1" fill="#000"/>
      <rect x="8" y="8" width="2" height="4" fill="#000"/><rect x="11" y="8" width="3" height="1" fill="#000"/>
      <rect x="9" y="13" width="3" height="1" fill="#000"/><rect x="9" y="15" width="1" height="3" fill="#000"/>
      <rect x="11" y="15" width="2" height="2" fill="#000"/><rect x="15" y="15" width="4" height="1" fill="#000"/>
      <rect x="14" y="17" width="3" height="1" fill="#000"/><rect x="18" y="16" width="2" height="2" fill="#000"/>
    </svg>
  )
}

// ─── Wallet pass preview (Apple style, same as Design tab) ────────────────────
function WalletPass({ state }: { state: OBState }) {
  const stamps = Array.from({ length: state.stampsRequired }, (_: unknown, i: number) => i < 3)
  const rewardLabel = state.rewardMode === 'customer' ? 'Lo que el cliente elija' : (state.rewardValue || 'Premio')

  return (
    <div style={{ width: '100%', maxWidth: 300, margin: '0 auto', borderRadius: 20, overflow: 'hidden', boxShadow: '0 20px 60px rgba(43,38,32,.25)', background: `linear-gradient(170deg, ${state.brandColor}, ${darken(state.brandColor)})` }}>
      {/* Top */}
      <div style={{ padding: '22px 22px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          {state.brandLogo
            ? <img src={state.brandLogo} style={{ maxHeight: 36, maxWidth: 140, objectFit: 'contain' }} alt="" />
            : <div style={{ fontWeight: 800, fontSize: 20, color: '#fff', letterSpacing: '-.01em' }}>{state.businessName || 'Tu negocio'}</div>
          }
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,.55)', textTransform: 'uppercase', letterSpacing: '.06em' }}>TITULAR</div>
          <div style={{ fontSize: 13, color: '#fff', fontWeight: 600, marginTop: 2 }}>Tu cliente</div>
        </div>
      </div>

      {/* Primary value */}
      <div style={{ padding: '4px 22px 12px' }}>
        <div style={{ fontSize: 8, color: 'rgba(255,255,255,.55)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>
          {state.cardType === 'stamp' ? 'PROGRESO' : state.cardType === 'points' ? 'PUNTOS' : 'NIVEL'}
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
          {state.cardType === 'stamp' ? `3 / ${state.stampsRequired}` : state.cardType === 'points' ? '120 pts' : 'Silver'}
        </div>
      </div>

      {/* Card-type content */}
      {state.cardType === 'stamp' && (
        <div style={{ padding: '4px 22px 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {stamps.map((filled: boolean, i: number) => (
            <div key={i} style={{ width: 24, height: 24, borderRadius: '50%', background: filled ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.18)', border: filled ? 'none' : '1.5px dashed rgba(255,255,255,.4)' }} />
          ))}
        </div>
      )}
      {state.cardType === 'points' && (
        <div style={{ padding: '4px 22px 16px' }}>
          <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,.2)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: '24%', height: '100%', background: 'rgba(255,255,255,.85)', borderRadius: 3 }} />
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.55)', marginTop: 6 }}>480 pts para el próximo premio</div>
        </div>
      )}
      {state.cardType === 'membership' && (
        <div style={{ padding: '4px 22px 16px', display: 'flex', gap: 6 }}>
          {['Bronze','Silver','Gold','Black'].map((t, i) => (
            <div key={t} style={{ fontSize: 9, padding: '4px 10px', borderRadius: 20, background: i === 1 ? 'rgba(255,255,255,.88)' : 'rgba(255,255,255,.16)', color: i === 1 ? '#2B2620' : 'rgba(255,255,255,.7)', fontWeight: 700 }}>{t}</div>
          ))}
        </div>
      )}

      {/* Secondary fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '10px 22px', background: 'rgba(0,0,0,.18)' }}>
        <div>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
            {state.cardType === 'membership' ? 'NIVEL ACTUAL' : state.cardType === 'points' ? 'ACUMULADO' : 'PREMIO'}
          </div>
          <div style={{ fontSize: 12, color: '#fff', fontWeight: 600, marginTop: 3 }}>
            {state.cardType === 'stamp' ? rewardLabel : state.cardType === 'points' ? '120 pts' : 'Silver'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: '.06em' }}>VISITAS</div>
          <div style={{ fontSize: 12, color: '#fff', fontWeight: 600, marginTop: 3 }}>12</div>
        </div>
      </div>

      {/* QR */}
      <div style={{ background: '#fff', padding: '18px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <QRCode size={90} />
        <div style={{ fontSize: 10, color: '#aaa' }}>Powered by Stampa</div>
      </div>
    </div>
  )
}

// ─── Google Pass ──────────────────────────────────────────────────────────────
function GooglePass({ state }: { state: OBState }) {
  const stamps = Array.from({ length: state.stampsRequired }, (_: unknown, i: number) => i < 3)
  return (
    <div style={{ width: '100%', maxWidth: 300, margin: '0 auto', borderRadius: 18, overflow: 'hidden', boxShadow: '0 20px 60px rgba(43,38,32,.25)', background: '#fff' }}>
      <div style={{ height: 100, background: `linear-gradient(135deg, ${state.brandColor}, ${darken(state.brandColor)})`, padding: '14px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,.3)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.8)', fontWeight: 500 }}>{state.businessName || 'Tu negocio'}</span>
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>
          {state.cardType === 'stamp' ? `3 de ${state.stampsRequired} sellos` : state.cardType === 'points' ? '120 pts' : 'Silver'}
        </div>
      </div>
      <div style={{ padding: '16px 18px' }}>
        {state.cardType === 'stamp' && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {stamps.map((f: boolean, i: number) => (
              <div key={i} style={{ width: 22, height: 22, borderRadius: '50%', background: f ? '#e8f0fe' : '#f1f3f4', border: f ? '1.5px solid #1a73e8' : '1.5px dashed #c4c7c5' }} />
            ))}
          </div>
        )}
        <div style={{ borderTop: '1px solid #e8eaed', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
          <div><div style={{ fontSize: 10, color: '#5f6368' }}>Titular</div><div style={{ color: '#202124', fontWeight: 500 }}>Tu cliente</div></div>
          <div><div style={{ fontSize: 10, color: '#5f6368' }}>Visitas</div><div style={{ color: '#202124', fontWeight: 500 }}>12</div></div>
        </div>
      </div>
      <div style={{ padding: '12px 18px', borderTop: '1px solid #e8eaed', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <QRCode size={60} />
        <div style={{ fontSize: 9, color: '#5f6368' }}>Powered by Stampa</div>
      </div>
    </div>
  )
}

// ─── Nav buttons ──────────────────────────────────────────────────────────────
function Nav({ onBack, onNext, nextLabel = 'Siguiente', disabled = false, showSkip = false, onSkip }: {
  onBack: () => void; onNext: () => void; nextLabel?: string; disabled?: boolean; showSkip?: boolean; onSkip?: () => void
}) {
  return (
    <div className="ob-nav">
      <button className="ob-btn-back" onClick={onBack}>
        <IcoArrowL /> Atrás
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {showSkip && <button className="ob-btn-skip" onClick={onSkip}>Saltear</button>}
        <button className="ob-btn-next" onClick={onNext} disabled={disabled}>
          {nextLabel} <IcoArrowR />
        </button>
      </div>
    </div>
  )
}

// ─── Steps ────────────────────────────────────────────────────────────────────
function Step1({ state, onChange, onNext }: { state: OBState; onChange: (p: Partial<OBState>) => void; onNext: () => void }) {
  return (
    <div className="ob-step">
      <div className="ob-action-label">Empecemos con lo básico</div>
      <input
        className="ob-input"
        placeholder="Nombre del negocio"
        value={state.businessName}
        onChange={e => onChange({ businessName: e.target.value })}
        autoFocus
      />

      <div className="ob-section-label">¿En qué rubro trabajás?</div>
      <div className="ob-sector-grid">
        {SECTORS.map(s => (
          <button key={s.id}
            className={`ob-sector-btn${state.sector === s.id ? ' ob-sector-btn--on' : ''}`}
            onClick={() => onChange({ sector: s.id, cardType: SECTOR_CARD[s.id], stampsRequired: SECTOR_STAMPS[s.id] || 8 })}
          >
            <span className="ob-sector-icon">{s.icon}</span>
            <span className="ob-sector-label">{s.label}</span>
            {state.sector === s.id && <span className="ob-sector-check"><IcoCheck /></span>}
          </button>
        ))}
      </div>

      <div className="ob-nav" style={{ marginTop: 28 }}>
        <div />
        <button className="ob-btn-next" onClick={onNext} disabled={!state.businessName.trim() || !state.sector}>
          Siguiente <IcoArrowR />
        </button>
      </div>
    </div>
  )
}

function Step2({ state, onChange, onNext, onBack }: { state: OBState; onChange: (p: Partial<OBState>) => void; onNext: () => void; onBack: () => void }) {
  const recommendedType = SECTOR_CARD[state.sector] || 'stamp'
  const sectorLabel = SECTORS.find(s => s.id === state.sector)?.label || ''

  const CARD_TYPES: Array<{ id: CardType; name: string; desc: string; reason: string }> = [
    { id: 'stamp',      name: 'Tarjeta de sellos',   desc: 'Sellos por visita · Premio al completar', reason: 'Ideal para negocios de consumo frecuente. Simple y efectivo.' },
    { id: 'points',     name: 'Puntos por visita',   desc: 'Puntos acumulables · Catálogo de premios', reason: 'Perfecto cuando tenés múltiples servicios o distintos precios.' },
    { id: 'membership', name: 'Membresía por niveles', desc: 'Bronze → Silver → Gold → Black', reason: 'Genera exclusividad. Tus mejores clientes sienten que progresan.' },
  ]

  return (
    <div className="ob-step">
      <div className="ob-action-label">Elegí el que mejor se adapta a tu negocio</div>
      <div className="ob-card-types">
        {CARD_TYPES.map(ct => {
          const isRec = ct.id === recommendedType
          const isOn  = state.cardType === ct.id
          return (
            <button key={ct.id}
              className={`ob-type-card${isOn ? ' ob-type-card--on' : ''}${isRec ? ' ob-type-card--rec' : ''}`}
              onClick={() => onChange({ cardType: ct.id })}
            >
              <div className="ob-type-left">
                <div className="ob-type-name">{ct.name}</div>
                <div className="ob-type-desc">{ct.desc}</div>
                {isRec && <div className="ob-type-rec-note">{ct.reason}</div>}
              </div>
              <div className="ob-type-right">
                {isRec && <div className="ob-rec-badge">Recomendado para {sectorLabel}</div>}
                <div className={`ob-radio${isOn ? ' ob-radio--on' : ''}`}>
                  {isOn && <div className="ob-radio-dot" />}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <Nav onBack={onBack} onNext={onNext} />
    </div>
  )
}

function Step3({ state, onChange, onNext, onBack }: { state: OBState; onChange: (p: Partial<OBState>) => void; onNext: () => void; onBack: () => void }) {
  const titles: Record<CardType, string> = {
    stamp:      '¿Cuántas visitas para completar la tarjeta?',
    points:     '¿Cuántos puntos suma el cliente por visita?',
    membership: 'Tu programa tiene 4 niveles de membresía',
  }
  const subs: Record<CardType, string> = {
    stamp:      'Es la cantidad de visitas necesarias para que el cliente gane su premio.',
    points:     'Cada vez que el scanner registra la visita, el cliente acumula estos puntos.',
    membership: 'Los clientes suben de nivel a medida que acumulan visitas. Podés editar los beneficios desde la sección Premios.',
  }
  const actionLabels: Record<CardType, string> = {
    stamp: 'Elegí la cantidad de visitas para completar la tarjeta',
    points: 'Definí cuántos puntos suma cada visita',
    membership: 'Tu programa tiene 4 niveles automáticos',
  }
  return (
    <div className="ob-step">
      <div className="ob-action-label">{actionLabels[state.cardType]}</div>
      {state.cardType === 'stamp' && (
        <>
          <div className="ob-stamp-grid">
            {[4,6,8,10,12].map(n => (
              <button key={n} className={`ob-stamp-btn${state.stampsRequired === n ? ' ob-stamp-btn--on' : ''}`}
                onClick={() => onChange({ stampsRequired: n })}>
                <span className="ob-stamp-num">{n}</span>
                <span className="ob-stamp-sub">visitas</span>
              </button>
            ))}
          </div>
          <div className="ob-hint"><StampyIcon size={24} />La mayoría elige entre 6 y 8 visitas.</div>
        </>
      )}

      {state.cardType === 'points' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <input type="number" className="ob-pts-input" min={1} max={1000}
              value={state.pointsPerVisit} onChange={e => onChange({ pointsPerVisit: Number(e.target.value) })} />
            <span className="ob-pts-lbl">puntos por visita</span>
          </div>
          <div className="ob-hint"><StampyIcon size={24} />Los premios y sus umbrales los configurás desde la sección Premios del dashboard.</div>
        </>
      )}

      {state.cardType === 'membership' && (
        <div className="ob-tiers">
          {[
            { name: 'Bronze', threshold: 0,  color: '#854F0B', bg: '#FAEEDA' },
            { name: 'Silver', threshold: 10, color: '#444441', bg: '#EAEAEA' },
            { name: 'Gold',   threshold: 25, color: '#633806', bg: '#FAC775' },
            { name: 'Black',  threshold: 50, color: '#F7F0E4', bg: '#1A1A18' },
          ].map(t => (
            <div key={t.name} className="ob-tier-row">
              <div className="ob-tier-badge" style={{ background: t.bg, color: t.color }}>★ {t.name}</div>
              <div className="ob-tier-info">
                <span className="ob-tier-name">{t.name}</span>
                <span className="ob-tier-threshold">{t.threshold === 0 ? 'Nivel inicial · automático' : `Desde ${t.threshold} visitas`}</span>
              </div>
            </div>
          ))}
          <div className="ob-hint"><StampyIcon size={24} />Editá nombres y beneficios desde la sección Premios.</div>
        </div>
      )}

      <Nav onBack={onBack} onNext={onNext} />
    </div>
  )
}

function Step4({ state, onChange, onNext, onBack }: { state: OBState; onChange: (p: Partial<OBState>) => void; onNext: () => void; onBack: () => void }) {
  // Membership: skip automatically (no prize to define)
  // Points: brief note
  if (state.cardType === 'membership') {
    return (
      <div className="ob-step">
        <div className="ob-action-label">Los beneficios van con cada nivel</div>
        <div className="ob-info-box">
          <StampyIcon size={40} />
          <span>Bronze: bienvenida · Silver: 5% dto · Gold: regalo de cumpleaños · Black: beneficios exclusivos</span>
        </div>
        <Nav onBack={onBack} onNext={onNext} nextLabel="Entendido, seguir" />
      </div>
    )
  }

  if (state.cardType === 'points') {
    return (
      <div className="ob-step">
        <div className="ob-action-label">Los premios se configuran desde el dashboard</div>
        <div className="ob-info-box">
          <StampyIcon size={40} />
          <span>Ej: Clase gratis (500 pts) · Mes de descuento (1200 pts) · Producto gratis (800 pts)</span>
        </div>
        <Nav onBack={onBack} onNext={onNext} nextLabel="Entendido, seguir" />
      </div>
    )
  }

  // Stamp: full prize config
  return (
    <div className="ob-step">
      <div className="ob-action-label">Al completar las {state.stampsRequired} visitas, ¿qué recibe el cliente?</div>
      <div className="ob-reward-opts">
        <div className={`ob-reward-opt${state.rewardMode === 'customer' ? ' ob-reward-opt--on' : ''}`}
          onClick={() => onChange({ rewardMode: 'customer' })}>
          <div className={`ob-radio${state.rewardMode === 'customer' ? ' ob-radio--on' : ''}`}>
            {state.rewardMode === 'customer' && <div className="ob-radio-dot" />}
          </div>
          <div>
            <div className="ob-reward-title">El cliente elige su premio</div>
            <div className="ob-reward-desc">Al registrarse, el cliente completa un campo con lo que quiere como premio. El scanner ve esa respuesta al momento del canje. Cada cliente tiene su propio premio.</div>
          </div>
        </div>
        <div className={`ob-reward-opt${state.rewardMode === 'fixed' ? ' ob-reward-opt--on' : ''}`}
          onClick={() => onChange({ rewardMode: 'fixed' })}>
          <div className={`ob-radio${state.rewardMode === 'fixed' ? ' ob-radio--on' : ''}`}>
            {state.rewardMode === 'fixed' && <div className="ob-radio-dot" />}
          </div>
          <div>
            <div className="ob-reward-title">Yo defino el premio</div>
            <div className="ob-reward-desc">El mismo premio para todos los clientes.</div>
          </div>
        </div>
      </div>

      {state.rewardMode === 'fixed' && (
        <input className="ob-input" style={{ marginTop: 12 }}
          placeholder="Ej: Café gratis, 10% de descuento..."
          value={state.rewardValue} onChange={e => onChange({ rewardValue: e.target.value })} />
      )}

      <Nav onBack={onBack} onNext={onNext}
        disabled={state.rewardMode === 'fixed' && !state.rewardValue.trim()} />
    </div>
  )
}

function Step5({ state, onChange, onNext, onBack }: { state: OBState; onChange: (p: Partial<OBState>) => void; onNext: () => void; onBack: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const r = new FileReader()
    r.onload = ev => onChange({ brandLogo: ev.target?.result as string })
    r.readAsDataURL(file)
  }
  return (
    <div className="ob-step">
      <div className="ob-action-label">El logo y el color aparecen en la tarjeta digital</div>
      <div className="ob-brand-row">
        <div>
          <div className="ob-brand-label">Logo del negocio</div>
          <div className="ob-logo-zone" onClick={() => fileRef.current?.click()}>
            {state.brandLogo
              ? <img src={state.brandLogo} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }} alt="" />
              : <>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(43,38,32,.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <span className="ob-logo-hint">Subir logo</span>
                </>
            }
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
          </div>
          {state.brandLogo && <button className="ob-logo-remove" onClick={() => onChange({ brandLogo: null })}>Quitar</button>}
        </div>

        <div style={{ flex: 1 }}>
          <div className="ob-brand-label">Color de la tarjeta</div>
          <div className="ob-color-row">
            {PRESET_COLORS.map(c => (
              <button key={c} className={`ob-color-dot${state.brandColor === c ? ' ob-color-dot--on' : ''}`}
                style={{ background: c }} onClick={() => onChange({ brandColor: c })} />
            ))}
          </div>
          <div className="ob-hint" style={{ marginTop: 16 }}><StampyIcon size={26} />8 colores incluidos en tu plan. Colores personalizados están disponibles en Pro y Enterprise.</div>
        </div>
      </div>

      <Nav onBack={onBack} onNext={onNext} nextLabel="Ver mi tarjeta" showSkip onSkip={onNext} />
    </div>
  )
}

function Step6({ state, onBack, onFinish }: { state: OBState; onBack: () => void; onFinish: () => void }) {
  const [platform, setPlatform] = useState<'apple' | 'google'>('apple')
  const sectorLabel = SECTORS.find(s => s.id === state.sector)?.label || ''

  return (
    <div className="ob-step ob-step--wide">
      <div className="ob-action-label">Esto es exactamente lo que van a ver tus clientes en su wallet</div>
      <div className="ob-final-layout">
        {/* Pass preview */}
        <div className="ob-final-pass">
          <div className="ob-platform-switch">
            <button className={`ob-platform-btn${platform === 'apple' ? ' ob-platform-btn--on' : ''}`} onClick={() => setPlatform('apple')}>Apple Wallet</button>
            <button className={`ob-platform-btn${platform === 'google' ? ' ob-platform-btn--on' : ''}`} onClick={() => setPlatform('google')}>Google Wallet</button>
          </div>
          {platform === 'apple' ? <WalletPass state={state} /> : <GooglePass state={state} />}
          <div className="ob-preview-note">{platform === 'apple' ? 'Apple Wallet — formato real del pase' : 'Google Wallet — tarjeta Material'}</div>
        </div>

        {/* Summary */}
        <div className="ob-summary">
          <div className="ob-summary-title">Resumen del programa</div>
          {[
            { label: 'Negocio',   val: state.businessName || '—' },
            { label: 'Rubro',     val: sectorLabel || '—' },
            { label: 'Programa',  val: state.cardType === 'stamp' ? `Sellos (${state.stampsRequired} visitas)` : state.cardType === 'points' ? `Puntos (${state.pointsPerVisit} por visita)` : 'Membresía (4 niveles)' },
            { label: 'Premio',    val: state.cardType === 'stamp' ? (state.rewardMode === 'customer' ? 'El cliente elige' : state.rewardValue || '—') : state.cardType === 'points' ? 'Catálogo de premios' : 'Beneficios por nivel' },
          ].map(({ label, val }) => (
            <div key={label} className="ob-summary-row">
              <span className="ob-summary-label">{label}</span>
              <span className="ob-summary-val">{val}</span>
            </div>
          ))}
          <div className="ob-summary-note">Todo esto se puede editar desde el dashboard en cualquier momento.</div>
          <button className="ob-finish-btn" onClick={onFinish}>Ir a mi dashboard →</button>
        </div>
      </div>

      <div className="ob-nav" style={{ marginTop: 28 }}>
        <button className="ob-btn-back" onClick={onBack}><IcoArrowL /> Atrás</button>
        <div />
      </div>
    </div>
  )
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  :root { --font-d: 'Plus Jakarta Sans', sans-serif; --font-b: 'Inter', sans-serif; }
  *,*::before,*::after { box-sizing:border-box; margin:0; padding:0; -webkit-tap-highlight-color:transparent; }
  html, body { max-width:100vw; overflow-x:hidden; }
  body { font-family:var(--font-b); background:#FBF6EE; color:#2B2620; }
  button, a { -webkit-tap-highlight-color:transparent; touch-action:manipulation; }
  button:focus { outline:none; }
  button:focus-visible { outline:2px solid rgba(199,93,58,.35); outline-offset:2px; }
  .ob-shell { min-height:100vh; min-height:100dvh; display:flex; flex-direction:row; max-width:100vw; overflow-x:hidden; }
  /* Left panel */
  .ob-left { width:380px; flex-shrink:0; background:#01231A; display:flex; flex-direction:column; padding:36px 32px; gap:32px; min-height:100vh; position:sticky; top:0; height:100vh; overflow:hidden; }
  .ob-left-logo { display:flex; align-items:center; }
  .ob-dots { display:flex; gap:8px; align-items:center; }
  .ob-dot { width:10px; height:10px; border-radius:50%; background:rgba(247,239,232,.2); transition:all .3s ease; }
  .ob-dot--on { background:#E46C31; width:28px; border-radius:6px; }
  .ob-step-label { font-size:11px; color:rgba(247,239,232,.35); letter-spacing:.06em; margin-top:4px; }
  .ob-left-title { font-family:var(--font-d); font-weight:800; font-size:30px; color:#F7EFE8; line-height:1.2; }
  .ob-left-title em { color:#E46C31; font-style:normal; }
  .ob-left-sub { font-size:14px; color:rgba(247,239,232,.55); line-height:1.7; margin-top:8px; }
  .ob-stampy-tip { background:rgba(247,239,232,.06); border:1px solid rgba(247,239,232,.1); border-radius:16px; padding:18px; display:flex; flex-direction:column; gap:12px; }
  .ob-stampy-head { display:flex; align-items:center; gap:10px; }
  .ob-stampy-name { font-size:12px; font-weight:700; color:rgba(247,239,232,.7); letter-spacing:.04em; }
  .ob-stampy-text { font-size:13px; color:rgba(247,239,232,.55); line-height:1.65; }
  /* Right panel */
  .ob-right { flex:1; display:flex; align-items:center; justify-content:center; padding:52px 40px 40px; min-height:100vh; overflow-y:auto; overflow-x:hidden; position:relative; max-width:100%; }
  .ob-right-inner { width:100%; max-width:540px; display:flex; flex-direction:column; position:relative; z-index:1; }
  .ob-right-inner--wide { max-width:640px; }
  .ob-right::before { content:''; position:absolute; width:500px; height:500px; border-radius:50%; background:rgba(199,93,58,.05); top:-150px; right:-150px; pointer-events:none; }
  .ob-right::after { content:''; position:absolute; width:350px; height:350px; border-radius:50%; background:rgba(1,35,26,.04); bottom:-100px; left:-80px; pointer-events:none; }
  /* Mobile header — hidden on desktop */
  .ob-header { display:none; }
  /* Content */
  .ob-content { flex:1; display:flex; align-items:flex-start; justify-content:center; padding:48px 24px 32px; }
  .ob-step { width:100%; display:flex; flex-direction:column; }
  .ob-action-label { font-family:var(--font-d); font-size:17px; font-weight:800; color:#2B2620; margin-bottom:24px; line-height:1.35; letter-spacing:-.01em; position:relative; padding-bottom:13px; }
  .ob-action-label::after { content:''; position:absolute; left:0; bottom:0; width:34px; height:3px; background:#C75D3A; border-radius:2px; }
  .ob-mobile-step-title { display:none; }
  .ob-mobile-step-title h2 { font-family:var(--font-d); font-weight:800; font-size:24px; color:#2B2620; line-height:1.2; margin-bottom:6px; }
  .ob-mobile-step-title p { font-size:13px; color:rgba(43,38,32,.5); line-height:1.6; margin-bottom:16px; }
  @media (max-width:768px) {
  .ob-mobile-step-title { display:block; padding-bottom:16px; border-bottom:1px solid rgba(43,38,32,.06); margin-bottom:20px; }
    .ob-mobile-dots { display:flex; gap:6px; margin-bottom:16px; }
    .ob-mobile-dot { width:8px; height:8px; border-radius:50%; background:rgba(43,38,32,.15); }
    .ob-mobile-dot--on { background:#C75D3A; width:22px; border-radius:5px; }
}
  /* Nav */
  .ob-nav { display:flex; align-items:center; justify-content:space-between; margin-top:24px; }
  .ob-btn-back { display:flex; align-items:center; gap:6px; background:none; border:1.5px solid rgba(43,38,32,.15); border-radius:10px; padding:11px 20px; font-size:13px; font-weight:600; color:rgba(43,38,32,.55); cursor:pointer; font-family:var(--font-b); transition:all .15s; }
  .ob-btn-back:hover { border-color:rgba(43,38,32,.3); color:#2B2620; }
  .ob-btn-back:disabled { opacity:.4; cursor:default; }
  .ob-btn-next { display:flex; align-items:center; gap:7px; background:#C75D3A; color:#fff; border:none; border-radius:10px; padding:12px 24px; font-size:13.5px; font-weight:700; cursor:pointer; font-family:var(--font-d); transition:background .15s; }
  .ob-btn-next:hover { background:#B14F2F; }
  .ob-btn-next:disabled { opacity:.4; cursor:not-allowed; }
  .ob-btn-skip { background:none; border:none; font-size:12.5px; color:rgba(43,38,32,.4); cursor:pointer; font-family:var(--font-b); }
  .ob-btn-skip:hover { color:rgba(43,38,32,.7); }
  /* Input */
  .ob-input { width:100%; padding:14px 16px; font-size:16px; font-weight:600; border:2px solid rgba(43,38,32,.12); border-radius:12px; background:#fff; color:#2B2620; font-family:var(--font-d); outline:none; transition:border-color .15s; margin-bottom:24px; }
  .ob-input:focus { border-color:#C75D3A; }
  /* Sector */
  .ob-sector-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
  .ob-sector-btn { display:flex; align-items:center; gap:14px; padding:16px 18px; background:#fff; border:2px solid rgba(43,38,32,.1); border-radius:13px; cursor:pointer; transition:all .15s; text-align:left; position:relative; box-shadow:none; }
  .ob-sector-btn:hover { border-color:rgba(43,38,32,.25); background:#FBF6EE; }
  .ob-sector-btn--on { border-color:#C75D3A; background:rgba(199,93,58,.07); }
  .ob-sector-icon { color:rgba(43,38,32,.5); flex-shrink:0; }
  .ob-sector-btn--on .ob-sector-icon { color:#C75D3A; }
  .ob-sector-label { font-size:12.5px; font-weight:600; color:#2B2620; line-height:1.3; }
  .ob-sector-check { position:absolute; top:-9px; right:-9px; width:22px; height:22px; border-radius:50%; background:#C75D3A; display:flex; align-items:center; justify-content:center; color:#fff; border:2.5px solid #FBF6EE; }
  /* Card types */
  .ob-card-types { display:flex; flex-direction:column; gap:10px; }
  .ob-type-card { display:flex; align-items:flex-start; justify-content:space-between; gap:14px; padding:16px 18px; background:#fff; border:2px solid rgba(43,38,32,.1); border-radius:14px; cursor:pointer; transition:all .15s; text-align:left; }
  .ob-type-card:hover { border-color:rgba(43,38,32,.25); }
  .ob-type-card--on { border-color:#C75D3A; background:rgba(199,93,58,.05); }
  .ob-type-card--rec { border-color:#C75D3A; }
  .ob-type-name { font-size:15px; font-weight:700; color:#2B2620; margin-bottom:4px; }
  .ob-type-desc { font-size:12px; color:rgba(43,38,32,.5); }
  .ob-type-rec-note { font-size:12px; color:rgba(43,38,32,.65); margin-top:6px; line-height:1.5; }
  .ob-type-right { display:flex; flex-direction:column; align-items:flex-end; gap:10px; flex-shrink:0; }
  .ob-rec-badge { font-size:9.5px; font-weight:700; background:#C75D3A; color:#fff; padding:3px 10px; border-radius:20px; white-space:nowrap; }
  .ob-radio { width:20px; height:20px; border-radius:50%; border:2px solid rgba(43,38,32,.2); flex-shrink:0; display:flex; align-items:center; justify-content:center; margin-top:2px; }
  .ob-radio--on { border-color:#C75D3A; }
  .ob-radio-dot { width:10px; height:10px; border-radius:50%; background:#C75D3A; }
  /* Stamps */
  .ob-stamp-grid { display:flex; gap:10px; flex-wrap:wrap; }
  .ob-stamp-btn { display:flex; flex-direction:column; align-items:center; gap:4px; width:76px; padding:14px 0; background:#fff; border:2px solid rgba(43,38,32,.12); border-radius:14px; cursor:pointer; transition:all .15s; font-family:var(--font-d); }
  .ob-stamp-btn:hover { border-color:rgba(43,38,32,.3); }
  .ob-stamp-btn--on { border-color:#C75D3A; background:#C75D3A; color:#fff; }
  .ob-stamp-num { font-size:26px; font-weight:800; }
  .ob-stamp-sub { font-size:9px; opacity:.7; }
  .ob-hint { display:flex; align-items:center; gap:10px; font-size:12.5px; color:rgba(43,38,32,.55); margin-top:12px; background:rgba(43,38,32,.045); padding:11px 16px; border-radius:11px; line-height:1.5; }
  /* Points */
  .ob-pts-input { width:88px; padding:10px; font-size:24px; font-weight:800; text-align:center; border:2px solid rgba(43,38,32,.12); border-radius:12px; background:#fff; color:#2B2620; font-family:var(--font-d); outline:none; }
  .ob-pts-input:focus { border-color:#C75D3A; }
  .ob-pts-lbl { font-size:15px; color:rgba(43,38,32,.6); }
  /* Tiers */
  .ob-tiers { display:flex; flex-direction:column; gap:8px; }
  .ob-tier-row { display:flex; align-items:center; gap:12px; padding:12px 16px; background:#fff; border:1px solid rgba(43,38,32,.08); border-radius:12px; }
  .ob-tier-badge { font-size:11px; font-weight:700; padding:4px 12px; border-radius:20px; flex-shrink:0; }
  .ob-tier-info { display:flex; flex-direction:column; gap:2px; }
  .ob-tier-name { font-size:13px; font-weight:600; color:#2B2620; }
  .ob-tier-threshold { font-size:11px; color:rgba(43,38,32,.45); }
  /* Info box */
  .ob-info-box { display:flex; align-items:center; gap:14px; padding:16px 18px; background:rgba(199,93,58,.07); border:1px solid rgba(199,93,58,.2); border-radius:14px; font-size:13px; color:rgba(43,38,32,.75); line-height:1.6; }
  /* Reward */
  .ob-reward-opts { display:flex; flex-direction:column; gap:10px; }
  .ob-reward-opt { display:flex; align-items:flex-start; gap:14px; padding:16px 18px; background:#fff; border:2px solid rgba(43,38,32,.1); border-radius:14px; cursor:pointer; transition:all .15s; }
  .ob-reward-opt:hover { border-color:rgba(43,38,32,.25); }
  .ob-reward-opt--on { border-color:#C75D3A; background:rgba(199,93,58,.05); }
  .ob-reward-title { font-size:14px; font-weight:700; color:#2B2620; margin-bottom:4px; }
  .ob-reward-desc { font-size:12px; color:rgba(43,38,32,.55); line-height:1.5; }
  /* Branding */
  .ob-brand-row { display:flex; gap:24px; align-items:flex-start; margin-bottom:8px; }
  .ob-brand-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:rgba(43,38,32,.45); margin-bottom:10px; }
  .ob-logo-zone { width:90px; height:90px; border:2px dashed rgba(43,38,32,.2); border-radius:14px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; cursor:pointer; transition:all .15s; background:#fff; overflow:hidden; }
  .ob-logo-zone:hover { border-color:#C75D3A; }
  .ob-logo-hint { font-size:10px; color:rgba(43,38,32,.4); }
  .ob-logo-remove { font-size:11px; color:#B23B3B; background:none; border:none; cursor:pointer; margin-top:6px; }
  .ob-color-row { display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-bottom:8px; }
  .ob-color-dot { width:32px; height:32px; border-radius:50%; border:2.5px solid transparent; cursor:pointer; transition:all .15s; }
  .ob-color-dot--on { border-color:#2B2620; transform:scale(1.1); }
  /* Final */
  .ob-final-layout { display:flex; gap:32px; align-items:flex-start; flex-wrap:wrap; width:100%; }
  .ob-final-pass { width:300px; max-width:100%; flex-shrink:0; order:2; }
  .ob-summary { order:1; }
  .ob-platform-switch { display:flex; gap:20px; margin-bottom:18px; }
  .ob-platform-btn { font-size:13px; color:rgba(43,38,32,.4); background:none; border:none; cursor:pointer; padding-bottom:6px; border-bottom:2.5px solid transparent; font-family:var(--font-b); transition:all .15s; }
  .ob-platform-btn--on { color:#2B2620; border-bottom-color:#C75D3A; font-weight:600; }
  .ob-preview-note { font-size:11px; color:rgba(43,38,32,.4); text-align:center; margin-top:14px; }
  .ob-summary { background:#fff; border:1px solid rgba(43,38,32,.08); border-radius:16px; padding:22px; min-width:240px; flex:1; box-shadow:0 2px 12px rgba(43,38,32,.06); }
  .ob-summary-title { font-family:var(--font-d); font-weight:700; font-size:15px; color:#2B2620; margin-bottom:14px; }
  .ob-summary-row { display:flex; justify-content:space-between; align-items:flex-start; padding:10px 0; border-bottom:1px solid rgba(43,38,32,.06); gap:16px; }
  .ob-summary-row:last-of-type { border-bottom:none; }
  .ob-summary-label { font-size:12px; color:rgba(43,38,32,.45); flex-shrink:0; }
  .ob-summary-val { font-size:12.5px; font-weight:600; color:#2B2620; text-align:right; }
  .ob-summary-note { font-size:11px; color:rgba(43,38,32,.4); margin-top:14px; padding-top:12px; border-top:1px solid rgba(43,38,32,.07); line-height:1.5; }
  .ob-finish-btn { width:100%; background:#5B8C5A; color:#fff; border:none; border-radius:12px; padding:14px; font-size:14px; font-weight:700; cursor:pointer; font-family:var(--font-d); margin-top:16px; transition:background .15s; }
  .ob-finish-btn:hover { background:#4A7349; }
  @media (max-width:768px) {
    .ob-shell { flex-direction:column; }
    .ob-left { display:none; }
    .ob-header { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; background:#01231A; }
    .ob-right { align-items:flex-start; padding:0; min-height:calc(100dvh - 64px); overflow-x:hidden; }
    .ob-right-inner { max-width:100%; padding:24px 20px calc(40px + env(safe-area-inset-bottom)); }
    .ob-step-title { font-size:22px; }
    .ob-sector-grid { grid-template-columns:repeat(2,1fr); }
    .ob-final-layout { flex-direction:column; width:100%; }
    .ob-final-pass { width:100%; max-width:300px; margin:0 auto; order:1; }
    .ob-summary { order:2; }
    .ob-summary { width:100%; }
    .ob-brand-row { flex-direction:column; }
  }
`

function injectStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById('ob-css')) return
  const s = document.createElement('style')
  s.id = 'ob-css'
  s.textContent = CSS
  document.head.appendChild(s)
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const TOTAL = 6
  const [step, setStep] = useState(1)
  const [state, setState] = useState<OBState>({
    businessName: '', sector: '', cardType: 'stamp',
    stampsRequired: 8, pointsPerVisit: 10,
    rewardMode: 'customer', rewardValue: '',
    brandColor: '#1E3329', brandLogo: null,
  })

  useEffect(() => { injectStyles() }, [])

  function update(patch: Partial<OBState>) { setState(prev => ({ ...prev, ...patch })) }
  function next() { setStep(s => Math.min(s + 1, TOTAL)) }
  function back() { setStep(s => Math.max(s - 1, 1)) }

  const props = { state, onChange: update, onNext: next, onBack: back }

  const STEPS: Record<number, React.ReactNode> = {
    1: <Step1 {...props} />,
    2: <Step2 {...props} />,
    3: <Step3 {...props} />,
    4: <Step4 {...props} />,
    5: <Step5 {...props} />,
    6: <Step6 state={state} onBack={back} onFinish={() => {
      apiOnboarding({
        businessName: state.businessName,
        sector: state.sector,
        cardType: state.cardType,
        stampsRequired: state.stampsRequired,
        pointsPerVisit: state.pointsPerVisit,
        rewardMode: state.rewardMode === 'customer' ? 'dynamic' : 'fixed',
        rewardFixedValue: state.rewardValue || undefined,
        brandColor: state.brandColor,
        brandLogo: state.brandLogo,
      }).then((res) => {
        console.log('Onboarding response:', res)
        console.log('businessId guardado:', localStorage.getItem('stampa_business_id'))
        localStorage.removeItem('stampa_active_tab')
        window.location.href = '/dashboard'
      })
  }} />,
  }

  const info = STEP_INFO[step]

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500&display=swap" rel="stylesheet" />
      <div className="ob-shell">

        {/* Left panel — desktop only */}
        <div className="ob-left">
          {/* Logo */}
          <div className="ob-left-logo">
            <img src="/stampa-mascot.png" alt="Stampy" style={{ width: 72, height: 72, objectFit: 'contain', flexShrink: 0 }} />
            <img src="/stampa-wordmark.png" alt="Stampa" style={{ height: 52, objectFit: 'contain', marginLeft: -18, filter: 'brightness(0) invert(1)' }} />
          </div>

          {/* Progress dots */}
          <div>
            <div className="ob-dots">
              {Array.from({ length: TOTAL }, (_, i) => (
                <div key={i} className={`ob-dot${i + 1 === step ? ' ob-dot--on' : ''}`} />
              ))}
            </div>
            <div className="ob-step-label">PASO {step} DE {TOTAL}</div>
          </div>

          {/* Step title */}
          <div>
            <div className="ob-left-title">{info.title.split(' ').slice(0,-1).join(' ')} <em>{info.title.split(' ').slice(-1)}</em></div>
            <div className="ob-left-sub">{info.subtitle}</div>
          </div>

          {/* Stampy tip — moved up, bigger mascot */}
          <div className="ob-stampy-tip">
            <div className="ob-stampy-head">
              <img src="/stampa-mascot.png" alt="Stampy" style={{ width: 60, height: 60, objectFit: 'contain' }} />
              <span className="ob-stampy-name">Tip de Stampy</span>
            </div>
            <div className="ob-stampy-text">{info.tip}</div>
          </div>
          
          <div style={{flex:1}} />
        </div>

        {/* Mobile header */}
        <div className="ob-header">
          <div className="ob-left-logo">
            <img src="/stampa-mascot.png" alt="Stampy" style={{ width: 40, height: 40, objectFit: 'contain' }} />
            <img src="/stampa-wordmark.png" alt="Stampa" style={{ height: 28, objectFit: 'contain', marginLeft: -10, filter: 'brightness(0) invert(1)' }} />
          </div>
        </div>

        {/* Right panel — form */}
        <div className="ob-right">
          <div className={`ob-right-inner${step === 6 ? ' ob-right-inner--wide' : ''}`}>
            {/* Mobile step title + dots — hidden on desktop */}
            <div className="ob-mobile-step-title">
              <div className="ob-mobile-dots">
                {Array.from({ length: TOTAL }, (_, i) => (
                  <div key={i} className={`ob-mobile-dot${i + 1 === step ? ' ob-mobile-dot--on' : ''}`} />
                ))}
              </div>
              <h2>{info.title}</h2>
              <p>{info.subtitle}</p>
            </div>
            {STEPS[step]}
          </div>
        </div>
      </div>
    </>
  )
}