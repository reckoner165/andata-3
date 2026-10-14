import { memo, useRef, useState } from 'react'
import { Knob } from './Knob'
import { Switch } from './Switch'
import * as haptics from '../haptics'
import { DEFAULT_MS, MAX_MS, MIN_MS } from '../constants'
import type { Mode, Step } from '../useSequencer'

type Props = {
  index: number
  step: Step
  mode: Mode
  active: boolean
  playing: boolean
  onDur: (i: number, v: number) => void
  onToggle: (i: number) => void
}

export const StepCell = memo(function StepCell({ index, step, mode, active, playing, onDur, onToggle }: Props) {
  const [flash, setFlash] = useState(false)
  const flashTimer = useRef(0)
  const n = String(index + 1).padStart(2, '0')

  const tap = () => {
    haptics.pulse(step.dur)
    setFlash(true)
    window.clearTimeout(flashTimer.current)
    flashTimer.current = window.setTimeout(() => setFlash(false), Math.max(80, step.dur * 2))
  }

  const lit = mode === 'seq' ? active && step.on : flash
  const dim = mode === 'seq' && !step.on

  return (
    <div className={`step${dim ? ' is-off' : ''}`}>
      <div className="step-head">
        <span className="num">{n}</span>
        <span className={`led${lit ? ' is-lit' : active ? ' is-pass' : ''}`} />
      </div>
      <Knob
        value={step.dur}
        min={MIN_MS}
        max={MAX_MS}
        defaultValue={DEFAULT_MS}
        onChange={(v) => onDur(index, v)}
        label={`Step ${index + 1} duration`}
        tick={!playing}
      />
      <span className="num ms">{step.dur}</span>
      {mode === 'seq' ? (
        <Switch on={step.on} onToggle={() => onToggle(index)} label={`Step ${index + 1} on`} />
      ) : (
        <button
          type="button"
          className={`pad${flash ? ' is-down' : ''}`}
          aria-label={`Play step ${index + 1}`}
          onPointerDown={(e) => {
            e.preventDefault()
            tap()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              tap()
            }
          }}
        />
      )}
    </div>
  )
})
