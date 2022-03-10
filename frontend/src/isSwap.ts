let specs: {[spec: string]: number} = {
  Guardian: 0,
  Dragonhunter: 0,
  Firebrand: 0,
  Willbender: 0,
  Warrior: 1,
  Berserker: 1,
  Spellbreaker: 1,
  Bladesworn: 1,
  Revenant: 2,
  Herald: 2,
  Renegade: 2,
  Vindicator: 2,
  Ranger: 3,
  Druid: 3,
  Soulbeast: 3,
  Untamed: 3,
  Engineer: 4,
  Scrapper: 4,
  Holosmith: 4,
  Mechanist: 4,
  Thief: 5,
  Daredevil: 5,
  Deadeye: 5,
  Specter: 5,
  Elementalist: 6,
  Tempest: 6,
  Weaver: 6,
  Catalyst: 6,
  Necromancer: 7,
  Reaper: 7,
  Scourge: 7,
  Harbinger: 7,
  Mesmer: 8,
  Chronomancer: 8,
  Mirage: 8,
  Virtuoso: 8,
};

export default function isSwap(roleA: string, roleB: string) {
  let specA = roleA.split(' ').pop()!;
  let specB = roleB.split(' ').pop()!;
  return specs[specA] !== specs[specB];
}
