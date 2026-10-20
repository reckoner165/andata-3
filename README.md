<p align="center">
  <img src="public/favicon.svg" width="96" height="96" alt="ANDATA-3 logo: four orange crooked lines" />
</p>

<h1 align="center">ANDATA-3</h1>
<p align="center"><b>Haptics Sequencer</b></p>

<p align="center">
  A 16-step sequencer that plays your phone's vibration motor instead of sound.
</p>

---

## What it is

ANDATA-3 is a mobile-first web app built with React, TypeScript and Vite. Each of its 16 steps has:

- a **knob** for pulse duration, from 5 ms (short) to 150 ms (long)
- a **switch** that turns the step on or off
- a **light** that shows when the step plays

Long pulses are **choked** by the next active step, like an open and closed hi-hat, with a full range of durations in between.

### Controls

| Control | What it does |
|---|---|
| **ON / OFF** switch (top right) | Turns haptics on. Browsers only allow vibration after a user gesture, so this tap unlocks it. While it's off, the rest of the UI is dimmed and inactive. |
| **Knob** | Drag up or right to lengthen, down or left to shorten. Double-tap resets it to 20 ms. Arrow keys also work. |
| **Step switch** | In SEQ mode, turns the step on or off. In TAP mode, it becomes a pad that plays that step's pulse. |
| **Play / Stop** | One button. Plays the sequence in SEQ mode and is disabled in TAP mode. |
| **Tempo** | 40 to 300 BPM in 16th notes. Use − and +, or drag the number up or down. |
| **TAP / SEQ** | Switches between playing steps by hand and running the sequence. |
| **CLEAR** | Turns every step off and sets every duration to 5 ms. |
| **RANDOM** | Gives every step a random duration and turns about 60% of steps on. |

The pattern, tempo and mode are saved in the browser's `localStorage`.

## Platform support

| Platform | Support |
|---|---|
| **Android, Chrome** | Full support. Uses the Vibration API with variable durations. |
| **iPhone / iPad, Safari 18+** | Limited. Safari has no Vibration API. The app falls back to toggling a hidden `<input type="checkbox" switch>`, which plays a fixed system tap. Durations are ignored, and timer-driven playback will likely be silent. A banner warns iOS users. |
| **Desktop** | No vibration hardware. The UI works, and a note under the switch says so. |

## Getting started

Requires Node 20 or newer.

```bash
git clone git@github.com:reckoner165/andata-3.git
cd andata-3
npm install
npm run dev
```

### Testing on a phone

Haptics need a real phone. Run the dev server so it is reachable on your local network:

```bash
npm run dev -- --host
```

Open the **Network** URL it prints on a phone connected to the same Wi-Fi, then switch haptics **ON**.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server with hot reload |
| `npm run build` | Type-check with `tsc`, then build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Lint with oxlint |

## Architecture

```
src/
├── main.tsx              entry point, loads fonts and global CSS
├── App.tsx               layout: header, haptics lock, step grid, transport
├── constants.ts          step count, duration range, tempo range
├── haptics.ts            haptic engine and platform detection
├── useSequencer.ts       sequencer state and clock
├── index.css             design tokens, powder-coat texture, layout
└── components/
    ├── Knob.tsx          SVG rotary knob with pointer drag
    ├── Switch.tsx        toggle switch (steps and the haptics switch)
    ├── StepCell.tsx      one step: number, light, knob, value, switch or pad
    └── Transport.tsx     play/stop, tempo, TAP/SEQ, CLEAR, RANDOM
```

### Haptic engine (`src/haptics.ts`)

- `setEnabled(on)` is called from the haptics switch's tap. That tap counts as a user gesture, which unlocks vibration. On iOS it also creates the hidden switch used for the fallback.
- `pulse(ms)` calls `navigator.vibrate(ms)` where it exists. A new call cancels any running vibration, which is how the choke works. On iOS it clicks the hidden switch's label instead.
- `stop()` cancels any running vibration.
- `isIOS` and `isDesktop` drive the warning banner and the desktop note. Desktop Chrome exposes `navigator.vibrate` even with no motor, so desktop is detected from the user agent.

### Sequencer clock (`src/useSequencer.ts`)

- A `setTimeout` loop timed with `performance.now()` corrects its own drift. One step is a 16th note: `60000 / bpm / 4` ms.
- Haptics can't be scheduled ahead of time the way Web Audio can, so each pulse fires when its step comes up.
- **Choke:** a step's pulse is capped at the time until the next active step: `min(duration, gap × stepMs)`.
- If the tab stalls, the clock resyncs instead of firing a burst of missed steps.
- Tempo and step edits are read from refs, so they apply while playing.

### Layout and design

- **Mobile first, one screen.** The app is exactly `100dvh` tall. The step grid is a size container, and knob size is calculated from its container-query units, so everything fits without scrolling from iPhone SE size up.
- **Alignment.** The outer step columns sit flush with the page margins, in line with the header and transport.
- **Look.** Dark mode with white and gray text, and a powder-coat texture made from an inline SVG `feTurbulence` noise. No nested panels; the transport is outlined only.
- **Fonts.** [VG5000](https://velvetyne.fr/fonts/vg5000/) by Justin Bihan (Velvetyne, SIL OFL) for the logo and all numbers, self-hosted in `public/fonts/`. [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) via `@fontsource/space-grotesk` for UI text.
- **Icons.** [Radix Icons](https://www.radix-ui.com/icons).

### Configuration

Ranges live in `src/constants.ts`:

| Constant | Default |
|---|---|
| `STEPS` | 16 |
| `MIN_MS` / `MAX_MS` | 5 / 150 |
| `DEFAULT_MS` | 20 (knob double-tap reset) |
| `MIN_BPM` / `MAX_BPM` | 40 / 300 |
| `DEFAULT_BPM` | 120 |

## Roadmap

[`docs/networked-performance.md`](docs/networked-performance.md) describes a networked performance version: many Android phones on different surfaces (paper, metal, snare, strings), recorded with contact mics and kept on one clock by a central conductor. Each phone plays its own pattern and every step lands at the same time. Pattern changes and an OSC bridge come from the computer.

## License

The VG5000 font is distributed under the SIL Open Font License; see `public/fonts/VG5000-LICENSE.txt`.
