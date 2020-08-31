import Router from 'express-promise-router';

export function create(statsModel) {
  const APIRouter = new Router();
  APIRouter.get('stats', (req, res) => {
    console.log(req.query);
    let query = {
      fightName: req.query.fightName,
      role: req.query.role,
      account: req.query.account,
      order: req.query.order,
      success: req.query.success,
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
      order: req.query.order,
      success: req.query.success,
    };
    let page = {
      start: parseInt(req.query.start) || 0,
      limit: 40,
    };

    res.json(await statsModel.db.filterLogsMetadata(query, page));
  });
  return APIRouter;
}

export default {
  create,
};
