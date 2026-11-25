/**
 * Tiny synthesized sound effects (Web Audio, no audio files).
 * iOS only allows audio after a user gesture, so call `unlockAudio()` from a tap handler.
 */
let ctx: AudioContext | null = null
const MUTE_KEY = 'senara.mute'

export const isMuted = () => localStorage.getItem(MUTE_KEY) === '1'
export const setMuted = (m: boolean) => localStorage.setItem(MUTE_KEY, m ? '1' : '0')

function audio() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  return ctx
}

export function unlockAudio() {
  const a = audio()
  if (a?.state === 'suspended') a.resume().catch(() => undefined)
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.18) {
  const a = audio()
  if (!a || isMuted()) return
  const t = a.currentTime + start
  const osc = a.createOscillator()
  const g = a.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(gain, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(g).connect(a.destination)
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

/** Countdown tick; the last one ("1") is higher. */
export const playTick = (last = false) => tone(last ? 1046 : 784, 0, 0.18, 'triangle')

/** Mechanical-ish shutter: short noise burst. */
export function playShutter() {
  const a = audio()
  if (!a || isMuted()) return
  const len = Math.floor(a.sampleRate * 0.12)
  const buf = a.createBuffer(1, len, a.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3)
  const src = a.createBufferSource()
  const g = a.createGain()
  g.gain.value = 0.35
  src.buffer = buf
  src.connect(g).connect(a.destination)
  src.start()
}

/** Little major arpeggio (C–E–G–C) for success moments. */
export function playSuccess() {
  ;[523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.08, 0.35, 'sine', 0.14))
}

export const playPop = () => tone(660, 0, 0.08, 'sine', 0.08)
