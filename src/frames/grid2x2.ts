import { COLORS, type FrameDef } from './types'

/** 4R (4x6 inch) portrait @300dpi, 2x2 grid. */
const pad = 70
const gap = 50
const sw = (1200 - pad * 2 - gap) / 2 // 505
const sh = 620
const slots = [0, 1, 2, 3].map((i) => ({
  x: pad + (i % 2) * (sw + gap),
  y: pad + Math.floor(i / 2) * (sh + gap),
  w: sw,
  h: sh,
}))
const footer = pad + 2 * sh + gap // 1360

export const grid2x2: FrameDef = {
  id: 'grid2x2',
  name: 'Grid 2x2',
  shots: 4,
  w: 1200,
  h: 1800,
  background: COLORS.lavender,
  photoBorder: { width: 12, color: COLORS.white, radius: 24 },
  slots,
  stickers: [
    { src: 'sparkle-1', x: 600, y: 700, w: 140, rot: 10 },
    { src: 'note-beamed-sm', x: 1130, y: 80, w: 130, rot: 12 },
    { src: 'treble-clef-wide', x: 170, y: 1330, w: 260, rot: -10 },
    { src: 'sticker-senara-acoustic', x: 1000, y: footer + 230, w: 330, rot: 6 },
    { src: 'logo-app', x: 140, y: footer + 260, w: 150, rot: -6 },
    { src: 'sparkle-3', x: 1150, y: footer - 10, w: 90, rot: -10 },
  ],
  texts: [
    { text: 'SENARA', x: 560, y: footer + 250, size: 104, weight: 800, color: COLORS.navy, align: 'center', letterSpacing: 6 },
    { text: '{date}', x: 560, y: footer + 320, size: 34, weight: 500, color: COLORS.navy, align: 'center' },
  ],
}
