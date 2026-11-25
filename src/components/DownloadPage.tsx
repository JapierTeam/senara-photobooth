import { useEffect, useState } from 'react'
import { assetUrl } from '../frames'
import { blobUrlFromPath } from '../lib/upload'
import { LangToggle, useI18n } from '../lib/i18n'

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

/** Page guests land on after scanning the QR code: /p/<store>/<file>.jpg */
export default function DownloadPage() {
  const { t } = useI18n()
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
      <LangToggle className="lang-corner" />
      <header className="brand brand-sm">
        <img src={assetUrl('logo-app')} alt="" className="brand-logo" />
        <div>
          <h1>SENARA</h1>
          <p>Photobooth</p>
        </div>
      </header>

      {state === 'missing' && (
        <div className="dl-card">
          <p>{t('dl.missing')}</p>
        </div>
      )}

      {state !== 'missing' && (
        <>
          <div className="dl-photo">
            {blobUrl && <img src={blobUrl} alt={t('dl.alt')} />}
          </div>
          <div className="dl-actions">
            <button className="btn btn-primary btn-xl" onClick={save} disabled={state !== 'ready'}>
              {state === 'loading' ? t('dl.loading') : t('dl.save')}
            </button>
            {canShareFile && (
              <button className="btn btn-ghost" onClick={download}>{t('dl.downloadFile')}</button>
            )}
            <a
              className="btn btn-ghost"
              href={`https://wa.me/?text=${encodeURIComponent(`${t('dl.whatsappText')} ${location.href}`)}`}
            >
              {t('dl.whatsapp')}
            </a>
          </div>
          <p className="dl-hint">
            {isIOS ? t('dl.hintIos') : t('dl.hintAndroid')}
          </p>
          {saved && <p className="dl-saved">{t('dl.saved')}</p>}
        </>
      )}
    </main>
  )
}
