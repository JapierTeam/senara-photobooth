import { COLORS, type FrameDef } from './types'

/** 2x6 inch photostrip @600dpi, 4 photos. */
const W = 1200
const slotH = 640
const gap = 50
const top = 110
const slots = [0, 1, 2, 3].map((i) => ({ x: 90, y: top + i * (slotH + gap), w: 1020, h: slotH }))
const footer = top + 4 * slotH + 3 * gap // 2820

export const strip4: FrameDef = {
  id: 'strip4',
  name: 'Strip 4 Foto',
  shots: 4,
  w: W,
  h: 3600,
  background: COLORS.lavender,
  photoBorder: { width: 16, color: COLORS.white, radius: 28 },
  slots,
  stickers: [
    // background letters peeking from the edges
    { src: 'letter-s', x: 40, y: 450, w: 260, rot: -12, opacity: 0.14, layer: 'under' },
    { src: 'letter-n', x: 1170, y: 1820, w: 280, rot: 10, opacity: 0.14, layer: 'under' },
    { src: 'letter-a', x: 30, y: 2560, w: 280, rot: -8, opacity: 0.14, layer: 'under' },
    // decorations overlapping the photos
    { src: 'sparkle-1', x: 1100, y: 120, w: 170, rot: 14 },
    { src: 'note-beamed-sm', x: 95, y: 760, w: 170, rot: -14 },
    { src: 'treble-clef', x: 1125, y: 1470, w: 150, rot: 10 },
    { src: 'sparkle-tall', x: 85, y: 2170, w: 150, rot: -8 },
    { src: 'note-beamed-xs', x: 1115, y: 2800, w: 150, rot: 10 },
    // footer
    { src: 'sticker-senara-soundhole', x: 330, y: footer + 400, w: 470, rot: -4 },
    { src: 'logo-app', x: 850, y: footer + 190, w: 190, rot: 6 },
    { src: 'sparkle-3', x: 1110, y: footer + 640, w: 110, rot: 12 },
  ],
  texts: [
    { text: 'SENARA', x: 850, y: footer + 430, size: 120, weight: 800, color: COLORS.navy, align: 'center', letterSpacing: 6 },
    { text: '{date}', x: 850, y: footer + 510, size: 40, weight: 500, color: COLORS.navy, align: 'center' },
  ],
}
