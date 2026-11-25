import { useEffect, useMemo, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import type { FrameDef } from '../frames'
import { canvasToJpeg, composeFrame } from '../lib/compose'
import { uploadPhoto } from '../lib/upload'
import { applyEffect, type EffectId } from '../lib/effects'
import EffectPicker from './EffectPicker'

const AUTO_RESET_S = 120

type UploadState = { s: 'idle' } | { s: 'uploading' } | { s: 'done'; url: string } | { s: 'error'; msg: string }

interface Props {
  frame: FrameDef
  photos: HTMLCanvasElement[]
  effect: EffectId
  onEffect: (id: EffectId) => void
  onRetake: () => void
  onFinish: () => void
}

export default function Result({ frame, photos, effect, onEffect, onRetake, onFinish }: Props) {
  const [jpeg, setJpeg] = useState<Blob | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [up, setUp] = useState<UploadState>({ s: 'idle' })
  const [left, setLeft] = useState(AUTO_RESET_S)
  // same random quote bubble no matter how often the effect is changed
  const [seed] = useState(() => Math.floor(Math.random() * 1e9))
  // bumps on every recompose so a late upload of an old version is ignored
  const version = useRef(0)

  // recompose whenever the effect changes; the QR is only made when the guest asks for it
  useEffect(() => {
    let url: string | null = null
    let alive = true
    version.current++
    setJpeg(null)
    setUp({ s: 'idle' })
    composeFrame(
      frame,
      photos.map((p) => applyEffect(p, effect)),
      { seed },
    )
      .then(async (c) => {
        // keep under the 4.5MB serverless body limit
        let b = await canvasToJpeg(c, 0.92)
        if (b.size > 4_000_000) b = await canvasToJpeg(c, 0.8)
        return b
      })
      .then((b) => {
        if (!alive) return
        url = URL.createObjectURL(b)
        setJpeg(b)
        setPreview(url)
      })
    return () => {
      alive = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [frame, photos, effect, seed])

  const doUpload = (b: Blob) => {
    const v = version.current
    setUp({ s: 'uploading' })
    uploadPhoto(b)
      .then((r) => v === version.current && setUp({ s: 'done', url: r.shareUrl }))
      .catch((e: Error) =>
        v === version.current &&
        setUp({
          s: 'error',
          msg: /token|credentials/i.test(e.message)
            ? 'Server belum terhubung ke Vercel Blob (cek koneksi Blob store lalu redeploy).'
            : e.message,
        }),
      )
  }

  // auto reset so the booth is ready for the next guest
  useEffect(() => {
    const t = setInterval(() => setLeft((l) => l - 1), 1000)
    return () => clearInterval(t)
  }, [])
  useEffect(() => {
    if (left <= 0) onFinish()
  }, [left, onFinish])

  const filename = `senara-${Date.now()}.jpg`
  const sample = useMemo(() => photos[0], [photos])

  return (
    <main className="result" onPointerDown={() => setLeft(AUTO_RESET_S)}>
      <section className="result-photo">
        {preview ? (
          <img src={preview} alt="Hasil foto" className={frame.h > frame.w * 2 ? 'is-strip' : ''} />
        ) : (
          <div className="overlay-msg"><span className="spinner" /> Menyusun foto…</div>
        )}
      </section>

      <aside className="result-panel">
        <h2>Pilih efek</h2>
        <EffectPicker value={effect} onChange={onEffect} sample={sample} />
        <div className="qr-box">
          {up.s === 'done' ? (
            <QRCodeSVG value={up.url} size={210} level="M" marginSize={2} />
          ) : up.s === 'error' ? (
            <div className="qr-placeholder error">
              Upload gagal
              <small>{up.msg}</small>
              <button className="btn btn-ghost" onClick={() => jpeg && doUpload(jpeg)}>Coba lagi</button>
            </div>
          ) : up.s === 'uploading' ? (
            <div className="qr-placeholder"><span className="spinner" /> Menyiapkan QR…</div>
          ) : (
            <button className="qr-placeholder qr-cta" disabled={!jpeg} onClick={() => jpeg && doUpload(jpeg)}>
              {jpeg ? <>Kirim ke HP<small>Tap untuk membuat QR code</small></> : <><span className="spinner" /> Menyusun foto…</>}
            </button>
          )}
        </div>
        <ol className="steps">
          <li>Buka <b>kamera</b> HP (iPhone / Android)</li>
          <li>Arahkan ke QR code</li>
          <li>Tap <b>Simpan Foto</b></li>
        </ol>
        {up.s === 'done' && <p className="share-url">{up.url.replace(/^https?:\/\//, '')}</p>}

        <div className="result-actions">
          {preview && (
            <a className="btn btn-ghost" href={preview} download={filename}>Download</a>
          )}
          <button className="btn btn-ghost" onClick={onRetake}>Ulangi</button>
          <button className="btn btn-primary" onClick={onFinish}>Selesai</button>
        </div>
        <p className="auto-reset">Kembali ke awal dalam {left}s</p>
      </aside>
    </main>
  )
}

