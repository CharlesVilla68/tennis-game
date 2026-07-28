import { useState, useRef, useCallback, useEffect } from 'react'

export default function Wheel({ options, onFinish }) {
  const [displayed, setDisplayed] = useState(options[0] ?? '')
  const [spinning, setSpinning] = useState(false)
  const timeoutRef = useRef(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (!spinning && options.length > 0) {
      setDisplayed(options[0])
    }
  }, [options, spinning])

  const spin = useCallback(() => {
    if (spinning || options.length === 0) return

    const finalIndex = Math.floor(Math.random() * options.length)
    const totalSteps = options.length * 4 + finalIndex
    let step = 0

    setSpinning(true)

    const tick = () => {
      setDisplayed(options[step % options.length])

      if (step >= totalSteps) {
        const result = options[finalIndex]
        setSpinning(false)
        onFinish(result)
        return
      }

      step += 1
      const progress = step / totalSteps
      const delay = 40 + progress * progress * 350
      timeoutRef.current = setTimeout(tick, delay)
    }

    tick()
  }, [options, onFinish, spinning])

  return (
    <div style={styles.container}>
      <div style={styles.display}>{displayed || '—'}</div>
      <button
        type="button"
        style={styles.button}
        onClick={spin}
        disabled={spinning || options.length === 0}
      >
        {spinning ? 'Spinning…' : 'Spin'}
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
