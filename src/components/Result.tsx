import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import type { FrameDef } from '../frames'
import { canvasToJpeg, composeFrame } from '../lib/compose'
import { uploadPhoto } from '../lib/upload'

const AUTO_RESET_S = 120

type UploadState = { s: 'idle' } | { s: 'uploading' } | { s: 'done'; url: string } | { s: 'error'; msg: string }

interface Props {
  frame: FrameDef
  photos: HTMLCanvasElement[]
  onRetake: () => void
  onFinish: () => void
}

export default function Result({ frame, photos, onRetake, onFinish }: Props) {
  const [jpeg, setJpeg] = useState<Blob | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [up, setUp] = useState<UploadState>({ s: 'idle' })
  const [left, setLeft] = useState(AUTO_RESET_S)

  // compose once
  useEffect(() => {
    let url: string | null = null
    let alive = true
    composeFrame(frame, photos)
      .then(canvasToJpeg)
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
  }, [frame, photos])

  const doUpload = (b: Blob) => {
    setUp({ s: 'uploading' })
    uploadPhoto(b)
      .then((r) => setUp({ s: 'done', url: r.shareUrl }))
      .catch((e: Error) =>
        setUp({
          s: 'error',
          msg: /client token/i.test(e.message)
            ? 'Server belum terhubung ke Vercel Blob (cek BLOB_READ_WRITE_TOKEN).'
            : e.message,
        }),
      )
  }

  useEffect(() => {
    if (jpeg) doUpload(jpeg)
  }, [jpeg])

  // auto reset so the booth is ready for the next guest
  useEffect(() => {
    const t = setInterval(() => setLeft((l) => l - 1), 1000)
    return () => clearInterval(t)
  }, [])
  useEffect(() => {
    if (left <= 0) onFinish()
  }, [left, onFinish])

  const filename = `senara-${Date.now()}.jpg`

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
        <h2>Ambil fotomu!</h2>
        <div className="qr-box">
          {up.s === 'done' ? (
            <QRCodeSVG value={up.url} size={260} level="M" marginSize={2} />
          ) : up.s === 'error' ? (
            <div className="qr-placeholder error">
              Upload gagal
              <small>{up.msg}</small>
              <button className="btn btn-ghost" onClick={() => jpeg && doUpload(jpeg)}>Coba lagi</button>
            </div>
          ) : (
            <div className="qr-placeholder"><span className="spinner" /> Menyiapkan QR…</div>
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

