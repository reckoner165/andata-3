import { useState } from 'react'
import { ExclamationTriangleIcon } from '@radix-ui/react-icons'
import { Switch } from './components/Switch'
import { StepCell } from './components/StepCell'
import { Transport } from './components/Transport'
import { useSequencer } from './useSequencer'
import * as haptics from './haptics'

export default function App() {
  const seq = useSequencer()
  const [hapticsOn, setHapticsOn] = useState(false)

  const toggleHaptics = () => {
    const next = !hapticsOn
    haptics.setEnabled(next)
    setHapticsOn(next)
    if (!next) seq.stop()
  }

  let hint = ''
  if (hapticsOn && !haptics.canVibrate) hint = 'This browser plays taps only. Durations need Android.'
  else if (hapticsOn && seq.mode === 'tap') hint = 'Tap mode. Press a step to feel it.'

  return (
    <div className="app">
      {haptics.isIOS && (
        <div className="banner" role="alert">
          <ExclamationTriangleIcon className="banner-icon" aria-hidden="true" />
          Haptics are limited on iPhone and iPad. This may not work.
        </div>
      )}
      <header className="header">
        <div className="brand">
          <h1 className="logo">ANDATA-3</h1>
          <p className="tagline">Haptics Sequencer</p>
        </div>
        <label className="enable">
          <span className="enable-text">
            <span className="caption">{hapticsOn ? 'On' : 'Off'}</span>
            {haptics.isDesktop && <span className="enable-note">Requires haptics hardware. Won't work on desktop.</span>}
          </span>
          <Switch on={hapticsOn} onToggle={toggleHaptics} label="Enable haptics" size="lg" attention={!hapticsOn} />
        </label>
      </header>

      <p className="hint" aria-live="polite">
        {hint}
      </p>

      <div className={`body${hapticsOn ? '' : ' is-locked'}`} inert={!hapticsOn}>
        <main className="grid">
          {seq.steps.map((step, i) => (
            <StepCell
              key={i}
              index={i}
              step={step}
              mode={seq.mode}
              active={seq.current === i}
              playing={seq.playing}
              onDur={seq.setDur}
              onToggle={seq.toggle}
            />
          ))}
        </main>

        <Transport
          playing={seq.playing}
          bpm={seq.bpm}
          mode={seq.mode}
          onPlay={seq.play}
          onStop={seq.stop}
          onBpm={seq.setBpm}
          onMode={seq.setMode}
          onClear={seq.clear}
          onRandomize={seq.randomize}
        />
      </div>
    </div>
  )
}
