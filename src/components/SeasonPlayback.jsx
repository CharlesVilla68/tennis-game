import { useEffect, useMemo, useState } from "react";
import SeasonResults from "./SeasonResults";

const APPROACH_MS = 650;
const REVEAL_MS = 850;

function buildSteps(season) {
  const events = season.finals
    ? [...season.results, season.finals]
    : season.results;
  const steps = [];
  events.forEach((event) => {
    event.matchLog.forEach((m, idx) => {
      steps.push({
        tournament: event.tournament,
        round: m.round,
        oppRating: m.oppRating,
        won: m.won,
        isFirstRoundOfEvent: idx === 0,
      });
    });
  });
  return steps;
}

export default function SeasonPlayback({ season, onRestart }) {
  const steps = useMemo(() => buildSteps(season), [season]);
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState("approaching");
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (finished || steps.length === 0) return;
    setPhase("approaching");

    const revealTimer = setTimeout(() => setPhase("revealed"), APPROACH_MS);
    const advanceTimer = setTimeout(() => {
      if (stepIndex + 1 >= steps.length) {
        setFinished(true);
      } else {
        setStepIndex((i) => i + 1);
      }
    }, APPROACH_MS + REVEAL_MS);

    return () => {
      clearTimeout(revealTimer);
      clearTimeout(advanceTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, finished]);

  if (finished || steps.length === 0) {
    return <SeasonResults season={season} onRestart={onRestart} />;
  }

  const step = steps[stepIndex];

  return (
    <section className="season-playback">
      {step.isFirstRoundOfEvent && (
        <p className="playback-tournament-title">{step.tournament}</p>
      )}

      <div className={`playback-card playback-${phase}`}>
        <p className="playback-round">{step.round}</p>
        <p className="playback-opponent">vs. {step.oppRating}-rated opponent</p>
        {phase === "revealed" && (
          <p
            className={`playback-outcome ${
              step.won ? "playback-win" : "playback-loss"
            }`}>
            {step.won ? "WIN" : "LOSS"}
          </p>
        )}
      </div>

      <button
        type="button"
        className="secondary-button"
        onClick={() => setFinished(true)}>
        Skip to Recap
      </button>
    </section>
  );
}
