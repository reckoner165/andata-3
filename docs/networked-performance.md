# Networked haptic ensemble — performance concept

## The idea

Several cheap Android phones each run ANDATA-3 and sit on different surfaces — paper, sheet metal, a snare head, strings, wood, tins. Each phone's vibration motor excites its surface. Contact mics on the **surfaces** (not the phones) feed a mixer, optionally through effects. A central computer acts as conductor: it keeps every phone on one clock and tempo, and sends each phone its own pattern.

- Every phone plays a **different pattern**
- All phones share the **same BPM**
- Steps **hit at the same time** across all phones

## Architecture

```
            ┌──────────────── conductor laptop ────────────────┐
 OSC (UDP)  │  Node server                                      │
 Max / Live ─▶  • serves the web app (HTTPS, self-signed)        │
 SC / TD    │  • WebSocket hub: clock + transport + patterns    │
            │  • conductor page (all voices, one row each)      │
            └───────────────┬───────────────────────────────────┘
                            │ WebSocket over local Wi-Fi (offline router)
        ┌───────────┬───────┴─────┬─────────────┐
     phone:snare  phone:paper  phone:tin   phone:strings  …
        │            │            │             │
     surface      surface      surface       surface
        │            │            │             │
     contact mic → Hi-Z preamp / DI → mixer → FX → PA
```

### Phones = voices
- On join, a phone picks or gets a voice name (`snare`, `paper`, `tin`…) shown large on screen.
- Plays whatever pattern it's sent, locked to the shared clock.
- Local editing can stay available; in performance the conductor owns the pattern.
- Falls back to standalone mode (current app behaviour) when no server is reachable.

### Shared clock (sync)
Share **time**, not ticks — no per-step network messages.

1. **Clock offset per phone**: NTP-style pings. Phone sends `t0`, server replies with `serverTime`, phone receives at `t1`. Keep the sample with the smallest round trip: `offset = serverTime − (t0 + t1) / 2`. Re-sync every 10–20 s to absorb drift.
2. **Transport is just state**: server broadcasts `{ playing, bpm, startAt }`. On play, `startAt` = server time ~250 ms in the future so every phone has it before it begins.
3. **Each phone derives the step locally**:
   `step = floor((performance.now() + offset − startAt) / stepMs) % 16`
   Same math on the same clock ⇒ aligned steps. Late joiners or reconnects drop straight in on the right step.
4. **Tempo changes** re-anchor at the next step/bar boundary (`startAt` + new `bpm`) so phase stays continuous.
5. **Pattern changes are quantized**: server queues them, phones swap at the next bar.

Expected alignment: ~5–15 ms between phones on a decent Wi-Fi link — the jitter is mostly phone timers, not the network. At 5–150 ms pulses that reads as simultaneous.

### Conductor page
- One row per connected voice: name, 16 steps (on/off + duration), connection/latency indicator.
- Global play/stop and BPM.
- Per-voice mute/solo and **test buzz** (for soundcheck and finding phones that have silently stopped vibrating).

### OSC bridge
Server listens for OSC over UDP so the system can be driven from Max, Ableton (Max for Live), SuperCollider, TouchDesigner or a hardware controller. Sketch of the address space:

| Address | Args | Effect |
|---|---|---|
| `/andata/bpm` | `float` | Set tempo (re-anchored at next step) |
| `/andata/play` / `/andata/stop` | — | Transport |
| `/andata/<voice>/pattern` | 16 × `int` (0 = off, else ms) | Replace pattern, lands on next bar |
| `/andata/<voice>/step` | `int index, int ms` | Set one step (0 ms = off) |
| `/andata/<voice>/mute` | `int 0/1` | Mute voice |
| `/andata/<voice>/test` | `int ms` | One-shot buzz |

Opens up a feedback loop: analyse the contact-mic audio on the computer and generate patterns from it.

## Acoustic notes

- **Motor type is the palette.**
  - *Spinning (ERM) motors*, common in cheap/older Androids: pitch rises as the motor spins up, so short pulses are low thuds and long pulses glide upward — the duration knob shapes timbre as well as length.
  - *Linear (LRA) motors*, in mid-range and better phones: fixed resonant frequency (~150–230 Hz, varies by model) — each phone is effectively one pitch.
- **Contact with the surface matters more than motor power.** Tape, weight or wedge phones for strong excitation. Loose contact (rattles, paper buzz, skittering on metal) is also a usable sound.
- **Mic placement**: mount contact mics on the surface, away from the phone, to hear the material more than the phone body.
- Possible later hybrid: surface transducers / exciters driven from an audio interface for more power and arbitrary waveforms.

## Gear

### Phones
- Android 8+ with a still-updated Chrome. iPhones are out — Safari can't vibrate from a timer.
- Test before buying: open the app on GitHub Pages, enable haptics, TAP-mode steps at 5 / 50 / 150 ms. Listen for motor strength and whether pitch climbs on long pulses (spinning) or stays fixed (linear). Collect a mix.
- Good hunting ground: old Moto E/G, Samsung Galaxy A0x/J, Nokia 1–3.x.
- Battery health matters, or plan to run them plugged in (vibrating while charging is fine). Multi-port USB charger + short cables.

### Router
- Any cheap router; it never touches the internet.
- Prefer 5 GHz if the phones support it (less crowded in venues).
- DHCP reservation for the laptop so the server URL never changes.
- Disable band steering / "smart connect".

### Contact mics
- Piezo discs need a **high-impedance input** — Hi-Z/instrument input, DI box, or a JFET piezo preamp. Into a normal mic/line input they sound thin with no low end.
- Mounting: Blu Tack / putty (removable, good coupling), superglue / epoxy (strongest, brightest), gaffer tape (works, damps a little).
- Shielded cable; piezos pick up hum.
- Expect to EQ: piezos are mid-heavy; low-cut for handling/table thumps.

## Show-day checklist
- Dedicated offline router; laptop on a fixed IP.
- HTTPS (self-signed) so phones can use the Wake Lock API and keep screens on; accept the cert once per phone.
- Install the app to each home screen (fullscreen PWA).
- Check every phone's settings: Do Not Disturb, battery saver, silent mode and system vibration intensity can each silence `navigator.vibrate`.
- Test-buzz every voice from the conductor during soundcheck.

## Build plan
1. **Deploy to GitHub Pages** — test motors on phones in shops, no install.
2. **Sync server + voices + shared transport** — `server.js` (serve `dist/`, WebSocket clock/transport), `src/useSync.ts` (connect, offset estimation, shared transport), sequencer loop derives step from the shared clock; "connected · N phones" indicator.
3. **Conductor page** — per-voice patterns pushed from the laptop, quantized to the bar.
4. **OSC bridge** — address space above.
5. **Show tools** — test buzz, per-phone latency/signal, mute/solo, Wake Lock, PWA manifest.

## Open questions
- Primary performance environment: Max, Ableton, SuperCollider, TouchDesigner, or the conductor page alone? Decides whether the OSC bridge or the conductor UI comes first.
- Should phones keep local editing during a performance, or be pure receivers?
- Any need for per-voice tempo multipliers (half-time / double-time voices, polymeters)?
