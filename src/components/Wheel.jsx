import { useState, useRef, useCallback, useEffect } from 'react'

const SPIN_DURATION_MS = 2000

export default function Wheel({
  options,
  onFinish,
  onSpinningChange,
  buttonLabel = 'Spin',
}) {
  const [displayed, setDisplayed] = useState(options[0] ?? '')
  const [spinning, setSpinning] = useState(false)
  const frameRef = useRef(null)

  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [])

  useEffect(() => {
    if (!spinning && options.length > 0) {
      setDisplayed(options[0])
    }
  }, [options, spinning])

  const setSpinState = useCallback(
    (value) => {
      setSpinning(value)
      onSpinningChange?.(value)
    },
    [onSpinningChange],
  )

  const spin = useCallback(() => {
    if (spinning || options.length === 0) return

    const finalIndex = Math.floor(Math.random() * options.length)
    const totalSteps = options.length * 3 + finalIndex
    const startTime = performance.now()

    setSpinState(true)

    const tick = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / SPIN_DURATION_MS, 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      const step = Math.floor(eased * totalSteps)

      setDisplayed(options[step % options.length])

      if (progress >= 1) {
        const result = options[finalIndex]
        setDisplayed(result)
        setSpinState(false)
        onFinish(result)
        return
      }

      frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)
  }, [options, onFinish, spinning, setSpinState])

  return (
    <div style={styles.container}>
      <div style={styles.display}>{displayed || '—'}</div>
      <button
        type="button"
        style={styles.button}
        onClick={spin}
        disabled={spinning || options.length === 0}
      >
        {spinning ? 'Spinning…' : buttonLabel}
      </button>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },
  display: {
    width: '280px',
    padding: '2rem 1.5rem',
    backgroundColor: '#2a2a2a',
    border: '2px solid #444',
    borderRadius: '8px',
    fontSize: '1.5rem',
    fontWeight: 600,
    textAlign: 'center',
    minHeight: '5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    padding: '0.75rem 2rem',
    fontSize: '1rem',
    fontWeight: 600,
    color: '#fff',
    backgroundColor: '#3b82f6',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
}
