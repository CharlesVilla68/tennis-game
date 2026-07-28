import { useMemo, useState } from 'react'
import Wheel from './components/Wheel'
import { getPlayersForYear } from './utils/getPlayersForYear'

const MIN_YEAR = 1968
const MAX_YEAR = 2024

function App() {
  const [startYear, setStartYear] = useState(1990)
  const [endYear, setEndYear] = useState(2020)
  const [lockedRange, setLockedRange] = useState(null)
  const [selectedYear, setSelectedYear] = useState(null)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [spinning, setSpinning] = useState(false)

  const isValidRange =
    startYear <= endYear && startYear >= MIN_YEAR && endYear <= MAX_YEAR

  const yearOptions = useMemo(() => {
    if (!lockedRange) return []
    const { start, end } = lockedRange
    return Array.from({ length: end - start + 1 }, (_, i) => String(start + i))
  }, [lockedRange])

  const matchingPlayers = useMemo(() => {
    if (!selectedYear) return []
    return getPlayersForYear(selectedYear)
  }, [selectedYear])

  const playerOptions = useMemo(
    () => matchingPlayers.map((player) => player.name),
    [matchingPlayers],
  )

  const handleStart = () => {
    if (!isValidRange) return
    setLockedRange({ start: startYear, end: endYear })
    setSelectedYear(null)
    setSelectedPlayer(null)
  }

  const handleRestart = () => {
    setLockedRange(null)
    setSelectedYear(null)
    setSelectedPlayer(null)
    setSpinning(false)
  }

  return (
    <div className="app">
      <h1>Tennis 38-0</h1>

      {!lockedRange ? (
        <>
          <section className="year-picker">
            <label>
              Start year
              <input
                type="number"
                min={MIN_YEAR}
                max={MAX_YEAR}
                value={startYear}
                onChange={(e) => setStartYear(Number(e.target.value))}
              />
            </label>
            <label>
              End year
              <input
                type="number"
                min={MIN_YEAR}
                max={MAX_YEAR}
                value={endYear}
                onChange={(e) => setEndYear(Number(e.target.value))}
              />
            </label>
          </section>

          {!isValidRange && (
            <p className="error">
              Enter a valid range ({MIN_YEAR}–{MAX_YEAR}, start ≤ end).
            </p>
          )}

          <button
            type="button"
            className="primary-button"
            disabled={!isValidRange}
            onClick={handleStart}
          >
            Start
          </button>
        </>
      ) : (
        <>
          <p className="locked-range">
            Years {lockedRange.start}–{lockedRange.end}
          </p>

          {!selectedYear ? (
            <Wheel
              options={yearOptions}
              buttonLabel="Spin for Year"
              onSpinningChange={setSpinning}
              onFinish={setSelectedYear}
            />
          ) : (
            <>
              <p className="result">Season: {selectedYear}</p>

              {!selectedPlayer && matchingPlayers.length > 0 && (
                <Wheel
                  key={selectedYear}
                  options={playerOptions}
                  buttonLabel="Spin for Player"
                  onSpinningChange={setSpinning}
                  onFinish={(name) => {
                    const player = matchingPlayers.find((p) => p.name === name)
                    setSelectedPlayer(player)
                  }}
                />
              )}

              {!selectedPlayer && matchingPlayers.length === 0 && (
                <p className="error">
                  No players were active in {selectedYear}. Restart to try a
                  new range.
                </p>
              )}

              {selectedPlayer && (
                <p className="result">Your player: {selectedPlayer.name}</p>
              )}
            </>
          )}

          <button
            type="button"
            className="secondary-button"
            disabled={spinning}
            onClick={handleRestart}
          >
            Restart
          </button>
        </>
      )}
    </div>
  )
}

export default App
