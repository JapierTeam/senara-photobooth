import { useEffect, useState } from 'react'
import { assetUrl } from '../frames'
import { blobUrlFromPath } from '../lib/upload'

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

/** Page guests land on after scanning the QR code: /p/<store>/<file>.jpg */
export default function DownloadPage() {
  const blobUrl = blobUrlFromPath(location.pathname)
  const [file, setFile] = useState<File | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading')
  const [saved, setSaved] = useState(false)
  const filename = blobUrl?.split('/').pop() ?? 'senara.jpg'

  useEffect(() => {
    if (!blobUrl) return setState('missing')
    fetch(blobUrl)
      .then((r) => (r.ok ? r.blob() : Promise.reject()))
      .then((b) => {
        setFile(new File([b], filename, { type: 'image/jpeg' }))
        setState('ready')
      })
      .catch(() => setState('missing'))
  }, [blobUrl, filename])

  const canShareFile = !!file && !!navigator.canShare?.({ files: [file] })

  const save = async () => {
    if (!file) return
    if (canShareFile) {
      try {
        // iOS: share sheet -> "Save Image" puts it straight into Photos.
        // Android: share sheet -> Photos / Gallery / WhatsApp, etc.
        await navigator.share({ files: [file], title: 'SENARA Photobooth' })
        setSaved(true)
        return
      } catch (e) {
        if ((e as Error).name === 'AbortError') return
      }
    }
    download()
  }

  const download = () => {
    if (!file) return
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
    setSaved(true)
  }

  return (
    <main className="download">
      <header className="brand brand-sm">
        <img src={assetUrl('logo-app')} alt="" className="brand-logo" />
        <div>
          <h1>SENARA</h1>
          <p>Photobooth</p>
        </div>
      </header>

      {state === 'missing' && (
        <div className="dl-card">
          <p>Foto tidak ditemukan atau sudah kedaluwarsa.</p>
        </div>
      )}

      {state !== 'missing' && (
        <>
          <div className="dl-photo">
            {blobUrl && <img src={blobUrl} alt="Foto SENARA Photobooth" />}
          </div>
          <div className="dl-actions">
            <button className="btn btn-primary btn-xl" onClick={save} disabled={state !== 'ready'}>
              {state === 'loading' ? 'Memuat…' : 'Simpan Foto'}
            </button>
            {canShareFile && (
              <button className="btn btn-ghost" onClick={download}>Download file</button>
            )}
            <a
              className="btn btn-ghost"
              href={`https://wa.me/?text=${encodeURIComponent(`Foto aku di SENARA Photobooth 📸 ${location.href}`)}`}
            >
              Kirim via WhatsApp
            </a>
          </div>
          <p className="dl-hint">
            {isIOS
              ? 'iPhone: tap "Simpan Foto" lalu pilih "Save Image". Atau tekan lama foto → "Save to Photos".'
              : 'Android: tap "Simpan Foto" lalu pilih Galeri/Photos, atau "Download file" (tersimpan di folder Download).'}
          </p>
          {saved && <p className="dl-saved">Tersimpan! Terima kasih sudah mampir ✨</p>}
        </>
      )}
    </main>
  )
}
