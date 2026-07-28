import players from "../data/players.json";

export function getPlayersForYear(year, gender = "both") {
  const y = Number(year);
  return players.filter((player) => {
    const isActive = y >= player.activeFrom && y <= player.activeTo;
    const genderMatch = gender === "both" || player.gender === gender;
    return isActive && genderMatch;
  });
}
