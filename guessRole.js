function squadBuffGeneration(player, buffId) {
  if (!player.squadBuffs) {
    return 0;
  }
  let data = player.squadBuffs.filter(d => d.id === buffId);
  if (data.length === 0) {
    return 0;
  }
  return data[0].buffData[0].generation;
}

function quickness(player) {
  return squadBuffGeneration(player, 1187);
}

function alacrity(player) {
  return squadBuffGeneration(player, 30328);
}

const tankBosses = [
  'Vale Guardian',
  'Gorseval the Multifarious',
  'Keep Construct',
  'Xera',
  // 'Mursaat Overseer' ...it's different
  // Samarog ...it's also different
  'Deimos',
  'Soulless Horror', // it's technically different but no
  'Dhuum',
  'Twin Largos',
  'Qadim', // very different but no
  'Cardinal Adina',
  'Cardinal Sabir',
  'Qadim the Peerless', // different but no
];

export default function guessRole(log, player) {
  let isHeal = player.healing > 4;
  let isTank = player.toughness > 1 && tankBosses.includes(log.fightName);
  let isBoon = quickness(player) > 10 || alacrity(player) > 10;
  let dpsAll = player.dpsAll[0];
  let isPower = dpsAll.condiDps <= dpsAll.powerDps;
  let role = player.profession;
  let dType = isPower ? 'Power' : 'Condition';

  if (isTank) {
    return `Tank ${role}`;
  }
  if (isHeal) {
    return `Heal ${role}`;
  }
  if (isBoon) {
    return `${dType} Boon ${role}`;
  }
  return `${dType} ${role}`;
}
