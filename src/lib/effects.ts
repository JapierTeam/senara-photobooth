/**
 * Photo effects. Each effect has:
 *  - `css`: CSS filter used for the live camera preview (cheap, GPU, works on every iOS/Android browser)
 *  - `apply`: pixel-level version used for the final photo, so output does not depend on
 *    `CanvasRenderingContext2D.filter` (missing on older iPad Safari).
 */
export type EffectId = 'original' | 'bw' | 'vintage' | 'warm' | 'cool' | 'purple' | 'soft'

export interface Effect {
  id: EffectId
  name: string
  css: string
}

export const EFFECTS: Effect[] = [
  { id: 'original', name: 'Original', css: 'none' },
  { id: 'bw', name: 'B&W', css: 'grayscale(1) contrast(1.2)' },
  { id: 'vintage', name: 'Vintage', css: 'sepia(0.75) contrast(0.92) brightness(1.06) saturate(1.1)' },
  { id: 'warm', name: 'Warm', css: 'sepia(0.22) saturate(1.25) brightness(1.05) contrast(0.95)' },
  { id: 'cool', name: 'Cool', css: 'saturate(0.9) hue-rotate(-12deg) brightness(1.04) contrast(1.05)' },
  { id: 'purple', name: 'SENARA Purple', css: 'grayscale(1) sepia(1) hue-rotate(215deg) saturate(1.6) brightness(1.05)' },
  { id: 'soft', name: 'Soft', css: 'brightness(1.08) contrast(0.9) saturate(1.05) blur(0.6px)' },
]

const clamp = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v)
const lum = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b

type PixelFn = (r: number, g: number, b: number) => [number, number, number]

// duotone endpoints from the SENARA palette
const NAVY = [46, 39, 82]
const LAVENDER = [236, 233, 248]

const PIXEL: Record<Exclude<EffectId, 'original' | 'soft'>, PixelFn> = {
  bw: (r, g, b) => {
    const l = clamp((lum(r, g, b) - 128) * 1.2 + 128)
    return [l, l, l]
  },
  vintage: (r, g, b) => {
    const sr = 0.393 * r + 0.769 * g + 0.189 * b
    const sg = 0.349 * r + 0.686 * g + 0.168 * b
    const sb = 0.272 * r + 0.534 * g + 0.131 * b
    // 75% sepia, faded blacks
    return [
      clamp(18 + 0.9 * (r * 0.25 + sr * 0.75)),
      clamp(14 + 0.9 * (g * 0.25 + sg * 0.75)),
      clamp(10 + 0.9 * (b * 0.25 + sb * 0.75)),
    ]
  },
  warm: (r, g, b) => [clamp(r * 1.08 + 12), clamp(g * 1.02 + 6), clamp(b * 0.88 + 4)],
  cool: (r, g, b) => [clamp(r * 0.9 + 2), clamp(g * 1.0 + 4), clamp(b * 1.1 + 12)],
  purple: (r, g, b) => {
    const t = clamp((lum(r, g, b) - 128) * 1.1 + 128) / 255
    return [
      NAVY[0] + (LAVENDER[0] - NAVY[0]) * t,
      NAVY[1] + (LAVENDER[1] - NAVY[1]) * t,
      NAVY[2] + (LAVENDER[2] - NAVY[2]) * t,
    ]
  },
}

function copy(src: HTMLCanvasElement) {
  const c = document.createElement('canvas')
  c.width = src.width
  c.height = src.height
  c.getContext('2d')!.drawImage(src, 0, 0)
  return c
}

function mapPixels(c: HTMLCanvasElement, fn: PixelFn, grain = 0) {
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  const img = ctx.getImageData(0, 0, c.width, c.height)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const [r, g, b] = fn(d[i], d[i + 1], d[i + 2])
    const n = grain ? (Math.random() - 0.5) * grain : 0
    d[i] = clamp(r + n)
    d[i + 1] = clamp(g + n)
    d[i + 2] = clamp(b + n)
  }
  ctx.putImageData(img, 0, 0)
}

function vignette(c: HTMLCanvasElement, strength: number) {
  const ctx = c.getContext('2d')!
  const r = Math.hypot(c.width, c.height) / 2
  const g = ctx.createRadialGradient(c.width / 2, c.height / 2, r * 0.45, c.width / 2, c.height / 2, r)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, `rgba(30,20,10,${strength})`)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, c.width, c.height)
}

/** Blur by downscaling then upscaling (fast, no ctx.filter needed). */
function softGlow(c: HTMLCanvasElement) {
  const small = document.createElement('canvas')
  small.width = Math.max(1, Math.round(c.width / 12))
  small.height = Math.max(1, Math.round(c.height / 12))
  const sctx = small.getContext('2d')!
  sctx.imageSmoothingQuality = 'high'
  sctx.drawImage(c, 0, 0, small.width, small.height)
  const ctx = c.getContext('2d')!
  ctx.save()
  ctx.imageSmoothingQuality = 'high'
  ctx.globalAlpha = 0.35
  ctx.globalCompositeOperation = 'screen'
  ctx.drawImage(small, 0, 0, c.width, c.height)
  ctx.globalAlpha = 0.25
  ctx.globalCompositeOperation = 'source-over'
  ctx.drawImage(small, 0, 0, c.width, c.height)
  ctx.restore()
}

/** Returns a new canvas with the effect applied; the source is left untouched. */
export function applyEffect(src: HTMLCanvasElement, id: EffectId): HTMLCanvasElement {
  if (id === 'original') return src
  const c = copy(src)
  switch (id) {
    case 'soft':
      softGlow(c)
      mapPixels(c, (r, g, b) => [r * 0.96 + 12, g * 0.96 + 10, b * 0.96 + 10])
      break
    case 'vintage':
      mapPixels(c, PIXEL.vintage, 22)
      vignette(c, 0.45)
      break
    default:
      mapPixels(c, PIXEL[id])
  }
  return c
}
