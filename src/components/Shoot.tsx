import { useCallback, useEffect, useRef, useState } from 'react'
import type { FrameDef } from '../frames'
import { useCamera } from '../lib/camera'
import { composeFrame } from '../lib/compose'
import { EFFECTS, applyEffect, type EffectId } from '../lib/effects'
import { useHandTrigger } from '../lib/gesture'
import EffectPicker from './EffectPicker'
import { DATE_LOCALE, useI18n } from '../lib/i18n'

const COUNTDOWN = 3
const BETWEEN_SHOTS_MS = 2000
const READY_IDLE_MS = 60_000
const GESTURE_KEY = 'senara.gesture'
/** Keys sent by keyboards and presentation clickers. */
const TRIGGER_KEYS = new Set([' ', 'Enter', 'PageDown', 'PageUp', 'ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'b', '.'])

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

interface Props {
  frame: FrameDef
  effect: EffectId
  seed: number
  onEffect: (id: EffectId) => void
  onCancel: () => void
  onDone: (photos: HTMLCanvasElement[]) => void
}

export default function Shoot({ frame, effect, seed, onEffect, onCancel, onDone }: Props) {
  const { t, lang } = useI18n()
  const { videoRef, ready, error, capture } = useCamera(true)
  const [phase, setPhase] = useState<'ready' | 'shooting'>('ready')
  const [count, setCount] = useState<number | null>(null)
  const [between, setBetween] = useState(false)
  const [flash, setFlash] = useState(false)
  const [photos, setPhotos] = useState<HTMLCanvasElement[]>([])
  const [framePreview, setFramePreview] = useState<string | null>(null)
  const [gestureOn, setGestureOn] = useState(() => localStorage.getItem(GESTURE_KEY) !== 'off')
  const [lastActivity, setLastActivity] = useState(() => Date.now())
  const cancelled = useRef(false)

  const bump = () => setLastActivity(Date.now())

  const start = useCallback(async () => {
    if (!ready || phase !== 'ready') return
    setPhase('shooting')
    cancelled.current = false
    const shots: HTMLCanvasElement[] = []
    for (let i = 0; i < frame.shots; i++) {
      for (let n = COUNTDOWN; n > 0; n--) {
        if (cancelled.current) return
        setCount(n)
        await wait(1000)
      }
      if (cancelled.current) return
      setCount(null)
      const c = capture(true)
      shots.push(c)
      setPhotos([...shots])
      setFlash(true)
      await wait(350)
      setFlash(false)
      if (i < frame.shots - 1) {
        setBetween(true)
        await wait(BETWEEN_SHOTS_MS)
        setBetween(false)
      } else {
        await wait(400)
      }
    }
    if (!cancelled.current) onDone(shots)
  }, [ready, phase, frame.shots, capture, onDone])

  useEffect(() => () => void (cancelled.current = true), [])

  const { status: gestureStatus, progress } = useHandTrigger(videoRef, gestureOn && ready && phase === 'ready', start)

  // keyboard / clicker
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.key === 'Escape') return onCancel()
      if (TRIGGER_KEYS.has(e.key)) {
        e.preventDefault()
        bump()
        start()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [start, onCancel])

  // go back home if nobody is using the booth
  useEffect(() => {
    if (phase !== 'ready') return
    const t = setTimeout(onCancel, Math.max(0, lastActivity + READY_IDLE_MS - Date.now()))
    return () => clearTimeout(t)
  }, [phase, lastActivity, onCancel])
  useEffect(() => {
    if (progress > 0) bump()
  }, [progress])

  // live mini preview of the frame, filled as photos come in
  useEffect(() => {
    let alive = true
    const small = photos.map((p) => {
      const s = 480 / Math.max(p.width, p.height)
      const c = document.createElement('canvas')
      c.width = Math.round(p.width * s)
      c.height = Math.round(p.height * s)
      c.getContext('2d')!.drawImage(p, 0, 0, c.width, c.height)
      return applyEffect(c, effect)
    })
    composeFrame(frame, small, { scale: 420 / frame.h, seed, locale: DATE_LOCALE[lang] }).then(
      (c) => alive && setFramePreview(c.toDataURL('image/jpeg', 0.85)),
    )
    return () => {
      alive = false
    }
  }, [frame, photos, effect, seed, lang])

  const toggleGesture = () => {
    const next = !gestureOn
    setGestureOn(next)
    localStorage.setItem(GESTURE_KEY, next ? 'on' : 'off')
  }

  const slot = frame.slots[Math.min(photos.length, frame.slots.length - 1)]
  const shooting = phase === 'shooting'

  return (
    <main className="shoot" onPointerDown={bump}>
      {/* left: how-to */}
      <aside className="shoot-side shoot-guide">
        <h2>{t('shoot.howTo')}</h2>
        <ol className="guide-steps">
          <li className={!shooting ? 'is-active' : ''}>
            <span className="guide-num">1</span>
            <div>
              <b>{t('shoot.step1')}</b>
              <small>{t('shoot.step1Hint')}</small>
            </div>
          </li>
          <li className={!shooting ? 'is-active' : ''}>
            <span className="guide-num">2</span>
            <div>
              <b>{t('shoot.step2')}</b>
              <small>{t('shoot.step2Hint')}</small>
            </div>
          </li>
          <li className={shooting ? 'is-active' : ''}>
            <span className="guide-num">3</span>
            <div>
              <b>{t('shoot.step3', { n: frame.shots })}</b>
              <small>{t('shoot.step3Hint', { s: COUNTDOWN })}</small>
            </div>
          </li>
        </ol>

        <div className={`palm ${progress > 0 ? 'is-detecting' : ''}`} style={{ ['--p' as string]: progress }}>
          <span>🖐️</span>
        </div>
        <button className="gesture-toggle" onClick={toggleGesture} disabled={shooting}>
          {t('shoot.gesture')}: <b>{gestureOn ? 'ON' : 'OFF'}</b>
          {gestureOn && gestureStatus === 'loading' && <small>{t('shoot.gestureLoading')}</small>}
          {gestureOn && gestureStatus === 'error' && <small>{t('shoot.gestureError')}</small>}
        </button>
      </aside>

      {/* center: camera */}
      <section className="shoot-center">
        <div className="viewfinder" style={{ ['--ar' as string]: slot.w / slot.h }}>
          <video
            ref={videoRef}
            playsInline
            muted
            className="video"
            style={{ filter: EFFECTS.find((e) => e.id === effect)?.css }}
          />
          {count !== null && <div className="countdown" key={`${photos.length}-${count}`}>{count}</div>}
          {between && <div className="between-msg">{t('shoot.next', { n: photos.length + 1 })}</div>}
          {!shooting && ready && (
            <div className="ready-msg">
              {progress > 0 ? t('shoot.hold') : gestureOn && gestureStatus === 'ready' ? t('shoot.readyGesture') : t('shoot.readyButton')}
            </div>
          )}
          {flash && <div className="flash" />}
          {!ready && !error && <div className="overlay-msg"><span className="spinner" /> {t('shoot.startingCamera')}</div>}
          {error && (
            <div className="overlay-msg">
              {error === 'denied' ? t('shoot.cameraDenied') : error === 'https' ? t('shoot.cameraHttps') : error}
            </div>
          )}
        </div>
      </section>

      {/* right: frame preview */}
      <aside className="shoot-side shoot-preview">
        <h2>{t(`frame.${frame.id}` as 'frame.strip4')}</h2>
        <div className="mini-frame">{framePreview && <img src={framePreview} alt="" />}</div>
        <p className="shot-count">
          {t('shoot.photoCount')} <b>{Math.min(photos.length + (shooting ? 1 : 0), frame.shots) || 0}</b> / {frame.shots}
        </p>
      </aside>

      {/* bottom bar */}
      <footer className="shoot-bar">
        <button className="btn btn-ghost" onClick={onCancel}>{t('shoot.cancel')}</button>
        <div className={`shoot-effects ${shooting ? 'is-locked' : ''}`}>
          <EffectPicker
            value={effect}
            onChange={(id) => {
              bump()
              onEffect(id)
            }}
            dark
          />
        </div>
        <button
          className="shutter"
          aria-label={t('shoot.shutter')}
          onClick={() => {
            bump()
            start()
          }}
          disabled={!ready || shooting}
        />
      </footer>
    </main>
  )
}
