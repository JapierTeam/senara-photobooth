import { useEffect, useMemo, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import type { FrameDef } from '../frames'
import { canvasToJpeg, composeFrame } from '../lib/compose'
import { uploadPhoto } from '../lib/upload'
import { applyEffect, type EffectId } from '../lib/effects'
import EffectPicker from './EffectPicker'
import { DATE_LOCALE, useI18n } from '../lib/i18n'

const AUTO_RESET_S = 120

type UploadState = { s: 'idle' } | { s: 'uploading' } | { s: 'done'; url: string } | { s: 'error'; msg: string }

interface Props {
  frame: FrameDef
  photos: HTMLCanvasElement[]
  effect: EffectId
  seed: number
  onEffect: (id: EffectId) => void
  onRetake: () => void
  onFinish: () => void
}

export default function Result({ frame, photos, effect, seed, onEffect, onRetake, onFinish }: Props) {
  const { t, lang } = useI18n()
  const [jpeg, setJpeg] = useState<Blob | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [up, setUp] = useState<UploadState>({ s: 'idle' })
  const [left, setLeft] = useState(AUTO_RESET_S)
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
      { seed, locale: DATE_LOCALE[lang] },
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
  }, [frame, photos, effect, seed, lang])

  const doUpload = (b: Blob) => {
    const v = version.current
    setUp({ s: 'uploading' })
    uploadPhoto(b)
      .then((r) => v === version.current && setUp({ s: 'done', url: r.shareUrl }))
      .catch((e: Error) =>
        v === version.current &&
        setUp({
          s: 'error',
          msg: e.message,
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
          <img src={preview} alt={t('result.alt')} className={frame.h > frame.w * 2 ? 'is-strip' : ''} />
        ) : (
          <div className="overlay-msg"><span className="spinner" /> {t('result.composing')}</div>
        )}
      </section>

      <aside className="result-panel">
        <h2>{t('effects.title')}</h2>
        <EffectPicker value={effect} onChange={onEffect} sample={sample} />
        <div className="qr-box">
          {up.s === 'done' ? (
            <QRCodeSVG value={up.url} size={210} level="M" marginSize={2} />
          ) : up.s === 'error' ? (
            <div className="qr-placeholder error">
              {t('result.uploadFailed')}
              <small>{/token|credentials/i.test(up.msg) ? t('result.blobNotConnected') : up.msg}</small>
              <button className="btn btn-ghost" onClick={() => jpeg && doUpload(jpeg)}>{t('result.retry')}</button>
            </div>
          ) : up.s === 'uploading' ? (
            <div className="qr-placeholder"><span className="spinner" /> {t('result.preparingQr')}</div>
          ) : (
            <button className="qr-placeholder qr-cta" disabled={!jpeg} onClick={() => jpeg && doUpload(jpeg)}>
              {jpeg ? <>{t('result.send')}<small>{t('result.sendHint')}</small></> : <><span className="spinner" /> {t('result.composing')}</>}
            </button>
          )}
        </div>
        <ol className="steps">
          {(['result.step1', 'result.step2', 'result.step3'] as const).map((k) => (
            // static strings from our own dictionary (only <b> markup)
            <li key={k} dangerouslySetInnerHTML={{ __html: t(k) }} />
          ))}
        </ol>
        {up.s === 'done' && <p className="share-url">{up.url.replace(/^https?:\/\//, '')}</p>}

        <div className="result-actions">
          {preview && (
            <a className="btn btn-ghost" href={preview} download={filename}>{t('result.download')}</a>
          )}
          <button className="btn btn-ghost" onClick={onRetake}>{t('result.retake')}</button>
          <button className="btn btn-primary" onClick={onFinish}>{t('result.done')}</button>
        </div>
        <p className="auto-reset">{t('result.autoReset', { n: left })}</p>
      </aside>
    </main>
  )
}

