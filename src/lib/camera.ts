import { useEffect, useRef, useState } from 'react'

export function useCamera(active: boolean) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!active) return
    let stream: MediaStream | null = null
    let cancelled = false
    setError(null)
    setReady(false)
    navigator.mediaDevices
      ?.getUserMedia({
        audio: false,
        video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1440 } },
      })
      .then(async (s) => {
        if (cancelled) return s.getTracks().forEach((t) => t.stop())
        stream = s
        const v = videoRef.current
        if (!v) return
        v.srcObject = s
        await v.play().catch(() => undefined)
        setReady(true)
      })
      .catch((e: Error) => setError(e.name === 'NotAllowedError' ? 'denied' : e.message))
    if (!navigator.mediaDevices) setError('https')
    return () => {
      cancelled = true
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [active])

  /** Grab the current video frame. Mirrored to match what guests saw in the preview. */
  const capture = (mirror = true) => {
    const v = videoRef.current!
    const c = document.createElement('canvas')
    c.width = v.videoWidth
    c.height = v.videoHeight
    const ctx = c.getContext('2d')!
    if (mirror) {
      ctx.translate(c.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(v, 0, 0)
    return c
  }

  return { videoRef, ready, error, capture }
}

/** Keep the kiosk screen awake while the app is open. */
export function useWakeLock() {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null
    const request = () => {
      if (document.visibilityState === 'visible' && 'wakeLock' in navigator)
        navigator.wakeLock.request('screen').then((l) => (lock = l)).catch(() => undefined)
    }
    request()
    document.addEventListener('visibilitychange', request)
    return () => {
      document.removeEventListener('visibilitychange', request)
      lock?.release().catch(() => undefined)
    }
  }, [])
}
