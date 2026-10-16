// Haptic engine.
// Android / Chrome: Vibration API, with variable duration. A new vibrate()
// call cancels the running one, which gives us the choke for free.
// iOS Safari has no Vibration API; toggling an `<input type="checkbox" switch>`
// via its label produces a system haptic tick (iOS 18+). Duration can't be
// controlled there, so every pulse becomes a tap.

export const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator

const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
// iPadOS reports itself as a Mac, so also check for a touch screen.
export const isIOS =
  /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1)
// Desktop browsers may expose navigator.vibrate but have no motor to drive.
export const isDesktop = !isIOS && !/Android|Mobi/i.test(ua)

let enabled = false
let iosLabel: HTMLLabelElement | null = null

function ensureIosSwitch() {
  if (iosLabel || canVibrate || typeof document === 'undefined') return
  const id = 'haptic-switch-' + Math.random().toString(36).slice(2)
  const input = document.createElement('input')
  input.type = 'checkbox'
  input.id = id
  input.setAttribute('switch', '')
  const label = document.createElement('label')
  label.htmlFor = id
  for (const el of [input, label]) {
    el.setAttribute('aria-hidden', 'true')
    Object.assign(el.style, {
      position: 'fixed',
      left: '-9999px',
      opacity: '0',
      pointerEvents: 'none',
    })
  }
  document.body.append(input, label)
  iosLabel = label
}

export function setEnabled(on: boolean) {
  enabled = on
  if (on) {
    // Called from the switch's gesture handler, so this counts as user activation.
    ensureIosSwitch()
    pulse(1)
  } else {
    stop()
  }
}

export function isEnabled() {
  return enabled
}

export function pulse(ms: number) {
  if (!enabled) return
  if (canVibrate) {
    navigator.vibrate(Math.max(1, Math.round(ms)))
  } else {
    iosLabel?.click()
  }
}

export function stop() {
  if (canVibrate) navigator.vibrate(0)
}
