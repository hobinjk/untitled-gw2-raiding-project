type IMaxDpsStats = {
  max: number,
  logUrl: string,
};
class MaxDpsAnalysis {
  stats: {[phaseName: string]: {[account: string]: IMaxDpsStats}} = {};

  constructor() {
  }

  addTargetDps(logUrl: string, phaseName: string, account: string, approxTargetDps: number) {
    if (!this.stats.hasOwnProperty(phaseName)) {
      this.stats[phaseName] = {};
    }
    if (!this.stats[phaseName][account]) {
      this.stats[phaseName][account] = {
        max: 0,
        logUrl: '',
      };
    }

    if (this.stats[phaseName][account].max > approxTargetDps) {
      return;
    }
    this.stats[phaseName][account].max = approxTargetDps;
    this.stats[phaseName][account].logUrl = logUrl;
  }

  process(log: any) {
    let phaseNames = [
      'Jormag',
      'Primordus',
      'Kralkatorrik',
      'Mordremoth',
      'Zhaitan',
      'Soo-Won 1',
      'Soo-Won 2',
    ];

    for (let phaseName of phaseNames) {
      let phaseIndex = log.phases.findIndex((a: any) => a.name === phaseName);
      let phase = log.phases[phaseIndex];
      if (!phase) {
        continue;
      }
      // If it's the last phase then it might be truncated
      if (phaseIndex === log.phases.length - 1) {
        continue;
      }
      let targetIndex = phase.targets[0];

      for (let player of log.players) {
        let damages = player.targetDamage1S[targetIndex][phaseIndex];
        let approxTargetDps = Math.round(damages.at(-1) / damages.length);

        this.addTargetDps(log.dps_report_link, phaseName, player.account, approxTargetDps);
      }
    }
  }

  toString() {
    let out = '';
    let maxPlayerName = 0;
    for (let phaseName of Object.keys(this.stats)) {
      for (let account of Object.keys(this.stats[phaseName])) {
        let name = account.split('.')[0];
        maxPlayerName = Math.max(maxPlayerName, name.length);
      }
    }


    for (let phaseName of Object.keys(this.stats)) {
      out += phaseName + '\n';
      let players = [];
      for (let account of Object.keys(this.stats[phaseName])) {
        let name = account.split('.')[0];
        name = name.padEnd(maxPlayerName, ' ');
        players.push(Object.assign({
          name,
        }, this.stats[phaseName][account]));
      }
      players.sort((a, b) => {
        return b.max - a.max;
      });
      for (let player of players) {
        out += player.name + ': ' + player.logUrl + ' ' + player.max + '\n';
      }
    }
    return out;
  }
}

export function getMaxDpsReport(logs: Array<any>) {
  const mda = new MaxDpsAnalysis();
  for (const log of logs) {
    mda.process(log);
  }
  return mda.toString();
}
