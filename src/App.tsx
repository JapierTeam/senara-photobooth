import { useState } from 'react'
import { FRAMES, type FrameDef } from './frames'
import Home from './components/Home'
import Shoot from './components/Shoot'
import Result from './components/Result'
import { useWakeLock } from './lib/camera'

type Stage =
  | { name: 'home' }
  | { name: 'shoot'; frame: FrameDef }
  | { name: 'result'; frame: FrameDef; photos: HTMLCanvasElement[] }

export default function App() {
  useWakeLock()
  const [frameId, setFrameId] = useState(FRAMES[0].id)
  const [stage, setStage] = useState<Stage>({ name: 'home' })
  const frame = FRAMES.find((f) => f.id === frameId) ?? FRAMES[0]

  switch (stage.name) {
    case 'home':
      return (
        <Home
          selected={frame.id}
          onSelect={setFrameId}
          onStart={() => {
            document.documentElement.requestFullscreen?.().catch(() => undefined)
            setStage({ name: 'shoot', frame })
          }}
        />
      )
    case 'shoot':
      return (
        <Shoot
          frame={stage.frame}
          onCancel={() => setStage({ name: 'home' })}
          onDone={(photos) => setStage({ name: 'result', frame: stage.frame, photos })}
        />
      )
    case 'result':
      return (
        <Result
          frame={stage.frame}
          photos={stage.photos}
          onRetake={() => setStage({ name: 'shoot', frame: stage.frame })}
          onFinish={() => setStage({ name: 'home' })}
        />
      )
  }
}
