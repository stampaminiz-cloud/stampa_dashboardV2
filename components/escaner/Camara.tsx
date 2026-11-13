'use client'
// Cámara del escáner web. Usa qr-scanner (lee con BarcodeDetector donde el
// navegador lo trae y con su propio decodificador donde no, como Safari en
// iPhone). Se carga recién en el navegador: no existe en el servidor.
//
// Después de leer un código se pausa hasta que el padre la vuelva a
// habilitar (paused=false), así no lee el mismo QR diez veces seguidas.
import { useEffect, useRef, useState } from 'react'

type Scanner = { start(): Promise<void>; stop(): void; destroy(): void; hasFlash(): Promise<boolean>; toggleFlash(): Promise<void>; isFlashOn(): boolean }

export function Camara({ onCode, paused }: { onCode: (text: string) => void; paused: boolean }) {
  const video = useRef<HTMLVideoElement>(null)
  const scanner = useRef<Scanner | null>(null)
  const pausedRef = useRef(paused)
  const onCodeRef = useRef(onCode)
  const [state, setState] = useState<'starting' | 'on' | 'denied' | 'none'>('starting')
  const [flash, setFlash] = useState<{ available: boolean; on: boolean }>({ available: false, on: false })
  pausedRef.current = paused
  onCodeRef.current = onCode

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const QrScanner = (await import('qr-scanner')).default
      if (cancelled || !video.current) return
      if (!(await QrScanner.hasCamera())) { setState('none'); return }
      const s = new QrScanner(video.current, r => {
        if (pausedRef.current) return
        pausedRef.current = true
        onCodeRef.current(r.data)
      }, { returnDetailedScanResult: true, preferredCamera: 'environment', maxScansPerSecond: 8, highlightScanRegion: false, highlightCodeOutline: false })
      scanner.current = s as unknown as Scanner
      try {
        await s.start()
        if (cancelled) return
        setState('on')
        setFlash({ available: await s.hasFlash().catch(() => false), on: false })
      } catch {
        if (!cancelled) setState('denied')
      }
    })()
    return () => { cancelled = true; scanner.current?.destroy(); scanner.current = null }
  }, [])

  async function toggleFlash() {
    const s = scanner.current
    if (!s) return
    try { await s.toggleFlash(); setFlash(f => ({ ...f, on: s.isFlashOn() })) } catch { /* algunos celulares no dejan */ }
  }

  return (
    <div className="esc-cam">
      <video ref={video} className="esc-cam-video" muted playsInline />
      {state === 'starting' && <div className="esc-cam-msg">Prendiendo la cámara...</div>}
      {state === 'denied' && (
        <div className="esc-cam-msg">
          <b>No pudimos usar la cámara.</b>
          Tocá &quot;Permitir&quot; en el aviso del navegador (o en el candado de la barra de arriba) y recargá la página. Mientras tanto, usá Buscar.
        </div>
      )}
      {state === 'none' && <div className="esc-cam-msg"><b>Este dispositivo no tiene cámara.</b>Usá Buscar para encontrar al cliente.</div>}
      {state === 'on' && flash.available && (
        <button className="esc-cam-flash" onClick={toggleFlash} aria-pressed={flash.on}>{flash.on ? 'Apagar linterna' : 'Linterna'}</button>
      )}
    </div>
  )
}
