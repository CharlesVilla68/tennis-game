import { useMemo, useState } from "react";
import Wheel from "./components/Wheel";
import { getPlayersForYear } from "./utils/getPlayersForYear";

const MIN_YEAR = 1968;
const MAX_YEAR = 2026;
const YEAR_SPIN_MS = 1000;
const PLAYER_SPIN_MS = 1500; // finishes ~0.5s after the year reel

const DECADE_OPTIONS = [1968, 1970, 1980, 1990, 2000, 2010, 2020, 2026];

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

const GENDER_LABELS = {
  both: "All Players",
  M: "Men's",
  F: "Women's",
};

function App() {
  const [startYear, setStartYear] = useState(1990);
  const [endYear, setEndYear] = useState(2020);
  const [genderFilter, setGenderFilter] = useState("both");
  const [lockedRange, setLockedRange] = useState(null);
  const [lockedGender, setLockedGender] = useState("both");
  const [myPlayer, setMyPlayer] = useState({});

  const [spinToken, setSpinToken] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [roundYearTarget, setRoundYearTarget] = useState(null);
  const [roundPlayerOptions, setRoundPlayerOptions] = useState([]);
  const [roundPlayerTarget, setRoundPlayerTarget] = useState(null);
  const [roundMatches, setRoundMatches] = useState([]);
  const [roundPlayer, setRoundPlayer] = useState(null);
  const [noMatchError, setNoMatchError] = useState(false);

  const isValidRange =
    startYear <= endYear && startYear >= MIN_YEAR && endYear <= MAX_YEAR;

  const filledAspects = ASPECTS.filter((aspect) => myPlayer[aspect]);
  const remainingAspects = ASPECTS.filter((aspect) => !(aspect in myPlayer));
  const isComplete = remainingAspects.length === 0;

  const currentAverage =
    filledAspects.length > 0
      ? Math.round(
          filledAspects.reduce(
            (sum, aspect) => sum + myPlayer[aspect].value,
            0
          ) / filledAspects.length
        )
      : null;

  const yearOptions = useMemo(() => {
    if (!lockedRange) return [];
    const { start, end } = lockedRange;
    return Array.from({ length: end - start + 1 }, (_, i) => String(start + i));
  }, [lockedRange]);

  const handleStart = () => {
    if (!isValidRange) return;
    setLockedRange({ start: startYear, end: endYear });
    setLockedGender(genderFilter);
    resetRound();
  };

  const resetRound = () => {
    setRoundYearTarget(null);
    setRoundPlayerOptions([]);
    setRoundPlayerTarget(null);
    setRoundMatches([]);
    setRoundPlayer(null);
    setNoMatchError(false);
  };

  const handleRestart = () => {
    setLockedRange(null);
    setMyPlayer({});
    setSpinning(false);
    setSpinToken(0);
    resetRound();
  };

  const handleSpin = () => {
    if (spinning || yearOptions.length === 0) return;

    let year = null;
    let matches = [];
    for (let i = 0; i < 50; i++) {
      const candidate =
        yearOptions[Math.floor(Math.random() * yearOptions.length)];
      const found = getPlayersForYear(candidate, lockedGender);
      if (found.length > 0) {
        year = candidate;
        matches = found;
        break;
      }
    }

    if (!year) {
      setNoMatchError(true);
      return;
    }

    const player = matches[Math.floor(Math.random() * matches.length)];

    setRoundYearTarget(year);
    setRoundMatches(matches);
    setRoundPlayerOptions(matches.map((p) => p.name));
    setRoundPlayerTarget(player.name);
    setRoundPlayer(null);
    setNoMatchError(false);
    setSpinning(true);
    setSpinToken((t) => t + 1);
  };

  const handlePlayerLanded = (name) => {
    const player = roundMatches.find((p) => p.name === name);
    setRoundPlayer(player);
    setSpinning(false);
  };

  const handleDraftAspect = (aspect) => {
    if (!roundPlayer) return;
    setMyPlayer((prev) => ({
      ...prev,
      [aspect]: {
        value: roundPlayer.ratings[aspect],
        from: roundPlayer.name,
      },
    }));
    resetRound();
  };

  return (
    <div className="app">
      <h1>Tennis 38-0</h1>

      {filledAspects.length > 0 && (
        <section className="my-player">
          <h2>
            My Player — Avg {currentAverage}
            {!isComplete && (
              <span className="progress-badge">
                {filledAspects.length}/{ASPECTS.length}
              </span>
            )}
          </h2>
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
          <section className="gender-picker">
            {Object.entries(GENDER_LABELS).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`gender-button${
                  genderFilter === value ? " active" : ""
                }`}
                onClick={() => setGenderFilter(value)}>
                {label}
              </button>
            ))}
          </section>

          <section className="year-picker">
            <label>
              Start year
              <select
                value={startYear}
                onChange={(e) => setStartYear(Number(e.target.value))}>
                {DECADE_OPTIONS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
            <label>
              End year
              <select
                value={endYear}
                onChange={(e) => setEndYear(Number(e.target.value))}>
                {DECADE_OPTIONS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
          </section>

          {!isValidRange && (
            <p className="error">
              Start year must be before or equal to end year.
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
            {GENDER_LABELS[lockedGender]} · {remainingAspects.length} aspect
            {remainingAspects.length === 1 ? "" : "s"} left
          </p>

          <div className="spin-row">
            <Wheel
              options={yearOptions}
              targetValue={roundYearTarget}
              spinToken={spinToken}
              spinMs={YEAR_SPIN_MS}
              label="Year"
            />
            <Wheel
              options={roundPlayerOptions}
              targetValue={roundPlayerTarget}
              spinToken={spinToken}
              spinMs={PLAYER_SPIN_MS}
              label="Player"
              onLanded={handlePlayerLanded}
            />
          </div>

          {noMatchError && (
            <p className="error">
              Couldn't find an active player in a sampled year — try Spin again.
            </p>
          )}

          {!roundPlayer && (
            <button
              type="button"
              className="primary-button"
              disabled={spinning}
              onClick={handleSpin}>
              {spinning ? "Spinning…" : "Spin"}
            </button>
          )}

          {roundPlayer && (
            <>
              <p className="result">
                Your player: {roundPlayer.name} ({roundYearTarget})
              </p>
              <p className="locked-range">Pick one stat to draft:</p>
              <div className="aspect-grid">
                {remainingAspects.map((aspect) => (
                  <button
                    key={aspect}
                    type="button"
                    className="aspect-button"
                    onClick={() => handleDraftAspect(aspect)}>
                    <span className="aspect-name">{ASPECT_LABELS[aspect]}</span>
                    <span className="aspect-value">
                      {roundPlayer.ratings[aspect]}
                    </span>
                  </button>
                ))}
              </div>
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
