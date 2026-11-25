import { useEffect, useRef, useState } from 'react'
import type { FrameDef } from '../frames'
import { useCamera } from '../lib/camera'

const COUNTDOWN = 3
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

interface Props {
  frame: FrameDef
  onCancel: () => void
  onDone: (photos: HTMLCanvasElement[]) => void
}

export default function Shoot({ frame, onCancel, onDone }: Props) {
  const { videoRef, ready, error, capture } = useCamera(true)
  const [count, setCount] = useState<number | null>(null)
  const [flash, setFlash] = useState(false)
  const [shots, setShots] = useState<string[]>([])
  const cancelled = useRef(false)

  useEffect(() => {
    if (!ready) return
    cancelled.current = false
    ;(async () => {
      await wait(800)
      const photos: HTMLCanvasElement[] = []
      for (let i = 0; i < frame.shots; i++) {
        for (let n = COUNTDOWN; n > 0; n--) {
          if (cancelled.current) return
          setCount(n)
          await wait(1000)
        }
        setCount(null)
        const c = capture(true)
        photos.push(c)
        setFlash(true)
        setShots((s) => [...s, c.toDataURL('image/jpeg', 0.5)])
        await wait(350)
        setFlash(false)
        await wait(i < frame.shots - 1 ? 900 : 400)
      }
      if (!cancelled.current) onDone(photos)
    })()
    return () => {
      cancelled.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  const slot = frame.slots[Math.min(shots.length, frame.slots.length - 1)]

  return (
    <main className="shoot">
      <div className="viewfinder" style={{ aspectRatio: `${slot.w} / ${slot.h}` }}>
        <video ref={videoRef} playsInline muted className="video" />
        {count !== null && <div className="countdown" key={count}>{count}</div>}
        {flash && <div className="flash" />}
        {!ready && !error && <div className="overlay-msg"><span className="spinner" /> Menyalakan kamera…</div>}
        {error && <div className="overlay-msg">{error}</div>}
      </div>

      <div className="shoot-bar">
        <button className="btn btn-ghost" onClick={onCancel}>Batal</button>
        <div className="shot-dots">
          {Array.from({ length: frame.shots }, (_, i) => (
            <div key={i} className={`shot-dot ${shots[i] ? 'done' : i === shots.length ? 'current' : ''}`}>
              {shots[i] ? <img src={shots[i]} alt="" /> : i + 1}
            </div>
          ))}
        </div>
        <span className="shoot-label">Foto {Math.min(shots.length + 1, frame.shots)} / {frame.shots}</span>
      </div>
    </main>
  )
}
