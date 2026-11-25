import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

export type Lang = 'en' | 'id'

const STORAGE_KEY = 'senara.lang'
const DEFAULT_LANG: Lang = 'en'

const en = {
  // home
  'home.chooseFrame': 'Choose a frame',
  'home.start': 'Start',
  'home.photos': '{n} photos',
  'home.photo': '1 photo',
  'frame.strip4': 'Strip · 4 photos',
  'frame.strip3': 'Strip · 3 photos',
  'frame.grid2x2': 'Grid 2×2',
  'frame.single45': 'Single 4:5',
  'frame.story916': 'Story 9:16',
  // shoot
  'shoot.howTo': 'How it works',
  'shoot.step1': 'Pick an effect',
  'shoot.step1Hint': 'at the bottom of the screen',
  'shoot.step2': 'Raise 🖐️ for 1 second',
  'shoot.step2Hint': 'or press the ◉ button',
  'shoot.step3': 'Strike {n} poses',
  'shoot.step3Hint': '{s}-second countdown for each photo',
  'shoot.gesture': 'Hand detection',
  'shoot.gestureLoading': 'loading…',
  'shoot.gestureError': 'not supported on this device',
  'shoot.readyGesture': 'Raise 🖐️ or press ◉ to start',
  'shoot.readyButton': 'Press ◉ to start',
  'shoot.hold': 'Hold it… 🖐️',
  'shoot.next': 'Get ready for photo {n}…',
  'shoot.startingCamera': 'Starting camera…',
  'shoot.cameraDenied': 'Camera permission was denied.',
  'shoot.cameraHttps': 'The camera needs HTTPS.',
  'shoot.photoCount': 'Photo',
  'shoot.cancel': 'Cancel',
  'shoot.shutter': 'Take photo',
  'pose.1': 'Air guitar! 🎸',
  'pose.2': 'Big smile! 😁',
  'pose.3': 'Silly face! 🤪',
  'pose.4': 'Strike a rockstar pose! 🤘',
  'pose.5': 'Squeeze in closer! 🫶',
  'pose.6': 'Sing it out loud! 🎤',
  // effects
  'effects.label': 'Photo effects',
  'effects.title': 'Choose an effect',
  // result
  'result.composing': 'Creating your photo…',
  'result.send': 'Send to phone',
  'result.sendHint': 'Tap to create a QR code',
  'result.preparingQr': 'Preparing QR…',
  'result.uploadFailed': 'Upload failed',
  'result.blobNotConnected': 'Server is not connected to Vercel Blob (check the Blob store connection, then redeploy).',
  'result.retry': 'Try again',
  'result.step1': 'Open your phone <b>camera</b> (iPhone / Android)',
  'result.step2': 'Point it at the QR code',
  'result.step3': 'Tap <b>Save Photo</b>',
  'result.download': 'Download',
  'result.retake': 'Retake',
  'result.done': 'Done',
  'result.autoReset': 'Back to start in {n}s',
  'result.alt': 'Your photo',
  // guest download page
  'dl.missing': 'Photo not found or it has expired.',
  'dl.loading': 'Loading…',
  'dl.save': 'Save Photo',
  'dl.downloadFile': 'Download file',
  'dl.whatsapp': 'Send via WhatsApp',
  'dl.whatsappText': 'My photo from SENARA Photobooth 📸',
  'dl.hintIos': 'iPhone: tap "Save Photo", then choose "Save Image". Or press and hold the photo → "Save to Photos".',
  'dl.hintAndroid': 'Android: tap "Save Photo", then choose Gallery/Photos, or "Download file" (saved to your Downloads folder).',
  'dl.saved': 'Saved! Thanks for stopping by ✨',
  'dl.alt': 'SENARA photo',
} as const

type Key = keyof typeof en

const id: Record<Key, string> = {
  'home.chooseFrame': 'Pilih bingkai',
  'home.start': 'Mulai Foto',
  'home.photos': '{n} foto',
  'home.photo': '1 foto',
  'frame.strip4': 'Strip 4 Foto',
  'frame.strip3': 'Strip 3 Foto',
  'frame.grid2x2': 'Grid 2×2',
  'frame.single45': 'Single 4:5',
  'frame.story916': 'Story 9:16',
  'shoot.howTo': 'Cara foto',
  'shoot.step1': 'Pilih efek',
  'shoot.step1Hint': 'di bawah layar',
  'shoot.step2': 'Angkat 🖐️ 1 detik',
  'shoot.step2Hint': 'atau tekan tombol ◉',
  'shoot.step3': 'Pose {n}x',
  'shoot.step3Hint': 'hitung mundur {s} detik tiap foto',
  'shoot.gesture': 'Deteksi tangan',
  'shoot.gestureLoading': 'memuat…',
  'shoot.gestureError': 'tidak didukung di perangkat ini',
  'shoot.readyGesture': 'Angkat 🖐️ atau tekan ◉ untuk mulai',
  'shoot.readyButton': 'Tekan ◉ untuk mulai',
  'shoot.hold': 'Tahan… 🖐️',
  'shoot.next': 'Siap untuk foto {n}…',
  'shoot.startingCamera': 'Menyalakan kamera…',
  'shoot.cameraDenied': 'Izin kamera ditolak.',
  'shoot.cameraHttps': 'Kamera butuh HTTPS.',
  'shoot.photoCount': 'Foto',
  'shoot.cancel': 'Batal',
  'shoot.shutter': 'Ambil foto',
  'pose.1': 'Gaya main gitar! 🎸',
  'pose.2': 'Senyum lebar! 😁',
  'pose.3': 'Muka konyol! 🤪',
  'pose.4': 'Pose rockstar! 🤘',
  'pose.5': 'Merapat lagi! 🫶',
  'pose.6': 'Gaya nyanyi! 🎤',
  'effects.label': 'Efek foto',
  'effects.title': 'Pilih efek',
  'result.composing': 'Menyusun foto…',
  'result.send': 'Kirim ke HP',
  'result.sendHint': 'Tap untuk membuat QR code',
  'result.preparingQr': 'Menyiapkan QR…',
  'result.uploadFailed': 'Upload gagal',
  'result.blobNotConnected': 'Server belum terhubung ke Vercel Blob (cek koneksi Blob store lalu redeploy).',
  'result.retry': 'Coba lagi',
  'result.step1': 'Buka <b>kamera</b> HP (iPhone / Android)',
  'result.step2': 'Arahkan ke QR code',
  'result.step3': 'Tap <b>Simpan Foto</b>',
  'result.download': 'Download',
  'result.retake': 'Ulangi',
  'result.done': 'Selesai',
  'result.autoReset': 'Kembali ke awal dalam {n}s',
  'result.alt': 'Hasil foto',
  'dl.missing': 'Foto tidak ditemukan atau sudah kedaluwarsa.',
  'dl.loading': 'Memuat…',
  'dl.save': 'Simpan Foto',
  'dl.downloadFile': 'Download file',
  'dl.whatsapp': 'Kirim via WhatsApp',
  'dl.whatsappText': 'Foto aku di SENARA Photobooth 📸',
  'dl.hintIos': 'iPhone: tap "Simpan Foto" lalu pilih "Save Image". Atau tekan lama foto → "Save to Photos".',
  'dl.hintAndroid': 'Android: tap "Simpan Foto" lalu pilih Galeri/Photos, atau "Download file" (tersimpan di folder Download).',
  'dl.saved': 'Tersimpan! Terima kasih sudah mampir ✨',
  'dl.alt': 'Foto SENARA',
}

const DICT: Record<Lang, Record<Key, string>> = { en, id }

export const POSE_KEYS = ['pose.1', 'pose.2', 'pose.3', 'pose.4', 'pose.5', 'pose.6'] as const

/** Locale used for dates printed on the frames. */
export const DATE_LOCALE: Record<Lang, string> = { en: 'en-GB', id: 'id-ID' }

export type TFn = (key: Key, vars?: Record<string, string | number>) => string

interface Ctx {
  lang: Lang
  setLang: (l: Lang) => void
  t: TFn
}

const I18nContext = createContext<Ctx | null>(null)

function initialLang(): Lang {
  const saved = localStorage.getItem(STORAGE_KEY)
  return saved === 'en' || saved === 'id' ? saved : DEFAULT_LANG
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    localStorage.setItem(STORAGE_KEY, l)
  }, [])

  const t = useCallback<TFn>(
    (key, vars) => {
      let s: string = DICT[lang][key] ?? en[key]
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v))
      return s
    },
    [lang],
  )

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}

export function LangToggle({ className = '' }: { className?: string }) {
  const { lang, setLang } = useI18n()
  return (
    <div className={`lang-toggle ${className}`} role="radiogroup" aria-label="Language">
      {(['en', 'id'] as const).map((l) => (
        <button key={l} role="radio" aria-checked={lang === l} className={lang === l ? 'is-active' : ''} onClick={() => setLang(l)}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
