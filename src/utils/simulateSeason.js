import { TOURNAMENTS, CATEGORY_TEMPLATES } from "../data/tournaments";

const LOGISTIC_SCALE = 12;
const FINALS_POINTS_THRESHOLD = 4000; // approximate — real cutoffs vary year to year

function randomNormal(mean, spread) {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const value = mean + z * (spread / 2);
  return Math.min(99, Math.max(40, value));
}

function winProbability(playerRating, oppRating) {
  return 1 / (1 + Math.pow(10, -(playerRating - oppRating) / LOGISTIC_SCALE));
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

export function simulateSeason(playerRating) {
  const results = TOURNAMENTS.map((t) => simulateTournament(t, playerRating));

  const totalPoints = results.reduce((sum, r) => sum + r.points, 0);
  const totalPrizeMoney = results.reduce((sum, r) => sum + r.prizeMoney, 0);
  const titles = results.filter((r) => r.result === "Champion").length;

  const finals =
    totalPoints >= FINALS_POINTS_THRESHOLD
      ? simulateAtpFinals(playerRating)
      : null;

  return {
    results,
    finals,
    totalPoints: totalPoints + (finals ? finals.points : 0),
    totalPrizeMoney: totalPrizeMoney + (finals ? finals.prizeMoney : 0),
    titles: titles + (finals && finals.result === "Champion" ? 1 : 0),
    qualifiedForFinals: Boolean(finals),
  };
}
