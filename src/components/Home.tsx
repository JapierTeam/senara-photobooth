import { useEffect, useState } from 'react'
import { FRAMES, assetUrl } from '../frames'
import { composeFrame } from '../lib/compose'

interface Props {
  selected: string
  onSelect: (id: string) => void
  onStart: () => void
}

export default function Home({ selected, onSelect, onStart }: Props) {
  const [thumbs, setThumbs] = useState<Record<string, string>>({})

  useEffect(() => {
    let alive = true
    FRAMES.forEach(async (f) => {
      const c = await composeFrame(f, [], { scale: 360 / Math.max(f.w, f.h), seed: 7 })
      if (alive) setThumbs((t) => ({ ...t, [f.id]: c.toDataURL('image/png') }))
    })
    return () => {
      alive = false
    }
  }, [])

  return (
    <main className="home">
      <header className="brand">
        <img src={assetUrl('logo-app')} alt="" className="brand-logo" />
        <div>
          <h1>SENARA</h1>
          <p>Photobooth</p>
        </div>
      </header>

      <h2 className="home-title">Pilih bingkai</h2>
      <div className="frame-grid">
        {FRAMES.map((f) => (
          <button
            key={f.id}
            className={`frame-card ${f.id === selected ? 'is-selected' : ''}`}
            onClick={() => onSelect(f.id)}
          >
            <div className="frame-thumb">{thumbs[f.id] ? <img src={thumbs[f.id]} alt="" /> : <span className="spinner" />}</div>
            <strong>{f.name}</strong>
            <small>{f.shots} foto</small>
          </button>
        ))}
      </div>

      <button className="btn btn-primary btn-xl" onClick={onStart}>
        Mulai Foto
      </button>

      <img src={assetUrl('sparkle-tall')} alt="" className="deco deco-1" />
      <img src={assetUrl('note-beamed-lg')} alt="" className="deco deco-2" />
      <img src={assetUrl('treble-clef')} alt="" className="deco deco-3" />
    </main>
  )
}
