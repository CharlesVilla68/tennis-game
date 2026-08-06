import { useEffect, useMemo, useState } from "react";
import { CATEGORY_TEMPLATES } from "../data/tournaments";
import SeasonResults from "./SeasonResults";

const APPROACH_MS = 500;
const REVEAL_MS = 700;

const FINALS_ROUND_LABELS = [
  "Group Match 1",
  "Group Match 2",
  "Group Match 3",
  "Semifinal",
  "Final",
];

const CATEGORY_LABELS = {
  grandSlam: "Grand Slam",
  masters1000: "Masters 1000",
  atp500: "ATP 500",
  atp250: "ATP 250",
  finals: "ATP Finals",
};

function totalSegmentsFor(event) {
  if (event.category === "finals") return FINALS_ROUND_LABELS.length;
  return CATEGORY_TEMPLATES[event.category].rounds.length;
}

function buildEvents(season) {
  return season.finals
    ? [...season.results, { ...season.finals, category: "finals" }]
    : season.results;
}

export default function SeasonPlayback({ season, onRestart }) {
  const events = useMemo(() => buildEvents(season), [season]);
  const [eventIndex, setEventIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState("playing"); // 'playing' while the bar fills toward this round, 'result' while it flashes
  const [completed, setCompleted] = useState([]);
  const [finished, setFinished] = useState(false);

  const currentEvent = events[eventIndex];

  useEffect(() => {
    if (finished || !currentEvent) return;

    setPhase("playing");
    const resultTimer = setTimeout(() => setPhase("result"), APPROACH_MS);

    const advanceTimer = setTimeout(() => {
      const isLastStepOfEvent = stepIndex + 1 >= currentEvent.matchLog.length;
      if (!isLastStepOfEvent) {
        setStepIndex((i) => i + 1);
        return;
      }

      setCompleted((prev) => [...prev, currentEvent]);
      const isLastEvent = eventIndex + 1 >= events.length;
      if (isLastEvent) {
        setFinished(true);
      } else {
        setEventIndex((i) => i + 1);
        setStepIndex(0);
      }
    }, APPROACH_MS + REVEAL_MS);

    return () => {
      clearTimeout(resultTimer);
      clearTimeout(advanceTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventIndex, stepIndex, finished]);

  if (finished || !currentEvent) {
    return <SeasonResults season={season} onRestart={onRestart} />;
  }

  const step = currentEvent.matchLog[stepIndex];
  const segments = totalSegmentsFor(currentEvent);
  const isChampionStep =
    stepIndex === currentEvent.matchLog.length - 1 &&
    currentEvent.result === "Champion";

  return (
    <section className="season-playback">
      {completed.length > 0 && (
        <ul className="playback-log">
          {completed.map((e, i) => (
            <li
              key={`${e.tournament}-${i}`}
              className={e.result === "Champion" ? "season-title" : ""}>
              <span className="season-category">
                {CATEGORY_LABELS[e.category]}
              </span>
              <span className="season-tournament">{e.tournament}</span>
              <span className="season-result">{e.result}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="playback-current">
        <p className="playback-tournament-title">{currentEvent.tournament}</p>
        <p className="playback-category">
          {CATEGORY_LABELS[currentEvent.category]}
        </p>

        <div className="playback-bar">
          {Array.from({ length: segments }, (_, i) => {
            let segClass = "seg-upcoming";
            if (i < stepIndex) segClass = "seg-won";
            if (i === stepIndex) {
              if (phase === "playing") {
                segClass = "seg-active";
              } else if (step.won) {
                segClass = isChampionStep ? "seg-champion" : "seg-won-flash";
              } else {
                segClass = "seg-loss-flash";
              }
            }
            return <div key={i} className={`playback-segment ${segClass}`} />;
          })}
        </div>

        <p className="playback-round">{step.round}</p>
        <p className="playback-opponent">vs. {step.oppRating}-rated opponent</p>
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
