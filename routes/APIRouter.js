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
      limit: parseInt(req.query.limit) || 40,
    };

    res.json(await statsModel.db.filterLogsMetadata(query, page));
  });

  APIRouter.get('/logs/:logId', async (req, res) => {
    const log = await statsModel.db.getLog(req.params.logId);
    if (!log) {
      res.sendStatus(404);
      return;
    }
    res.json(log);
  });

  APIRouter.get('/logs/stats/:logId', async (req, res) => {
    const stats = await statsModel.db.getLogStats(req.params.logId);
    if (!stats) {
      res.sendStatus(404);
      return;
    }
    res.json(stats);
  });

  APIRouter.get('/stats/percentiles', async (req, res) => {
    console.log(req.query);
    const fightName = req.query.fightName;
    const role = req.query.role;
    const targetDps = req.query.targetDps;
    const allDps = req.query.allDps;

    res.json({
      targetPercentile: await statsModel.db.getTargetDpsPercentile(
        fightName, role, targetDps),
      allPercentile: await statsModel.db.getAllDpsPercentile(
        fightName, role, allDps),
    });
  });

  return APIRouter;
}

export default {
  create,
};
