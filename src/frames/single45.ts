import { COLORS, QUOTE_BUBBLES, type FrameDef } from './types'

/** Instagram feed portrait 4:5. */
export const single45: FrameDef = {
  id: 'single45',
  name: 'Single 4:5',
  shots: 1,
  w: 1080,
  h: 1350,
  background: { from: COLORS.purple, to: COLORS.navy },
  photoBorder: { width: 14, color: COLORS.white, radius: 30 },
  slots: [{ x: 70, y: 70, w: 940, h: 1020 }],
  stickers: [
    { src: 'letter-s', x: 1030, y: 1250, w: 260, rot: 12, opacity: 0.12, layer: 'under' },
    { src: QUOTE_BUBBLES, x: 220, y: 200, w: 330, rot: -6 },
    { src: 'sparkle-1', x: 990, y: 1060, w: 140, rot: 12 },
    { src: 'note-beamed-xs', x: 1000, y: 110, w: 110, rot: 10 },
    { src: 'logo-app', x: 150, y: 1210, w: 130, rot: -6 },
  ],
  texts: [
    { text: 'SENARA', x: 240, y: 1215, size: 84, weight: 800, color: COLORS.white, align: 'left', letterSpacing: 4 },
    { text: '{date}', x: 240, y: 1275, size: 32, weight: 500, color: COLORS.lavender, align: 'left' },
  ],
}
