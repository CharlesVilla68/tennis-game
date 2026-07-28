import { useMemo, useState } from "react";
import Wheel from "./components/Wheel";
import { getPlayersForYear } from "./utils/getPlayersForYear";

const MIN_YEAR = 1968;
const MAX_YEAR = 2024;

const ASPECTS = [
  "forehand",
  "backhand",
  "serve",
  "footwork",
  "mentality",
  "speed",
  "netPlay",
  "stamina",
];

const ASPECT_LABELS = {
  forehand: "Forehand",
  backhand: "Backhand",
  serve: "Serve",
  footwork: "Footwork",
  mentality: "Mentality",
  speed: "Speed",
  netPlay: "Net Play",
  stamina: "Stamina",
};

function App() {
  const [startYear, setStartYear] = useState(1990);
  const [endYear, setEndYear] = useState(2020);
  const [lockedRange, setLockedRange] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [myPlayer, setMyPlayer] = useState({});

  const isValidRange =
    startYear <= endYear && startYear >= MIN_YEAR && endYear <= MAX_YEAR;

  const remainingAspects = ASPECTS.filter((aspect) => !(aspect in myPlayer));
  const isComplete = remainingAspects.length === 0;

  const yearOptions = useMemo(() => {
    if (!lockedRange) return [];
    const { start, end } = lockedRange;
    return Array.from({ length: end - start + 1 }, (_, i) => String(start + i));
  }, [lockedRange]);

  const matchingPlayers = useMemo(() => {
    if (!selectedYear) return [];
    return getPlayersForYear(selectedYear);
  }, [selectedYear]);

  const playerOptions = useMemo(
    () => matchingPlayers.map((player) => player.name),
    [matchingPlayers]
  );

  const handleStart = () => {
    if (!isValidRange) return;
    setLockedRange({ start: startYear, end: endYear });
    setSelectedYear(null);
    setSelectedPlayer(null);
  };

  const handleRestart = () => {
    setLockedRange(null);
    setSelectedYear(null);
    setSelectedPlayer(null);
    setSpinning(false);
    setMyPlayer({});
  };

  const handleDraftAspect = (aspect) => {
    if (!selectedPlayer) return;
    setMyPlayer((prev) => ({
      ...prev,
      [aspect]: {
        value: selectedPlayer.ratings[aspect],
        from: selectedPlayer.name,
      },
    }));
    setSelectedYear(null);
    setSelectedPlayer(null);
  };

  const overallRating = isComplete
    ? Math.round(
        ASPECTS.reduce((sum, aspect) => sum + myPlayer[aspect].value, 0) /
          ASPECTS.length
      )
    : null;

  return (
    <div className="app">
      <h1>Tennis 38-0</h1>

      {Object.keys(myPlayer).length > 0 && (
        <section className="my-player">
          <h2>My Player{isComplete ? ` — Overall ${overallRating}` : ""}</h2>
          <ul className="my-player-list">
            {ASPECTS.map((aspect) =>
              myPlayer[aspect] ? (
                <li key={aspect}>
                  <span className="aspect-name">{ASPECT_LABELS[aspect]}</span>
                  <span className="aspect-value">{myPlayer[aspect].value}</span>
                  <span className="aspect-from">
                    from {myPlayer[aspect].from}
                  </span>
                </li>
              ) : (
                <li key={aspect} className="aspect-empty">
                  <span className="aspect-name">{ASPECT_LABELS[aspect]}</span>
                  <span className="aspect-value">—</span>
                </li>
              )
            )}
          </ul>
        </section>
      )}

      {isComplete ? (
        <>
          <p className="result">Your player is complete!</p>
          <button
            type="button"
            className="primary-button"
            onClick={handleRestart}>
            Build Another Player
          </button>
        </>
      ) : !lockedRange ? (
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
            onClick={handleStart}>
            Start
          </button>
        </>
      ) : (
        <>
          <p className="locked-range">
            Years {lockedRange.start}–{lockedRange.end} ·{" "}
            {remainingAspects.length} aspect
            {remainingAspects.length === 1 ? "" : "s"} left to draft
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
                    const player = matchingPlayers.find((p) => p.name === name);
                    setSelectedPlayer(player);
                  }}
                />
              )}

              {!selectedPlayer && matchingPlayers.length === 0 && (
                <p className="error">
                  No players were active in {selectedYear}. Restart to try a new
                  range.
                </p>
              )}

              {selectedPlayer && (
                <>
                  <p className="result">Your player: {selectedPlayer.name}</p>
                  <p className="locked-range">Pick one stat to draft:</p>
                  <div className="aspect-grid">
                    {remainingAspects.map((aspect) => (
                      <button
                        key={aspect}
                        type="button"
                        className="aspect-button"
                        onClick={() => handleDraftAspect(aspect)}>
                        <span className="aspect-name">
                          {ASPECT_LABELS[aspect]}
                        </span>
                        <span className="aspect-value">
                          {selectedPlayer.ratings[aspect]}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          <button
            type="button"
            className="secondary-button"
            disabled={spinning}
            onClick={handleRestart}>
            Restart
          </button>
        </>
      )}
    </div>
  );
}

export default App;
