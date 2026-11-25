/** Every sticker extracted from cetakins.pdf (see design/tools/). Files live in public/stickers/<name>.webp */
export const ASSETS = [
  'logo-app',
  'sticker-senara-guitar',
  'sticker-senara-acoustic',
  'sticker-senara-soundhole',
  'treble-clef',
  'treble-clef-wide',
  'treble-clef-wide-2',
  'note-beamed-lg',
  'note-beamed-sm',
  'note-beamed-xs',
  'sparkle-1',
  'sparkle-2',
  'sparkle-3',
  'sparkle-tall',
  'bubble-looking-for',
  'bubble-10-percent',
  'bubble-careful',
  'letter-s',
  'letter-e',
  'letter-n',
  'letter-a',
  'letter-a-2',
  'letter-r',
] as const

export type AssetName = (typeof ASSETS)[number]

export const assetUrl = (name: AssetName) => `/stickers/${name}.webp`

export const QUOTE_BUBBLES: AssetName[] = ['bubble-looking-for', 'bubble-10-percent', 'bubble-careful']

export const COLORS = {
  purple: '#62559C',
  purpleLight: '#8A7EBF',
  navy: '#2E2752',
  lavender: '#E0DDEE',
  white: '#FFFFFF',
} as const

export const FONT = '"Plus Jakarta Sans", system-ui, sans-serif'

/** Photo hole. Coordinates in frame pixels. */
export interface Slot {
  x: number
  y: number
  w: number
  h: number
}

/** Sticker placed by its center point; height follows the asset's aspect ratio. */
export interface Sticker {
  /** One asset, or a list to pick from at random each time a photo is composed. */
  src: AssetName | AssetName[]
  x: number
  y: number
  w: number
  rot?: number
  opacity?: number
  /** 'under' = drawn before the photos (background decoration). Default 'over'. */
  layer?: 'under' | 'over'
}

export interface TextEl {
  /** Literal text, or '{date}' which is replaced by today's date. */
  text: string
  x: number
  y: number
  size: number
  weight?: number
  color: string
  align?: CanvasTextAlign
  letterSpacing?: number
}

export interface FrameDef {
  id: string
  name: string
  /** Number of photos taken. Equals slots.length. */
  shots: number
  w: number
  h: number
  background: string | { from: string; to: string }
  /** Border drawn around every photo. */
  photoBorder: { width: number; color: string; radius: number }
  slots: Slot[]
  stickers: Sticker[]
  texts: TextEl[]
}
