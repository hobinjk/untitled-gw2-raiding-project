import Router from 'express-promise-router';
import fetch from 'node-fetch';
import {buffIds} from '../guessRole.js';
import {
  middleware,
  middlewareInsecure,
} from '../util/JWTMiddleware.js';
import Constants from '../Constants.js';

export function create(statsModel) {
  const APIRouter = new Router();
  APIRouter.get('/stats', (req, res) => {
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

  APIRouter.get('/funStats', (req, res) => {
    res.json(statsModel.funStats);
  });

  APIRouter.get('/logs', middlewareInsecure(), async (req, res) => {
    console.log('/logs', req.jwt);
    let query = {
      fightName: req.query.fightName,
      role: req.query.role,
      account: req.query.account,
      order: req.query.order,
      success: req.query.success,
      personal: req.query.personal,
    };
    let page = {
      start: parseInt(req.query.start) || 0,
      limit: parseInt(req.query.limit) || 40,
    };

    res.json(await statsModel.db.filterLogsMetadata(query, page, req.jwt));
  });

  APIRouter.get('/logs/:logId', middlewareInsecure(), async (req, res) => {
    const {logId} = req.params;
    const meta = await statsModel.db.getLogMeta(logId);
    if (!meta) {
      res.sendStatus(404);
      return;
    }

    if (meta.visibility === Constants.LOG_VISIBILITY_PRIVATE &&
        (!req.jwt || meta.user_id !== req.jwt.user)) {
      res.sendStatus(404);
      return;
    }

    const log = await statsModel.db.getLog(logId);
    if (!log) {
      res.sendStatus(404);
      return;
    }
    res.json(log);
  });

  APIRouter.get(
    '/logs/stats/:logId',
    middlewareInsecure(),
    async (req, res) => {
      const stats = await statsModel.db.getLogStats(req.params.logId, req.jwt);
      if (!stats) {
        res.sendStatus(404);
        return;
      }
      res.json(stats);
    }
  );

  APIRouter.get('/stats/percentiles/dps', async (req, res) => {
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

  APIRouter.get('/stats/percentiles/buffOutput', async (req, res) => {
    console.log(req.query);
    const fightName = req.query.fightName;
    const role = req.query.role;
    const buffName = req.query.buff;
    const buffId = buffIds[buffName];
    if (!buffId) {
      res.sendStatus(404);
      return;
    }
    const output = req.query.output;

    res.json({
      outputPercentile: await statsModel.db.getBuffOutputPercentile(
        fightName, role, buffId, output),
    });
  });

  APIRouter.get('/stats/percentiles/mechanic', async (req, res) => {
    console.log(req.query);
    const fightName = req.query.fightName;
    const mechanicName = req.query.mechanicName;
    const occurrences = req.query.occurrences;

    res.json({
      occurrencesPercentile: await statsModel.db.getMechanicPercentile(
        fightName, mechanicName, occurrences),
    });
  });

  APIRouter.get('/stats/percentiles/durationMs', async (req, res) => {
    const fightName = req.query.fightName;
    const durationMs = req.query.durationMs;

    res.json({
      durationMsPercentile: await statsModel.db.getDurationMsPercentile(
        fightName, durationMs),
    });
  });

  APIRouter.post('/logs', middleware(), async (req, res) => {
    const parts =
      /https:\/\/dps.report\/([a-zA-Z0-9-_]+)/.exec(req.body.url);
    if (!parts) {
      console.warn('log url bad');
      res.sendStatus(500);
      return;
    }
    const slug = parts[1];
    const logFetch = await fetch(`https://dps.report/getJson?permalink=${slug}`);
    const log = await logFetch.json();
    if (!log) {
      console.warn('log fetch failed');
      res.sendStatus(500);
      return;
    }

    const uploaderId = req.jwt.user;

    let visibility = req.body.visibility;
    if (![
      Constants.LOG_VISIBILITY_PUBLIC,
      Constants.LOG_VISIBILITY_UNLISTED,
      Constants.LOG_VISIBILITY_PRIVATE,
    ].includes(visibility)) {
      visibility = Constants.LOG_VISIBILITY_PUBLIC;
    }

    const id = await statsModel.addLog(log, uploaderId,
                                       visibility);

    res.redirect(307, `/logs/${id}`);
  });

  APIRouter.delete('/logs/:logId', middleware(), async (req, res) => {
    const {logId} = req.params;
    const meta = await statsModel.db.getLogMeta(logId);
    if (!meta) {
      res.sendStatus(404);
      return;
    }
    if (meta.user_id !== req.jwt.user) {
      res.sendStatus(401);
      return;
    }
    const success = await statsModel.db.deleteLog(logId);
    if (!success) {
      res.sendStatus(500);
      return;
    }
    res.json({success});
  });

  return APIRouter;
}

export default {
  create,
};
