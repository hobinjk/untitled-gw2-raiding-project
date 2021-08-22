import {buffIds} from '../guessRole.js';

export function compressLog(log) {
  let boringKeys = ['buffMap', 'skillMap', 'damageModMap', 'personalBuffs'];
  // let before = JSON.stringify(log).length;
  for (let key of boringKeys) {
    delete log[key];
  }
  const requiredPlayerKeys = {
    name: true,
    account: true,
    dpsTargets: true,
    dpsAll: true,
    role: true,
    squadBuffs: true,
    healing: true,
    toughness: true,
    profession: true,
  };

  for (let player of log.players) {
    for (let key of Object.keys(player)) {
      if (!requiredPlayerKeys.hasOwnProperty(key)) {
        delete player[key];
      }
      player.dpsAll = [{dps: player.dpsAll[0].dps}];
      player.dpsTargets = [[{dps: player.dpsTargets[0][0].dps}]];

      if (!player.squadBuffs) {
        // console.warn(player.role, 'is selfish');
        continue;
      }
      player.squadBuffs = player.squadBuffs.filter(d => {
        return Object.values(buffIds).includes(d.id);
      }).map(data => {
        let generation = data.buffData[0].generation;
        let justGeneration = {
          id: data.id,
          buffData: [{generation}],
        };
        return justGeneration;
      });
    }
  }

  log.targets = [{
    healthPercentBurned: log.targets[0].healthPercentBurned,
  }];

  // let after = JSON.stringify(log).length;
  // console.log(`${Math.round(after / before * 10000) / 100}% log reduction`);
}
