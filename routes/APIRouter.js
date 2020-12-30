import Router from 'express-promise-router';
import {buffIds} from '../guessRole.js';
import fetch from 'node-fetch';

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

  APIRouter.post('/logs', async (req, res) => {
    console.log(req);
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

    let uploaderId = null;
    if (req.body.uploaderToken) {
      uploaderId =
        await statsModel.db.verifyUploaderToken(req.body.uploaderToken);
    } else {
      await statsModel.getDefaultUploader();
      uploaderId = statsModel.uploader;
    }

    const id = await statsModel.addLog(log, uploaderId);

    res.redirect(307, `/logs/${id}`);
  });

  return APIRouter;
}

export default {
  create,
};
