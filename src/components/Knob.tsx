import { useRef } from 'react'
import * as haptics from '../haptics'

type Props = {
  value: number
  min: number
  max: number
  defaultValue: number
  onChange: (v: number) => void
  label: string
  /** Emit a small haptic tick every `tickEvery` units while turning. */
  tick?: boolean
}

const SWEEP = 270
const START = -135
// Pixels of drag for a full sweep.
const TRAVEL = 160

function polar(cx: number, cy: number, r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
}

function arc(cx: number, cy: number, r: number, from: number, to: number) {
  const [x1, y1] = polar(cx, cy, r, from)
  const [x2, y2] = polar(cx, cy, r, to)
  const large = to - from > 180 ? 1 : 0
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`
}

export function Knob({ value, min, max, defaultValue, onChange, label, tick }: Props) {
  const drag = useRef<{ x: number; y: number; v: number } | null>(null)
  const lastTap = useRef(0)

  const norm = (value - min) / (max - min)
  const angle = START + norm * SWEEP

  const set = (v: number) => {
    const next = Math.round(Math.min(max, Math.max(min, v)))
    if (next === value) return
    if (tick && Math.floor(next / 5) !== Math.floor(value / 5)) haptics.pulse(2)
    onChange(next)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    const now = performance.now()
    if (now - lastTap.current < 300) {
      set(defaultValue)
      lastTap.current = 0
      drag.current = null
      return
    }
    lastTap.current = now
    drag.current = { x: e.clientX, y: e.clientY, v: value }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    // Up or right increases.
    const delta = d.y - e.clientY + (e.clientX - d.x)
    set(d.v + (delta / TRAVEL) * (max - min))
  }

  const end = () => {
    drag.current = null
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') set(value + 1)
    else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') set(value - 1)
    else return
    e.preventDefault()
  }

  const [px, py] = polar(32, 32, 15, angle)
  const [ix, iy] = polar(32, 32, 7, angle)

  return (
    <div
      className="knob"
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={end}
      onPointerCancel={end}
      onKeyDown={onKeyDown}
    >
      {/* Cropped to the outer edge of the track so the knob is flush with the page gutters. */}
      <svg viewBox="3.5 3.5 57 57" aria-hidden="true">
        <path className="knob-track" d={arc(32, 32, 27, START, START + SWEEP)} />
        {norm > 0.001 && <path className="knob-value" d={arc(32, 32, 27, START, angle)} />}
        <circle className="knob-body" cx="32" cy="32" r="20" />
        <line className="knob-pointer" x1={ix} y1={iy} x2={px} y2={py} />
      </svg>
    </div>
  )
}
