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
    let query = {
      fightName: req.query.fightName,
      role: req.query.role,
      account: req.query.account,
      order: req.query.order,
      success: req.query.success,
      personal: req.query.personal,
      tags: req.query.tags,
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

    log.id = logId;

    if (req.jwt && meta.user_id === req.jwt.user) {
      log.deletable = true;
    }

    const uploader = await statsModel.db.getUser(meta.user_id);
    if (!uploader) {
      log.uploaderName = 'unknown';
    } else {
      log.uploaderName = uploader.name;
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

  APIRouter.get(
    '/logs/percentiles/:logId',
    middlewareInsecure(),
    async (req, res) => {
      const stats = await statsModel.db.getLogPercentiles(req.params.logId,
                                                          req.jwt);
      if (!stats) {
        res.sendStatus(404);
        return;
      }
      res.json(stats);
    }
  );

  APIRouter.get('/stats/percentiles/dps', async (req, res) => {
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

  APIRouter.get('/stats/targetDps', middlewareInsecure(), async (req, res) => {
    let query = {
      fightName: req.query.fightName,
      role: req.query.role,
    };

    res.json(await statsModel.db.filterTargetDpsStats(query));
  });

  APIRouter.get('/stats/roles', middlewareInsecure(), async (req, res) => {
    let query = {
      fightName: req.query.fightName,
    };

    res.json(await statsModel.db.getRoles(query));
  });

  APIRouter.get(
    '/stats/mechanic-times', middlewareInsecure(), async (req, res) => {
      let query = {
        fightName: req.query.fightName,
        name: req.query.name,
      };

      res.json(await statsModel.db.filterMechanicStats(query));
    });

  APIRouter.get('/stats/mechanics', middlewareInsecure(), async (req, res) => {
    let query = {
      fightName: req.query.fightName,
    };

    res.json(await statsModel.db.getMechanics(query));
  });

  APIRouter.get('/stats/buffOutput', middlewareInsecure(), async (req, res) => {
    let query = {
      fightName: req.query.fightName,
      role: req.query.role,
      buffId: req.query.buffId,
    };

    res.json(await statsModel.db.filterBoonOutputStats(query));
  });

  APIRouter.get(
    '/stats/buffOutputRoles', middlewareInsecure(), async (req, res) => {
      let query = {
        fightName: req.query.fightName,
        buffId: req.query.buffId,
      };

      res.json(await statsModel.db.getBoonOutputRoles(query));
    });

  APIRouter.get(
    '/stats/fightDuration', middlewareInsecure(), async (req, res) => {
      let query = {
        fightName: req.query.fightName,
      };

      res.json(await statsModel.db.filterFightDurations(query));
    });

  APIRouter.get('/stats/fightNames', middlewareInsecure(), async (req, res) => {
    res.json(await statsModel.db.getFightNames());
  });

  APIRouter.get(
    '/stats/targetDpsLeaderboard', middlewareInsecure(), async (req, res) => {
      let query = {
        fightName: req.query.fightName,
        role: req.query.role,
        personal: req.query.personal,
        all: false,
      };

      res.json(await statsModel.db.getDpsLeaderboard(query, req.jwt));
    });

  APIRouter.post('/logs', middleware(), async (req, res) => {
    let log = req.body.log;
    const url = req.body.url || req.body.permalink;
    let dpsReportLink = null;
    if (url) {
      const parts =
        /https:\/\/dps.report\/([a-zA-Z0-9-_]+)/.exec(url);
      if (!parts) {
        console.warn('log url bad');
        res.status(500).json({msg: 'log url bad'});
        return;
      }
      dpsReportLink = url;
      const slug = parts[1];
      let existingLogs = await statsModel.db.getLogMetasByDpsReportSlug(slug);
      if (existingLogs.length > 0) {
        let allLogLinks = existingLogs.map(logMeta => `/logs/${logMeta.log_id}`);
        res.status(500).json({msg: `log already uploaded at ` + allLogLinks.join(', ')});
        return;
      }
      const maxTries = 4;
      for (let i = 0; i < maxTries; i++) {
        try {
          const logFetch = await fetch(`https://dps.report/getJson?permalink=${slug}`);
          log = await logFetch.json();
        } catch (e) {
          console.warn('log fetch failed', e);
        }
        if (log) {
          break;
        }
        await new Promise((res) => {
          setTimeout(res, 1000);
        });
      }
    }

    if (!log) {
      console.warn('log missing');
      res.status(500).json({msg: 'log missing'});
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

    let id;
    try {
      id = await statsModel.addLog(log, uploaderId,
                                   visibility, dpsReportLink);

      if (typeof id === 'object') {
        res.status(500).json({msg: `${id.error}`});
        return;
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({msg: `Server error: ${e}`});
      return;
    }


    if (req.body.permalink) {
      res.json({msg: `Log can be viewed at /logs/${id}`});
      return;
    }

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
