import { useEffect, useState } from 'react'
import { FRAMES, assetUrl } from '../frames'
import { composeFrame } from '../lib/compose'
import { DATE_LOCALE, LangToggle, useI18n } from '../lib/i18n'

interface Props {
  selected: string
  onSelect: (id: string) => void
  onStart: () => void
}

export default function Home({ selected, onSelect, onStart }: Props) {
  const { t, lang } = useI18n()
  const [thumbs, setThumbs] = useState<Record<string, string>>({})

  useEffect(() => {
    let alive = true
    FRAMES.forEach(async (f) => {
      const c = await composeFrame(f, [], { scale: 360 / Math.max(f.w, f.h), seed: 7, locale: DATE_LOCALE[lang] })
      if (alive) setThumbs((t) => ({ ...t, [f.id]: c.toDataURL('image/png') }))
    })
    return () => {
      alive = false
    }
  }, [lang])

  return (
    <main className="home">
      <LangToggle className="lang-corner" />
      <header className="brand">
        <img src={assetUrl('logo-app')} alt="" className="brand-logo" />
        <div>
          <h1>SENARA</h1>
          <p>Photobooth</p>
        </div>
      </header>

      <h2 className="home-title">{t('home.chooseFrame')}</h2>
      <div className="frame-grid">
        {FRAMES.map((f) => (
          <button
            key={f.id}
            className={`frame-card ${f.id === selected ? 'is-selected' : ''}`}
            onClick={() => onSelect(f.id)}
          >
            <div className="frame-thumb">{thumbs[f.id] ? <img src={thumbs[f.id]} alt="" /> : <span className="spinner" />}</div>
            <strong>{t(`frame.${f.id}` as 'frame.strip4')}</strong>
            <small>{f.shots === 1 ? t('home.photo') : t('home.photos', { n: f.shots })}</small>
          </button>
        ))}
      </div>

      <button className="btn btn-primary btn-xl" onClick={onStart}>
        {t('home.start')}
      </button>

      <img src={assetUrl('sparkle-tall')} alt="" className="deco deco-1" />
      <img src={assetUrl('note-beamed-lg')} alt="" className="deco deco-2" />
      <img src={assetUrl('treble-clef')} alt="" className="deco deco-3" />
    </main>
  )
}
