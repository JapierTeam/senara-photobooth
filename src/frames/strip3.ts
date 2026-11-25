import { COLORS, type FrameDef } from './types'

/** 2x6 inch photostrip @600dpi, 3 photos. */
const slotH = 860
const gap = 50
const top = 110
const slots = [0, 1, 2].map((i) => ({ x: 90, y: top + i * (slotH + gap), w: 1020, h: slotH }))
const footer = top + 3 * slotH + 2 * gap // 2790

export const strip3: FrameDef = {
  id: 'strip3',
  name: 'Strip 3 Foto',
  shots: 3,
  w: 1200,
  h: 3600,
  background: { from: COLORS.lavender, to: '#C9C2E6' },
  photoBorder: { width: 16, color: COLORS.white, radius: 28 },
  slots,
  stickers: [
    { src: 'letter-e', x: 1160, y: 560, w: 260, rot: 10, opacity: 0.14, layer: 'under' },
    { src: 'letter-r', x: 40, y: 1500, w: 280, rot: -10, opacity: 0.14, layer: 'under' },
    { src: 'sparkle-2', x: 95, y: 130, w: 170, rot: -12 },
    { src: 'note-beamed-lg', x: 1105, y: 1000, w: 180, rot: 12 },
    { src: 'sparkle-tall', x: 95, y: 1900, w: 150, rot: 8 },
    { src: 'treble-clef', x: 1120, y: 2650, w: 150, rot: -8 },
    { src: 'sticker-senara-guitar', x: 330, y: footer + 410, w: 480, rot: -5 },
    { src: 'logo-app', x: 860, y: footer + 200, w: 190, rot: -6 },
    { src: 'note-beamed-xs', x: 1110, y: footer + 650, w: 110, rot: 10 },
  ],
  texts: [
    { text: 'SENARA', x: 860, y: footer + 440, size: 120, weight: 800, color: COLORS.navy, align: 'center', letterSpacing: 6 },
    { text: 'PHOTOBOOTH', x: 860, y: footer + 510, size: 44, weight: 700, color: COLORS.purple, align: 'center', letterSpacing: 10 },
    { text: '{date}', x: 860, y: footer + 600, size: 40, weight: 500, color: COLORS.navy, align: 'center' },
  ],
}
