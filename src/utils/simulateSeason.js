import { SEASON_TEMPLATE, CATEGORY_TEMPLATES } from "../data/tournaments";

const LOGISTIC_SCALE = 15;
const FINALS_POINTS_THRESHOLD = 3600;

// Rough real-world points-to-ranking curve, used only to estimate where a
// season's point total would land you in the world rankings.
const RANKING_BREAKPOINTS = [
  { rank: 1, points: 11000 },
  { rank: 2, points: 9200 },
  { rank: 3, points: 8000 },
  { rank: 5, points: 6200 },
  { rank: 8, points: 5000 },
  { rank: 10, points: 4300 },
  { rank: 15, points: 3400 },
  { rank: 20, points: 2800 },
  { rank: 25, points: 2400 },
  { rank: 30, points: 2100 },
  { rank: 40, points: 1700 },
  { rank: 50, points: 1300 },
  { rank: 60, points: 1100 },
  { rank: 70, points: 950 },
  { rank: 80, points: 820 },
  { rank: 90, points: 720 },
  { rank: 100, points: 650 },
  { rank: 120, points: 500 },
  { rank: 150, points: 350 },
  { rank: 200, points: 220 },
  { rank: 300, points: 100 },
];

function estimateRanking(points) {
  if (points >= RANKING_BREAKPOINTS[0].points) return 1;
  for (let i = 0; i < RANKING_BREAKPOINTS.length - 1; i++) {
    const hi = RANKING_BREAKPOINTS[i];
    const lo = RANKING_BREAKPOINTS[i + 1];
    if (points <= hi.points && points >= lo.points) {
      const span = hi.points - lo.points;
      const progress = span === 0 ? 0 : (points - lo.points) / span;
      return Math.max(1, Math.round(lo.rank - progress * (lo.rank - hi.rank)));
    }
  }
  return 300;
}

function randomNormal(mean, spread) {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.min(99, Math.max(40, mean + z * (spread / 2)));
}

function winProbability(playerRating, oppRating) {
  return 1 / (1 + Math.pow(10, -(playerRating - oppRating) / LOGISTIC_SCALE));
}

function resolveSchedule() {
  return SEASON_TEMPLATE.map((slot) => {
    const base =
      slot.type === "fixed"
        ? slot.tournament
        : slot.options[Math.floor(Math.random() * slot.options.length)];
    return { ...base, month: slot.month, mandatory: slot.mandatory };
  });
}

function simulateTournament(tournament, playerRating) {
  const template = CATEGORY_TEMPLATES[tournament.category];
  const matchLog = [];

  for (const round of template.rounds) {
    const oppRating = Math.round(randomNormal(round.oppAvg, round.oppSpread));
    const won = Math.random() < winProbability(playerRating, oppRating);
    matchLog.push({ round: round.label, oppRating, won });

    if (!won) {
      return {
        tournament: tournament.name,
        category: tournament.category,
        month: tournament.month,
        mandatory: tournament.mandatory,
        result: round.label,
        points: round.points,
        prizeMoney: round.prizeMoney,
        matchLog,
      };
    }
  }

  return {
    tournament: tournament.name,
    category: tournament.category,
    month: tournament.month,
    mandatory: tournament.mandatory,
    result: "Champion",
    points: template.championPoints,
    prizeMoney: template.championPrize,
    matchLog,
  };
}

function simulateAtpFinals(playerRating) {
  const matchLog = [];
  let groupWins = 0;

  for (let i = 0; i < 3; i++) {
    const oppRating = Math.round(randomNormal(90, 3));
    const won = Math.random() < winProbability(playerRating, oppRating);
    matchLog.push({ round: `Group Match ${i + 1}`, oppRating, won });
    if (won) groupWins += 1;
  }

  if (groupWins < 2) {
    return {
      tournament: "ATP Finals",
      category: "finals",
      result: "Group Stage",
      points: 200 * groupWins,
      prizeMoney: 400000 * groupWins,
      matchLog,
    };
  }

  const sfOpp = Math.round(randomNormal(91, 3));
  const wonSF = Math.random() < winProbability(playerRating, sfOpp);
  matchLog.push({ round: "Semifinal", oppRating: sfOpp, won: wonSF });

  if (!wonSF) {
    return {
      tournament: "ATP Finals",
      category: "finals",
      result: "Semifinal",
      points: 400 + 200 * groupWins,
      prizeMoney: 1000000 + 400000 * groupWins,
      matchLog,
    };
  }

  const fOpp = Math.round(randomNormal(92, 3));
  const wonF = Math.random() < winProbability(playerRating, fOpp);
  matchLog.push({ round: "Final", oppRating: fOpp, won: wonF });

  return {
    tournament: "ATP Finals",
    category: "finals",
    result: wonF ? "Champion" : "Runner-up",
    points: (wonF ? 1500 : 1000) + 200 * groupWins,
    prizeMoney: (wonF ? 4500000 : 2000000) + 400000 * groupWins,
    matchLog,
  };
}

// Real ATP rule: only your best 19 results in a year count toward ranking
// points (20 with the Finals) — all 4 Slams, all 8 mandatory Masters 1000s,
// and your best 7 results from everything else (Monte-Carlo + 500s/250s).
function computeRankingPoints(results) {
  const slams = results.filter((r) => r.category === "grandSlam");
  const mandatoryMasters = results.filter(
    (r) => r.category === "masters1000" && r.mandatory
  );
  const otherPool = results.filter(
    (r) => !r.mandatory && r.category !== "grandSlam"
  );
  const bestOther = [...otherPool]
    .sort((a, b) => b.points - a.points)
    .slice(0, 7);

  const counted = [...slams, ...mandatoryMasters, ...bestOther];
  const countedNames = new Set(counted.map((r) => r.tournament));
  const rankingPoints = counted.reduce((sum, r) => sum + r.points, 0);

  return { rankingPoints, countedNames };
}

export function simulateSeason(playerRating) {
  const schedule = resolveSchedule();
  const results = schedule.map((t) => simulateTournament(t, playerRating));

  const { rankingPoints, countedNames } = computeRankingPoints(results);
  const annotatedResults = results.map((r) => ({
    ...r,
    countedForRanking: countedNames.has(r.tournament),
  }));

  const totalPrizeMoneyBeforeFinals = results.reduce(
    (sum, r) => sum + r.prizeMoney,
    0
  );
  const titlesBeforeFinals = results.filter(
    (r) => r.result === "Champion"
  ).length;

  const finals =
    rankingPoints >= FINALS_POINTS_THRESHOLD
      ? simulateAtpFinals(playerRating)
      : null;

  const totalPoints = rankingPoints + (finals ? finals.points : 0);
  const totalPrizeMoney =
    totalPrizeMoneyBeforeFinals + (finals ? finals.prizeMoney : 0);
  const titles =
    titlesBeforeFinals + (finals && finals.result === "Champion" ? 1 : 0);

  return {
    results: annotatedResults,
    finals,
    totalPoints,
    totalPrizeMoney,
    titles,
    qualifiedForFinals: Boolean(finals),
    estimatedRanking: estimateRanking(totalPoints),
  };
}
