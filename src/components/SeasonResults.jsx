const CATEGORY_LABELS = {
  grandSlam: "Grand Slam",
  masters1000: "Masters 1000",
  atp500: "ATP 500",
  atp250: "ATP 250",
  finals: "ATP Finals",
};

function formatMoney(amount) {
  return `$${amount.toLocaleString("en-US")}`;
}

export default function SeasonResults({ season, onRestart }) {
  const {
    results,
    finals,
    totalPoints,
    totalPrizeMoney,
    titles,
    qualifiedForFinals,
    estimatedRanking,
  } = season;

  return (
    <section className="season-results">
      <h2>Season Recap</h2>

      <p className="season-ranking">
        Finished the season ranked <strong>No. {estimatedRanking}</strong> in
        the world
      </p>

      <div className="season-summary">
        <div className="summary-stat">
          <span className="summary-value">{titles}</span>
          <span className="summary-label">Titles</span>
        </div>
        <div className="summary-stat">
          <span className="summary-value">
            {totalPoints.toLocaleString("en-US")}
          </span>
          <span className="summary-label">Ranking Points</span>
        </div>
        <div className="summary-stat">
          <span className="summary-value">{formatMoney(totalPrizeMoney)}</span>
          <span className="summary-label">Prize Money</span>
        </div>
      </div>

      <ul className="season-list">
        {results.map((r) => (
          <li
            key={r.tournament}
            className={`${r.result === "Champion" ? "season-title" : ""} ${
              !r.countedForRanking ? "season-uncounted" : ""
            }`}>
            <span className="season-category">
              {CATEGORY_LABELS[r.category]}
            </span>
            <span className="season-tournament">{r.tournament}</span>
            <span className="season-result">{r.result}</span>
          </li>
        ))}
        {finals && (
          <li className={finals.result === "Champion" ? "season-title" : ""}>
            <span className="season-category">{CATEGORY_LABELS.finals}</span>
            <span className="season-tournament">{finals.tournament}</span>
            <span className="season-result">{finals.result}</span>
          </li>
        )}
      </ul>

      {!qualifiedForFinals && (
        <p className="locked-range">
          Didn't reach the ranking points cutoff for the ATP Finals this season.
        </p>
      )}

      <button type="button" className="primary-button" onClick={onRestart}>
        Build Another Player
      </button>
    </section>
  );
}
