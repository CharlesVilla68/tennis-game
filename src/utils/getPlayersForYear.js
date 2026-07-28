import players from '../data/players.json'

export function getPlayersForYear(year) {
  const y = Number(year)
  return players.filter((player) => y >= player.activeFrom && y <= player.activeTo)
}
