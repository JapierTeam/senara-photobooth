import { useEffect, useRef, useState, type RefObject } from 'react'
import type { GestureRecognizer } from '@mediapipe/tasks-vision'

/** MediaPipe category name for 🖐️ */
const GESTURE = 'Open_Palm'
const MIN_SCORE = 0.6
const HOLD_MS = 1000
const INTERVAL_MS = 100

export type GestureStatus = 'off' | 'loading' | 'ready' | 'error'

let recognizerPromise: Promise<GestureRecognizer> | null = null

/** Loaded lazily (wasm ~15MB + model ~8MB, self-hosted under /mediapipe) and cached for the session. */
function loadRecognizer() {
  recognizerPromise ??= (async () => {
    const { FilesetResolver, GestureRecognizer } = await import('@mediapipe/tasks-vision')
    const fileset = await FilesetResolver.forVisionTasks('/mediapipe/wasm')
    const create = (delegate: 'GPU' | 'CPU') =>
      GestureRecognizer.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: '/mediapipe/models/gesture_recognizer.task', delegate },
        runningMode: 'VIDEO',
        numHands: 2,
      })
    return create('GPU').catch(() => create('CPU'))
  })().catch((e) => {
    recognizerPromise = null
    throw e
  })
  return recognizerPromise
}

/**
 * Calls `onTrigger` once the open palm has been held for HOLD_MS.
 * `progress` (0..1) drives the on-screen hold indicator.
 */
export function useHandTrigger(videoRef: RefObject<HTMLVideoElement | null>, enabled: boolean, onTrigger: () => void) {
  const [status, setStatus] = useState<GestureStatus>('off')
  const [progress, setProgress] = useState(0)
  const triggerRef = useRef(onTrigger)
  triggerRef.current = onTrigger

  useEffect(() => {
    if (!enabled) {
      setStatus('off')
      setProgress(0)
      return
    }
    let alive = true
    let timer = 0
    let since: number | null = null
    setStatus('loading')

    loadRecognizer()
      .then((rec) => {
        if (!alive) return
        setStatus('ready')
        const tick = () => {
          if (!alive) return
          const v = videoRef.current
          if (v && v.readyState >= 2 && v.videoWidth) {
            const now = performance.now()
            let seen = false
            try {
              const res = rec.recognizeForVideo(v, now)
              seen = res.gestures.some((g) => g[0]?.categoryName === GESTURE && g[0].score >= MIN_SCORE)
            } catch {
              /* skip frame */
            }
            if (seen) {
              since ??= now
              const p = Math.min(1, (now - since) / HOLD_MS)
              setProgress(p)
              if (p >= 1) {
                since = null
                setProgress(0)
                triggerRef.current()
              }
            } else {
              since = null
              setProgress(0)
            }
          }
          timer = window.setTimeout(tick, INTERVAL_MS)
        }
        tick()
      })
      .catch(() => alive && setStatus('error'))

    return () => {
      alive = false
      clearTimeout(timer)
      setProgress(0)
    }
  }, [enabled, videoRef])

  return { status, progress }
}
