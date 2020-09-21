export default function squadBuffGeneration(player: any, buffId: number) {
  if (!player.squadBuffs) {
    return 0;
  }
  let data = player.squadBuffs.filter((d: any) => d.id === buffId);
  if (data.length === 0) {
    return 0;
  }
  return data[0].buffData[0].generation;
}

export function quickness(player: any) {
  return squadBuffGeneration(player, 1187);
}

export function alacrity(player: any) {
  return squadBuffGeneration(player, 30328);
}

export function might(player: any) {
  return squadBuffGeneration(player, 740);
}
