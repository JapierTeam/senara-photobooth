import { assetUrl, FONT, type AssetName, type FrameDef, type Slot, type Sticker } from '../frames'

export type PhotoSource = HTMLCanvasElement | HTMLImageElement | ImageBitmap

const imageCache = new Map<string, Promise<HTMLImageElement>>()

export function loadImage(src: string): Promise<HTMLImageElement> {
  let p = imageCache.get(src)
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image()
      img.decoding = 'async'
      img.onload = () => resolve(img)
      img.onerror = () => {
        imageCache.delete(src)
        reject(new Error(`Failed to load ${src}`))
      }
      img.src = src
    })
    imageCache.set(src, p)
  }
  return p
}

let fontsReady: Promise<unknown> | null = null
function ensureFonts() {
  fontsReady ??= Promise.all(
    [500, 700, 800].map((w) => document.fonts.load(`${w} 40px ${FONT}`)),
  ).catch(() => undefined)
  return fontsReady
}

/** Warm the cache so the first compose is instant. */
export function preloadFrame(frame: FrameDef) {
  const names = new Set<AssetName>()
  frame.stickers.forEach((s) => (Array.isArray(s.src) ? s.src : [s.src]).forEach((n) => names.add(n)))
  return Promise.all([ensureFonts(), ...[...names].map((n) => loadImage(assetUrl(n)))])
}

function sourceSize(src: PhotoSource) {
  if (src instanceof HTMLImageElement) return { w: src.naturalWidth, h: src.naturalHeight }
  return { w: src.width, h: src.height }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Draw `src` into the slot like CSS object-fit: cover. */
function drawCover(ctx: CanvasRenderingContext2D, src: PhotoSource, s: Slot) {
  const { w, h } = sourceSize(src)
  const scale = Math.max(s.w / w, s.h / h)
  const cw = s.w / scale
  const ch = s.h / scale
  ctx.drawImage(src, (w - cw) / 2, (h - ch) / 2, cw, ch, s.x, s.y, s.w, s.h)
}

async function drawSticker(ctx: CanvasRenderingContext2D, st: Sticker, pick: (list: AssetName[]) => AssetName) {
  const name = Array.isArray(st.src) ? pick(st.src) : st.src
  const img = await loadImage(assetUrl(name))
  const h = (st.w * img.naturalHeight) / img.naturalWidth
  ctx.save()
  ctx.globalAlpha = st.opacity ?? 1
  ctx.translate(st.x, st.y)
  ctx.rotate(((st.rot ?? 0) * Math.PI) / 180)
  // soft drop shadow makes the die-cut stickers pop off the background
  if ((st.layer ?? 'over') === 'over') {
    ctx.shadowColor = 'rgba(46,39,82,0.25)'
    ctx.shadowBlur = st.w * 0.04
    ctx.shadowOffsetY = st.w * 0.015
  }
  ctx.drawImage(img, -st.w / 2, -h / 2, st.w, h)
  ctx.restore()
}

export function formatDate(d = new Date(), locale = 'en-GB') {
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
}

export interface ComposeOptions {
  /** Output scale; 1 = full print resolution. Use < 1 for thumbnails. */
  scale?: number
  /** Seed for picking random stickers (quote bubbles), so thumbnail & final match if wanted. */
  seed?: number
  /** BCP 47 locale for the printed date. */
  locale?: string
}

/**
 * Render a frame with photos into a canvas.
 * `photos[i]` fills `frame.slots[i]`; a missing photo renders a placeholder.
 */
export async function composeFrame(frame: FrameDef, photos: (PhotoSource | undefined)[], opts: ComposeOptions = {}) {
  const scale = opts.scale ?? 1
  await preloadFrame(frame)

  let seed = opts.seed ?? Math.floor(Math.random() * 1e9)
  const pick = (list: AssetName[]) => {
    seed = (seed * 1103515245 + 12345) % 2147483648
    return list[seed % list.length]
  }

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(frame.w * scale)
  canvas.height = Math.round(frame.h * scale)
  const ctx = canvas.getContext('2d')!
  ctx.scale(scale, scale)
  ctx.imageSmoothingQuality = 'high'

  // background
  if (typeof frame.background === 'string') {
    ctx.fillStyle = frame.background
  } else {
    const g = ctx.createLinearGradient(0, 0, frame.w * 0.3, frame.h)
    g.addColorStop(0, frame.background.from)
    g.addColorStop(1, frame.background.to)
    ctx.fillStyle = g
  }
  ctx.fillRect(0, 0, frame.w, frame.h)

  for (const st of frame.stickers) if (st.layer === 'under') await drawSticker(ctx, st, pick)

  // photos
  const b = frame.photoBorder
  frame.slots.forEach((slot, i) => {
    ctx.save()
    ctx.shadowColor = 'rgba(46,39,82,0.22)'
    ctx.shadowBlur = 24
    ctx.shadowOffsetY = 8
    ctx.fillStyle = b.color
    roundRect(ctx, slot.x - b.width, slot.y - b.width, slot.w + b.width * 2, slot.h + b.width * 2, b.radius + b.width)
    ctx.fill()
    ctx.restore()

    ctx.save()
    roundRect(ctx, slot.x, slot.y, slot.w, slot.h, b.radius)
    ctx.clip()
    const photo = photos[i]
    if (photo) {
      drawCover(ctx, photo, slot)
    } else {
      const g = ctx.createLinearGradient(slot.x, slot.y, slot.x + slot.w, slot.y + slot.h)
      g.addColorStop(0, '#8A7EBF')
      g.addColorStop(1, '#62559C')
      ctx.fillStyle = g
      ctx.fillRect(slot.x, slot.y, slot.w, slot.h)
      ctx.fillStyle = 'rgba(255,255,255,0.55)'
      ctx.font = `800 ${Math.min(slot.w, slot.h) * 0.28}px ${FONT}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(i + 1), slot.x + slot.w / 2, slot.y + slot.h / 2)
    }
    ctx.restore()
  })

  for (const st of frame.stickers) if ((st.layer ?? 'over') === 'over') await drawSticker(ctx, st, pick)

  // texts
  const date = formatDate(new Date(), opts.locale)
  for (const t of frame.texts) {
    ctx.save()
    ctx.fillStyle = t.color
    ctx.font = `${t.weight ?? 700} ${t.size}px ${FONT}`
    ctx.textAlign = t.align ?? 'left'
    ctx.textBaseline = 'alphabetic'
    if (t.letterSpacing) ctx.letterSpacing = `${t.letterSpacing}px`
    ctx.fillText(t.text.replace('{date}', date), t.x, t.y)
    ctx.restore()
  }

  return canvas
}

export function canvasToJpeg(canvas: HTMLCanvasElement, quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', quality),
  )
}
