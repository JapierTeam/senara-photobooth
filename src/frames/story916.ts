import { COLORS, QUOTE_BUBBLES, type FrameDef } from './types'

/** Instagram / WhatsApp story 9:16. */
export const story916: FrameDef = {
  id: 'story916',
  name: 'Story 9:16',
  shots: 1,
  w: 1080,
  h: 1920,
  background: { from: COLORS.lavender, to: '#C9C2E6' },
  photoBorder: { width: 16, color: COLORS.white, radius: 36 },
  slots: [{ x: 80, y: 250, w: 920, h: 1240 }],
  stickers: [
    // SENARA spelled out faintly behind the photo
    { src: 'letter-s', x: 140, y: 1770, w: 150, rot: -8, opacity: 0.16, layer: 'under' },
    { src: 'letter-e', x: 300, y: 1800, w: 140, rot: 6, opacity: 0.16, layer: 'under' },
    { src: 'letter-n', x: 1010, y: 1180, w: 150, rot: 8, opacity: 0.16, layer: 'under' },
    { src: 'sparkle-2', x: 95, y: 270, w: 150, rot: -10 },
    { src: 'note-beamed-sm', x: 1010, y: 1400, w: 140, rot: 10 },
    { src: QUOTE_BUBBLES, x: 330, y: 1700, w: 440, rot: -4 },
    { src: 'sticker-senara-guitar', x: 840, y: 1730, w: 280, rot: 8 },
    { src: 'logo-app', x: 150, y: 130, w: 140, rot: -6 },
  ],
  texts: [
    { text: 'SENARA', x: 250, y: 150, size: 88, weight: 800, color: COLORS.navy, align: 'left', letterSpacing: 4 },
    { text: '{date}', x: 1000, y: 150, size: 34, weight: 500, color: COLORS.purple, align: 'right' },
  ],
}
