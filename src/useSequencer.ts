import { useCallback, useEffect, useRef, useState } from 'react'
import * as haptics from './haptics'
import { DEFAULT_BPM, MAX_BPM, MAX_MS, MIN_BPM, MIN_MS, STEPS } from './constants'

export type Step = { on: boolean; dur: number }
export type Mode = 'tap' | 'seq'

const STORAGE_KEY = 'haptic-seq:v1'

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

function defaultSteps(): Step[] {
  // A sweep from short to long so the pattern is felt immediately.
  return Array.from({ length: STEPS }, (_, i) => ({
    on: true,
    dur: Math.round(MIN_MS + ((MAX_MS - MIN_MS) * (i % 4)) / 3),
  }))
}

type Saved = { steps: Step[]; bpm: number; mode: Mode }

function load(): Saved {
  const fallback: Saved = { steps: defaultSteps(), bpm: DEFAULT_BPM, mode: 'seq' }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const s = JSON.parse(raw) as Partial<Saved>
    if (!Array.isArray(s.steps) || s.steps.length !== STEPS) return fallback
    return {
      steps: s.steps.map((st) => ({ on: !!st.on, dur: clamp(Number(st.dur) || MIN_MS, MIN_MS, MAX_MS) })),
      bpm: clamp(Number(s.bpm) || DEFAULT_BPM, MIN_BPM, MAX_BPM),
      mode: s.mode === 'tap' ? 'tap' : 'seq',
    }
  } catch {
    return fallback
  }
}

export function useSequencer() {
  const [initial] = useState(load)
  const [steps, setSteps] = useState<Step[]>(initial.steps)
  const [bpm, setBpmState] = useState(initial.bpm)
  const [mode, setModeState] = useState<Mode>(initial.mode)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(-1)

  // The clock reads these directly so tempo/step edits apply live.
  const stepsRef = useRef(steps)
  const bpmRef = useRef(bpm)
  stepsRef.current = steps
  bpmRef.current = bpm

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ steps, bpm, mode }))
    } catch {
      /* storage unavailable */
    }
  }, [steps, bpm, mode])

  useEffect(() => {
    if (!playing) return
    let step = 0
    let next = performance.now()
    let timer = 0

    const fire = (i: number) => {
      setCurrent(i)
      const all = stepsRef.current
      const s = all[i]
      if (!s.on) return
      // Choke: a pulse never rings past the next active step.
      const stepMs = 60000 / bpmRef.current / 4
      let gap = 1
      while (gap < STEPS && !all[(i + gap) % STEPS].on) gap++
      haptics.pulse(Math.min(s.dur, gap * stepMs))
    }

    const loop = () => {
      const now = performance.now()
      const stepMs = 60000 / bpmRef.current / 4
      // If the tab stalled, resync instead of firing a burst of missed steps.
      if (now - next > stepMs) next = now
      while (now >= next) {
        fire(step)
        step = (step + 1) % STEPS
        next += stepMs
      }
      timer = window.setTimeout(loop, Math.max(0, next - performance.now()))
    }
    loop()

    return () => {
      window.clearTimeout(timer)
      haptics.stop()
      setCurrent(-1)
    }
  }, [playing])

  const play = useCallback(() => {
    if (mode === 'seq') setPlaying(true)
  }, [mode])
  const stop = useCallback(() => setPlaying(false), [])

  const setMode = useCallback((m: Mode) => {
    if (m === 'tap') setPlaying(false)
    setModeState(m)
  }, [])

  const setBpm = useCallback((v: number) => setBpmState(clamp(Math.round(v), MIN_BPM, MAX_BPM)), [])

  const setDur = useCallback((i: number, dur: number) => {
    setSteps((prev) => prev.map((s, j) => (j === i ? { ...s, dur } : s)))
  }, [])

  const toggle = useCallback((i: number) => {
    setSteps((prev) => prev.map((s, j) => (j === i ? { ...s, on: !s.on } : s)))
  }, [])

  const clear = useCallback(() => {
    setSteps((prev) => prev.map(() => ({ on: false, dur: MIN_MS })))
  }, [])

  const randomize = useCallback(() => {
    setSteps((prev) =>
      prev.map(() => ({
        on: Math.random() < 0.6,
        dur: Math.round(MIN_MS + Math.random() * (MAX_MS - MIN_MS)),
      })),
    )
  }, [])

  return { steps, bpm, mode, playing, current, play, stop, setMode, setBpm, setDur, toggle, clear, randomize }
}
