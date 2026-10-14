import { useRef } from 'react'
import type { Mode } from '../useSequencer'

type Props = {
  playing: boolean
  bpm: number
  mode: Mode
  onPlay: () => void
  onStop: () => void
  onBpm: (v: number) => void
  onMode: (m: Mode) => void
  onClear: () => void
  onRandomize: () => void
}

export function Transport({ playing, bpm, mode, onPlay, onStop, onBpm, onMode, onClear, onRandomize }: Props) {
  const drag = useRef<{ y: number; v: number } | null>(null)
  const seq = mode === 'seq'

  return (
    <footer className="transport">
      <div className="transport-row">
        <button
          type="button"
          className={`tbtn icon${playing ? ' is-on' : ''}`}
          onClick={playing ? onStop : onPlay}
          disabled={!seq}
          aria-label={playing ? 'Stop' : 'Play'}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {playing ? <rect x="6" y="6" width="12" height="12" /> : <path d="M7 4.5v15l12-7.5z" />}
          </svg>
        </button>

        <div className={`tempo${seq ? '' : ' is-disabled'}`}>
          <button type="button" className="tbtn step-btn" onClick={() => onBpm(bpm - 1)} disabled={!seq} aria-label="Slower">
            −
          </button>
          <div
            className="bpm"
            role="slider"
            tabIndex={seq ? 0 : -1}
            aria-label="Tempo"
            aria-valuenow={bpm}
            onPointerDown={(e) => {
              if (!seq) return
              e.currentTarget.setPointerCapture(e.pointerId)
              drag.current = { y: e.clientY, v: bpm }
            }}
            onPointerMove={(e) => {
              if (drag.current) onBpm(drag.current.v + (drag.current.y - e.clientY) / 3)
            }}
            onPointerUp={() => (drag.current = null)}
            onPointerCancel={() => (drag.current = null)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp') onBpm(bpm + 1)
              else if (e.key === 'ArrowDown') onBpm(bpm - 1)
            }}
          >
            <span className="num bpm-value">{bpm}</span>
            <span className="caption">BPM</span>
          </div>
          <button type="button" className="tbtn step-btn" onClick={() => onBpm(bpm + 1)} disabled={!seq} aria-label="Faster">
            +
          </button>
        </div>
      </div>

      <div className="transport-row">
        <div className="segmented" role="radiogroup" aria-label="Mode">
          {(['tap', 'seq'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              className={mode === m ? 'is-on' : ''}
              onClick={() => onMode(m)}
            >
              {m === 'tap' ? 'Tap' : 'Seq'}
            </button>
          ))}
        </div>
        <button type="button" className="tbtn text" onClick={onClear}>
          Clear
        </button>
        <button type="button" className="tbtn text" onClick={onRandomize}>
          Random
        </button>
      </div>
    </footer>
  )
}
