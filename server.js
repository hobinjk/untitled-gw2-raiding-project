const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();

const logsDir = '../arcdps.cbtlogs';
const guessRole = require('./guessRole.js');

class StatsModel {
  constructor() {
    this.dpsStats = [];
  }

  readLogs(dirPath) {
    let dirents = fs.readdirSync(dirPath, {withFileTypes: true});
    for (let dirent of dirents) {
      let logPath = path.join(dirPath, dirent.name);
      if (dirent.isDirectory()) {
        this.readLogs(logPath);
        continue;
      }
      if (!dirent.name.endsWith('.json')) {
        continue;
      }
      let contents = fs.readFileSync(logPath);
      this.addLog(JSON.parse(contents));
    }
  }

  addLog(log) {
    if (!log.success) {
      return;
    }

    for (let player of log.players) {
      this.dpsStats.push({
        fightName: log.fightName,
        target: player.dpsTargets[0][0].dps,
        all: player.dpsAll[0].dps,
        account: player.account,
        role: guessRole(log, player),
      });
    }
  }
}

let statsModel = new StatsModel();
statsModel.readLogs(logsDir);

app.get('/stats', (req, res) => {
  console.log(req.query);
  let query = {
    fightName: req.query.fightName,
    role: req.query.role,
    account: req.query.account,
  };

  res.json(statsModel.dpsStats.filter((stat) => {
    for (let key in query) {
      if (query[key] && stat[key] !== query[key]) {
        return false;
      }
    }
    return true;
  }));
});

app.use('/', express.static('static'));

app.listen(31337);
console.log('http://localhost:31337');
