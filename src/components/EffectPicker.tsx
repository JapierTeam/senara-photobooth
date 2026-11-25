import { useEffect, useState } from 'react'
import { EFFECTS, applyEffect, type EffectId } from '../lib/effects'

interface Props {
  value: EffectId
  onChange: (id: EffectId) => void
  /** Optional photo used to render a thumbnail for each effect. */
  sample?: HTMLCanvasElement
  dark?: boolean
}

export default function EffectPicker({ value, onChange, sample, dark }: Props) {
  const [thumbs, setThumbs] = useState<Partial<Record<EffectId, string>>>({})

  useEffect(() => {
    if (!sample) return
    const small = document.createElement('canvas')
    const s = 120 / Math.min(sample.width, sample.height)
    small.width = Math.round(sample.width * s)
    small.height = Math.round(sample.height * s)
    small.getContext('2d')!.drawImage(sample, 0, 0, small.width, small.height)
    const out: Partial<Record<EffectId, string>> = {}
    for (const e of EFFECTS) out[e.id] = applyEffect(small, e.id).toDataURL('image/jpeg', 0.8)
    setThumbs(out)
  }, [sample])

  return (
    <div className={`effects ${dark ? 'effects-dark' : ''}`} role="radiogroup" aria-label="Efek foto">
      {EFFECTS.map((e) => (
        <button
          key={e.id}
          role="radio"
          aria-checked={e.id === value}
          className={`effect-chip ${e.id === value ? 'is-selected' : ''}`}
          onClick={() => onChange(e.id)}
        >
          {thumbs[e.id] ? (
            <img src={thumbs[e.id]} alt="" />
          ) : (
            <span className="effect-swatch" style={{ filter: e.css }} />
          )}
          <span>{e.name}</span>
        </button>
      ))}
    </div>
  )
}
