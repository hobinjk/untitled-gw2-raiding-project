import Router from 'express-promise-router';

export function create(statsModel) {
  const APIRouter = new Router();
  APIRouter.get('stats', (req, res) => {
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

  APIRouter.get('funStats', (req, res) => {
    res.json(statsModel.funStats);
  });

  APIRouter.get('/logs', async (req, res) => {
    console.log(req.query);
    let query = {
      fightName: req.query.fightName,
      role: req.query.role,
      account: req.query.account,
    };

    res.json(await statsModel.db.filterLogsMetadata(query));
    // logs.filter((log) => {
    //   if (query.fightName && query.fightName !== log.fightName) {
    //     return false;
    //   }
    //   if (query.role) {
    //     let anyOfRole = false;
    //     for (let player of log.players) {
    //       if (player.role === query.role) {
    //         anyOfRole = true;
    //         break;
    //       }
    //     }
    //     if (!anyOfRole) {
    //       return false;
    //     }
    //   }
    //   if (query.account) {
    //     let anyOfAcc = false;
    //     for (let player of log.players) {
    //       if (player.account === query.account) {
    //         anyOfAcc = true;
    //         break;
    //       }
    //     }
    //     if (!anyOfAcc) {
    //       return false;
    //     }
    //   }
    //   return true;
    // }));
  });
  return APIRouter;
}

export default {
  create,
};
