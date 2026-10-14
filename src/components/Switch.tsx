type Props = {
  on: boolean
  onToggle: () => void
  label: string
  size?: 'sm' | 'lg'
  /** Draws a soft pulsing outline to invite a tap. */
  attention?: boolean
}

export function Switch({ on, onToggle, label, size = 'sm', attention }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`switch switch-${size}${on ? ' is-on' : ''}${attention ? ' is-attention' : ''}`}
      onClick={onToggle}
    >
      <span className="switch-thumb" />
    </button>
  )
}
