import fs from 'fs';
import path from 'path';
import guessRole from '../guessRole.js';

export default class StatsModel {
  constructor(db) {
    this.db = db;
    this.dpsStats = [];
    this.funStats = [];
  }

  async getDefaultUploader() {
    if (this.uploader) {
      return;
    }
    this.uploader = await this.db.getUploader('anonymous');
    if (typeof this.uploader === 'number') {
      return;
    }
    this.uploader = await this.db.insertUploader('anonymous',
                                                 'anonymous@localhost',
                                                 null);
  }

  async readLogs(dirPath) {
    await this.getDefaultUploader();

    let dirents = fs.readdirSync(dirPath, {withFileTypes: true});
    for (let dirent of dirents) {
      if (dirent.name.startsWith('.')) {
        continue;
      }
      if (dirent.name === 'WvW') {
        continue;
      }
      let logPath = path.join(dirPath, dirent.name);
      if (dirent.isDirectory()) {
        console.log(logPath);
        await this.readLogs(logPath);
        continue;
      }
      if (!dirent.name.endsWith('.json')) {
        continue;
      }
      let contents = fs.readFileSync(logPath);
      await this.addLog(JSON.parse(contents));
    }
  }

  async addLog(log, uploaderId) {
    for (let player of log.players) {
      player.role = guessRole(log, player);
      if (log.success) {
        this.dpsStats.push({
          fightName: log.fightName,
          target: player.dpsTargets[0][0].dps,
          all: player.dpsAll[0].dps,
          account: player.account,
          role: player.role,
        });
      }

      let defense = player.defenses[0];
      if (!this.funStats.hasOwnProperty(player.account)) {
        this.funStats[player.account] = {
          deaths: 0,
          deathsInSuccess: 0,
          timeOnBack: 0,
          damage: 0,
          logs: 0,
          successes: 0,
        };
      }

      this.funStats[player.account].logs += 1;
      if (log.success) {
        this.funStats[player.account].successes += 1;
      }
      if (defense.deadCount > 0) {
        this.funStats[player.account].deaths += 1;
        if (log.success) {
          this.funStats[player.account].deathsInSuccess += 1;
        }
      }
      if (defense.downCount > 0) {
        this.funStats[player.account].timeOnBack += defense.deadDuration;
        this.funStats[player.account].timeOnBack += defense.downDuration;
      }
      this.funStats[player.account].damage += player.dpsAll[0].damage;
    }

    if (log.success && this.dpsStats.length % 10 === 0) {
      console.log(this.dpsStats.length);
    }
    return await this.db.insertLog(log, uploaderId || this.uploader);
  }
}


