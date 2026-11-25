import { useMemo } from 'react'
import { assetUrl, type AssetName } from '../frames'

const PIECES: AssetName[] = ['sparkle-1', 'sparkle-tall', 'note-beamed-xs', 'note-beamed-sm', 'sparkle-2', 'treble-clef']

interface Props {
  /** Change this to fire a new burst. */
  burst: number
  count?: number
}

/** Burst of SENARA stickers (notes & sparkles) from the center of the parent. */
export default function Confetti({ burst, count = 18 }: Props) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5
        const dist = 160 + Math.random() * 260
        return {
          src: assetUrl(PIECES[i % PIECES.length]),
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist - 120,
          rot: (Math.random() - 0.5) * 720,
          size: 28 + Math.random() * 36,
          delay: Math.random() * 120,
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [burst, count],
  )
  if (!burst) return null
  return (
    <div className="confetti" key={burst} aria-hidden>
      {pieces.map((p, i) => (
        <img
          key={i}
          src={p.src}
          alt=""
          style={{
            width: p.size,
            ['--x' as string]: `${p.x}px`,
            ['--y' as string]: `${p.y}px`,
            ['--r' as string]: `${p.rot}deg`,
            animationDelay: `${p.delay}ms`,
          }}
        />
      ))}
    </div>
  )
}
