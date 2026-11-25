import { useCallback, useEffect, useRef, useState } from 'react'
import type { FrameDef } from '../frames'
import { useCamera } from '../lib/camera'
import { composeFrame } from '../lib/compose'
import { EFFECTS, applyEffect, type EffectId } from '../lib/effects'
import { useHandTrigger } from '../lib/gesture'
import EffectPicker from './EffectPicker'
import { DATE_LOCALE, POSE_KEYS, useI18n } from '../lib/i18n'
import { isMuted, playPop, playShutter, playTick, setMuted, unlockAudio } from '../lib/sound'

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
  const [pose, setPose] = useState<(typeof POSE_KEYS)[number]>(POSE_KEYS[0])
  const [muted, setMutedState] = useState(isMuted)
  const viewfinderRef = useRef<HTMLDivElement>(null)
  const miniRef = useRef<HTMLDivElement>(null)

  /** Thumbnail flies from the viewfinder into the frame preview on the right. */
  const flyToPreview = (shot: HTMLCanvasElement) => {
    const from = viewfinderRef.current?.getBoundingClientRect()
    const to = miniRef.current?.getBoundingClientRect()
    if (!from || !to || !to.width || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const img = document.createElement('img')
    const thumb = document.createElement('canvas')
    thumb.width = 320
    thumb.height = Math.round((320 * shot.height) / shot.width)
    thumb.getContext('2d')!.drawImage(shot, 0, 0, thumb.width, thumb.height)
    img.src = thumb.toDataURL('image/jpeg', 0.7)
    img.className = 'fly-shot'
    Object.assign(img.style, { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px` })
    document.body.appendChild(img)
    const dx = to.left + to.width / 2 - (from.left + from.width / 2)
    const dy = to.top + to.height / 2 - (from.top + from.height / 2)
    const s = Math.min(to.width / from.width, 0.35)
    img
      .animate(
        [
          { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1 },
          { transform: `translate(${dx * 0.4}px, ${dy * 0.4 - 60}px) scale(${(1 + s) / 2}) rotate(-6deg)`, opacity: 1, offset: 0.45 },
          { transform: `translate(${dx}px, ${dy}px) scale(${s}) rotate(4deg)`, opacity: 0 },
        ],
        { duration: 750, easing: 'cubic-bezier(.5,0,.3,1)' },
      )
      .finished.finally(() => img.remove())
  }

  const bump = () => setLastActivity(Date.now())

  const start = useCallback(async () => {
    if (!ready || phase !== 'ready') return
    unlockAudio()
    setPhase('shooting')
    cancelled.current = false
    const shots: HTMLCanvasElement[] = []
    for (let i = 0; i < frame.shots; i++) {
      for (let n = COUNTDOWN; n > 0; n--) {
        if (cancelled.current) return
        setCount(n)
        playTick(n === 1)
        await wait(1000)
      }
      if (cancelled.current) return
      setCount(null)
      const c = capture(true)
      shots.push(c)
      playShutter()
      setFlash(true)
      flyToPreview(c)
      setTimeout(() => setPhotos([...shots]), 550)
      await wait(350)
      setFlash(false)
      if (i < frame.shots - 1) {
        setPose(POSE_KEYS[Math.floor(Math.random() * POSE_KEYS.length)])
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
        <div ref={viewfinderRef} className={`viewfinder ${count !== null ? 'is-counting' : ''}`} style={{ ['--ar' as string]: slot.w / slot.h }}>
          <video
            ref={videoRef}
            playsInline
            muted
            className="video"
            style={{ filter: EFFECTS.find((e) => e.id === effect)?.css }}
          />
          {count !== null && (
            <div className={`countdown ${count === 1 ? 'is-last' : ''}`} key={`${photos.length}-${count}`}>
              <span className="countdown-ring" />
              {count}
            </div>
          )}
          {between && (
            <div className="between-msg">
              <b>{t(pose)}</b>
              <small>{t('shoot.next', { n: photos.length + 1 })}</small>
            </div>
          )}
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
        <div className="mini-frame" ref={miniRef}>{framePreview && <img src={framePreview} alt="" />}</div>
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
              unlockAudio()
              playPop()
              onEffect(id)
            }}
            dark
          />
        </div>
        <button
          className="sound-toggle"
          aria-label={muted ? 'Unmute' : 'Mute'}
          onClick={() => {
            setMuted(!muted)
            setMutedState(!muted)
          }}
        >
          {muted ? '🔇' : '🔊'}
        </button>
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
