import {
  quicknessGeneration,
  alacrityGeneration,
  mightGeneration,
  buffIds,
  boringMechanics,
} from '../guessRole.js';

import gw2IdentifierGenerate from 'gw2-identifier';

import {
  compressLog,
} from '../util/compressLog.js';

import Passwords from './Passwords.js';
import Constants from '../Constants.js';

import pg from 'pg';
const {Pool} = pg.native;

import {performance} from 'perf_hooks';

const TIMING_ENABLED = false;

class PGDatabase {
  constructor() {
    this.pool = new Pool({
      database: 'raidcleanser',
    });
  }

  async create() {
    await this.pool.query(`drop index if exists mechanics_stats_mechanic_name`);
    await this.pool.query(`drop index if exists dps_stats_role`);
    await this.pool.query(`drop index if exists boon_output_stats_buff_id`);
    await this.pool.query(`drop index if exists boon_output_stats_role`);
    await this.pool.query(`drop index if exists logs_meta_fight_name_idx`);
    await this.pool.query(`drop index if exists logs_meta_time_start_idx`);
    await this.pool.query(`drop index if exists logs_meta_duration_ms_idx`);
    await this.pool.query(`drop table if exists dps_stats`);
    await this.pool.query(`drop table if exists boon_output_stats`);
    await this.pool.query(`drop table if exists mechanics_stats`);
    await this.pool.query(`drop table if exists players_to_logs`);
    await this.pool.query(`drop table if exists players`);
    await this.pool.query(`drop table if exists logs_tags`);
    await this.pool.query(`drop table if exists logs_meta`);
    await this.pool.query(`drop table if exists logs_raw`);
    await this.pool.query(`drop table if exists logs`);
    await this.pool.query(`drop table if exists users_api_keys`);
    await this.pool.query(`drop table if exists jsonwebtokens`);
    await this.pool.query(`drop table if exists users`);

    await this.pool.query(`CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      name text not null unique,
      email text not null unique,
      password_hash text
    )`);
    await this.pool.query(`CREATE TABLE IF NOT EXISTS users_api_keys (
      user_id BIGSERIAL REFERENCES users(id),
      key text not null,
      account VARCHAR(64)
    )`);

    await this.pool.query(`CREATE TABLE IF NOT EXISTS jsonwebtokens (
      id BIGSERIAL PRIMARY KEY,
      key_id text unique,
      user_id BIGSERIAL REFERENCES users(id),
      issued_at DATE,
      public_key text,
      payload text
    )`);

    await this.pool.query(`CREATE TABLE IF NOT EXISTS logs (
      id BIGSERIAL PRIMARY KEY,
      data jsonb not null
    )`);
    await this.pool.query(`CREATE TABLE IF NOT EXISTS logs_raw (
      id BIGSERIAL PRIMARY KEY,
      log_id BIGSERIAL REFERENCES logs(id),
      data jsonb not null
    )`);
    await this.pool.query(`CREATE TABLE IF NOT EXISTS logs_meta (
      log_id BIGSERIAL REFERENCES logs(id),
      user_id BIGSERIAL REFERENCES users(id),
      visibility varchar(16) not null,
      emboldened boolean,
      success boolean,
      fight_name VARCHAR(64) NOT NULL,
      time_start TIMESTAMP NOT NULL,
      duration VARCHAR(16) NOT NULL,
      duration_ms integer,
      health_percent_burned real,
      players jsonb,
      dps_report_link text
    )`);
    await this.pool.query(`CREATE TABLE IF NOT EXISTS players(
      id BIGSERIAL PRIMARY KEY,
      account VARCHAR(64) NOT NULL
    )`);
    await this.pool.query(`CREATE TABLE IF NOT EXISTS players_to_logs(
      player_id BIGSERIAL REFERENCES players(id),
      log_id BIGSERIAL REFERENCES logs(id)
    )`);
    await this.pool.query(`CREATE TABLE IF NOT EXISTS dps_stats(
      log_id BIGSERIAL REFERENCES logs(id),
      player_id BIGSERIAL REFERENCES players(id),
      role VARCHAR(64) NOT NULL,
      target_dps REAL,
      all_dps REAL
    )`);
    await this.pool.query(`CREATE TABLE IF NOT EXISTS boon_output_stats(
      log_id BIGSERIAL REFERENCES logs(id),
      player_id BIGSERIAL REFERENCES players(id),
      role VARCHAR(64) NOT NULL,
      buff_id integer,
      output real
    )`);
    await this.pool.query(`CREATE TABLE IF NOT EXISTS mechanics_stats(
      log_id BIGSERIAL REFERENCES logs(id),
      player_id BIGSERIAL REFERENCES players(id),
      mechanic_name VARCHAR(64) NOT NULL,
      occurrences integer
    )`);
    await this.pool.query(`CREATE TABLE IF NOT EXISTS logs_tags (
      log_id BIGSERIAL REFERENCES logs(id),
      tag text not null
    )`);


    await this.pool.query(`CREATE INDEX IF NOT EXISTS logs_meta_fight_name_idx ON logs_meta (fight_name)`);
    await this.pool.query(`CREATE INDEX IF NOT EXISTS logs_meta_time_start_idx ON logs_meta (time_start)`);
    await this.pool.query(`CREATE INDEX IF NOT EXISTS logs_meta_duration_ms_idx ON logs_meta (duration_ms)`);

    await this.pool.query(`CREATE INDEX IF NOT EXISTS mechanics_stats_mechanic_name ON mechanics_stats (mechanic_name)`);
    await this.pool.query(`CREATE INDEX IF NOT EXISTS dps_stats_role ON dps_stats (role)`);
    await this.pool.query(`CREATE INDEX IF NOT EXISTS boon_output_stats_buff_id ON boon_output_stats (buff_id)`);
    await this.pool.query(`CREATE INDEX IF NOT EXISTS boon_output_stats_role ON boon_output_stats (role)`);
  }

  generateSessionTag() {
    return 'session-' + gw2IdentifierGenerate(5);
  }

  deltaTimeAbs(dateA, dateB) {
    return Math.abs(dateA.getTime() - dateB.getTime()) / 1000;
  }

  async insertLog(log, userId, visibility, dpsReportLink) {
    if (log.logErrors) {
      delete log.logErrors;
    }
    let user = await this.getUser(userId);
    if (!user) {
      return {
        error: 'Unknown user',
      };
    }

    let accounts = user.keys.map(k => k.account);
    let anyAccountPresentInLog = false;
    for (let player of log.players) {
      if (accounts.includes(player.account)) {
        anyAccountPresentInLog = true;
        break;
      }
    }
    if (!anyAccountPresentInLog) {
      return {
        error: 'User does not have a verified account present in log',
      };
    }

    // let rawLog = JSON.parse(JSON.stringify(log)); // :\
    let emboldened = log.buffMap.hasOwnProperty('b68087');
    compressLog(log);

    if (!Array.isArray(log.mechanics)) {
      log.mechanics = [];
    }

    let res = await this.pool.query(
      'INSERT INTO logs (data) VALUES ($1) RETURNING (id)',
      [log]);
    let logId = res.rows[0].id;
    // res = await this.pool.query(
    //   'INSERT INTO logs_raw (log_id, data) VALUES ($1, $2)',
    //   [logId, rawLog]);

    await this.pool.query(
      `INSERT INTO logs_meta SELECT
        id as log_id,
        $1 as user_id,
        $2 as visibility,
        $3 as emboldened,
        (data -> 'success')::text::boolean AS success,
        data ->> 'fightName' AS fight_name,
        (data ->> 'timeStartStd')::timestamp AS time_start,
        data ->> 'duration' AS duration,
        (data -> 'phases' -> 0 -> 'end')::text::int as duration_ms,
        (data -> 'targets' -> 0 ->> 'healthPercentBurned')::text::real as health_percent_burned,
        (SELECT jsonb_agg(filtered_player) from jsonb_array_elements(data -> 'players') player, jsonb_build_object('account', player -> 'account', 'group', player -> 'group', 'role', player -> 'role') filtered_player) as players,
        $4 as dps_report_link
      FROM logs WHERE id = $5`,
      [userId, visibility, emboldened, dpsReportLink, logId]);

    let logMeta = await this.getLogMeta(logId);
    let previousLog = await this.getPreviousLogMeta(userId, logMeta.time_start);
    let defaultTags = [];
    let usablePrevLog = previousLog &&
      this.deltaTimeAbs(previousLog.time_start,
                        logMeta.time_start) < 60 * 60 &&
      logMeta.fight_name.includes('Golem') ===
      previousLog.fight_name.includes('Golem');

    if (usablePrevLog) {
      const prevLogTags = await this.getLogTags(previousLog.log_id,
                                                parseInt(userId));
      defaultTags = prevLogTags.filter(tag => tag.startsWith('session-'));
    } else {
      defaultTags = [this.generateSessionTag()];
    }

    for (let tag of defaultTags) {
      await this.insertLogTag(logId, userId, tag);
    }

    for (const player of log.players) {
      let existingPlayer = await this.pool.query(
        'SELECT (id) FROM players WHERE account = $1',
        [player.account]);
      let playerId;
      if (existingPlayer.rows.length > 0) {
        playerId = existingPlayer.rows[0].id;
      } else {
        res = await this.pool.query(
          'INSERT INTO players (account) VALUES ($1) RETURNING (id)',
          [player.account]);
        playerId = res.rows[0].id;
      }
      await this.pool.query(
        'INSERT INTO players_to_logs (player_id, log_id) VALUES ($1, $2)',
        [playerId, logId]);

      const targetDps = player.dpsTargets[0][0].dps;
      const allDps = player.dpsAll[0].dps;

      await this.pool.query(
        `INSERT INTO dps_stats (log_id, player_id, role, target_dps, all_dps)
        VALUES ($1, $2, $3, $4, $5)`,
        [logId, playerId, player.role, targetDps, allDps]);

      if (player.role.includes('Boon') ||
          player.role.includes('Heal') ||
          player.role.includes('Tank')) {
        let might = mightGeneration(player);
        let quickness = quicknessGeneration(player);
        let alacrity = alacrityGeneration(player);
        if (might > 3) {
          await this.pool.query(
            `INSERT INTO boon_output_stats (log_id, player_id, role, buff_id, output)
            VALUES ($1, $2, $3, $4, $5)`,
            [logId, playerId, player.role, buffIds.might, might]);
        }
        if (quickness > 3) {
          await this.pool.query(
            `INSERT INTO boon_output_stats (log_id, player_id, role, buff_id, output)
            VALUES ($1, $2, $3, $4, $5)`,
            [logId, playerId, player.role, buffIds.quickness, quickness]);
        }
        if (alacrity > 3) {
          await this.pool.query(
            `INSERT INTO boon_output_stats (log_id, player_id, role, buff_id, output)
            VALUES ($1, $2, $3, $4, $5)`,
            [logId, playerId, player.role, buffIds.alacrity, alacrity]);
        }
      }

      if (!log.fightName.includes('Golem')) {
        for (let mechanic of log.mechanics) {
          let occurrences = 0;
          for (let occurrence of mechanic.mechanicsData) {
            if (occurrence.actor === player.name) {
              occurrences += 1;
            }
          }

          await this.pool.query(
            `INSERT INTO mechanics_stats (log_id, player_id, mechanic_name, occurrences)
            VALUES ($1, $2, $3, $4)`,
            [logId, playerId, mechanic.name, occurrences]);
        }
      }
    }

    return logId;
  }

  /**
   * @param {Object} Query
   * @return {Array<Object>} metadata objects of all logs
   */
  async filterLogsMetadata(query, page = {start: 0, limit: 20}, jwt) {
    const logMeta = `* FROM logs_meta`;

    if (typeof page.limit !== 'number' || typeof page.start !== 'number') {
      console.error('Attempted sql injection uh oh', order, page);
      return {
        logs: [],
        page,
        count: 0,
      };
    }

    const order = query.order === 'duration' ? 'duration_ms' : 'time_start';
    const orderLimitOffset = `ORDER BY ${order} LIMIT ${page.limit} OFFSET ${page.start}`;

    let conditions = [];
    let args = [];

    if (query.personal) {
      if (!jwt) {
        return {
          logs: [],
          page,
          count: 0,
        };
      }
      // Should figure out literally any other way to do this
      conditions.push(`(
        (user_id = $${args.length + 1}) OR
        (logs_meta.log_id IN (
          select log_id from players_to_logs where players_to_logs.player_id = (
            select id from players RIGHT JOIN users_api_keys ON players.account = users_api_keys.account where user_id = $${args.length + 1}
          )
        ))
      )`);
      args.push(jwt.user);
    } else {
      const tags = (query.tags || '').split(',');
      let anySession = false;
      for (const tag of tags) {
        if (tag.startsWith('session-')) {
          anySession = true;
          break;
        }
      }
      if (!anySession) {
        conditions.push(`visibility = '${Constants.LOG_VISIBILITY_PUBLIC}'`);
      } else {
        // Allow viewing unlisted logs with specific session tag
        conditions.push(`(visibility = '${Constants.LOG_VISIBILITY_PUBLIC}' or
                          visibility = '${Constants.LOG_VISIBILITY_UNLISTED}')`);
      }
    }

    if (query.account) {
      // do some nonsense
      const playerRes = await this.pool.query(
        `SELECT * FROM players WHERE account = $1`,
        [query.account]);
      if (!playerRes.rows[0]) {
        console.warn(`Player ${JSON.stringify(query.account)} not found`);
        return {
          logs: [],
          page,
          count: 0,
        };
      }
      const playerId = playerRes.rows[0].id;

      conditions.push(`log_id IN (SELECT log_id FROM players_to_logs WHERE player_id = $${args.length + 1})`);
      args.push(playerId);
    }

    if (query.fightName) {
      conditions.push(`fight_name = $${args.length + 1}`);
      args.push(query.fightName);
    }

    if (query.success === 'true' || query.success === 'false') {
      conditions.push(`success = $${args.length + 1}`);
      args.push(query.success);
    }

    if (query.emboldened === 'true' || query.emboldened === 'false') {
      conditions.push(`emboldened = $${args.length + 1}`);
      args.push(query.emboldened);
    }

    if (query.tags) {
      for (let tag of query.tags.split(',')) {
        conditions.push(`log_id IN (SELECT log_id FROM logs_tags WHERE tag = $${args.length + 1})`);
        args.push(tag);
      }
    }

    if (conditions.length === 0) {
      let count = await this.pool.query(`SELECT count(*) from logs_meta`);
      let logs = await this.pool.query(`SELECT ${logMeta} ${orderLimitOffset}`);
      for (let logMeta of logs.rows) {
        await this.tagifyLogMeta(logMeta);
      }
      return {
        logs: logs.rows,
        page,
        count: count.rows[0].count,
      };
    } else {
      let where = 'WHERE ' + conditions.join(' AND ');
      let count = await this.pool.query(`SELECT count(*) from logs_meta ${where}`, args);
      console.log(
        'querying',
        `SELECT ${logMeta} ${where} ${orderLimitOffset}`,
        args);
      let logs = await this.pool.query(
        `SELECT ${logMeta} ${where} ${orderLimitOffset}`,
        args);
      for (let logMeta of logs.rows) {
        await this.tagifyLogMeta(logMeta);
      }
      return {
        logs: logs.rows,
        page,
        count: count.rows[0].count,
      };
    }
  }

  /**
   * @param {BigSerial} logId
   * @return {Object} log metadata
   */
  async getLogMeta(logId) {
    let logs = await this.pool.query(
      `SELECT * FROM logs_meta WHERE log_id = $1`,
      [logId]);
    if (!logs || !logs.rows || !logs.rows.length) {
      return;
    }
    const meta = logs.rows[0];
    meta.user_id = parseInt(meta.user_id);
    return meta;
  }

  /**
   * @param {string} slug
   * @return {Array<Object>} log metadata
   */
  async getLogMetasByDpsReportSlug(slug) {
    slug = '%' + slug;
    let logs = await this.pool.query(
      `SELECT * FROM logs_meta WHERE dps_report_link LIKE $1`,
      [slug]);
    return logs.rows;
  }

  /**
   * @param {BigSerial} id
   * @param {JSONWebToken} _jwt
   * @return {Object} raw json data of log
   */
  async getLog(id, _jwt) {
    let logs = await this.pool.query(
      `SELECT data FROM logs WHERE id = $1`,
      [id]);
    if (!logs || !logs.rows || !logs.rows.length) {
      return;
    }
    let log = logs.rows[0].data;
    let meta = await this.getLogMeta(id);
    await this.tagifyLogMeta(meta);
    log.meta = meta;
    return log;
  }

  async getPreviousLogMeta(userId, timeStart) {
    let logs = await this.pool.query(
      `select log_id from logs_meta where user_id = $1 and time_start < $2 order by time_start desc limit 1`,
      [userId, timeStart]);
    if (!logs || !logs.rows || !logs.rows.length) {
      return;
    }
    return await this.getLogMeta(logs.rows[0].log_id);
  }

  /**
   * @param {BigSerial} id
   * @return {boolean} whether successful
   */
  async deleteLog(id) {
    await this.pool.query(
      `DELETE FROM players_to_logs WHERE log_id = $1`,
      [id]);
    await this.pool.query(
      `DELETE FROM dps_stats WHERE log_id = $1`,
      [id]);
    await this.pool.query(
      `DELETE FROM boon_output_stats WHERE log_id = $1`,
      [id]);
    await this.pool.query(
      `DELETE FROM mechanics_stats WHERE log_id = $1`,
      [id]);
    await this.pool.query(
      `DELETE FROM logs_tags WHERE log_id = $1`,
      [id]);
    await this.pool.query(
      `DELETE FROM logs_raw WHERE log_id = $1`,
      [id]);
    await this.pool.query(
      `DELETE FROM logs_meta WHERE log_id = $1`,
      [id]);
    let deletedLogs = await this.pool.query(
      `DELETE FROM logs WHERE id = $1`,
      [id]);
    return deletedLogs.rowCount > 0;
  }

  /**
   * @param {BigSerial} id
   * @param {JSONWebToken} _jwt
   * @return {Object} raw json dps stat rows
   */
  async getLogStats(id, _jwt) {
    let dpsStats = await this.pool.query(
      `SELECT * FROM dps_stats LEFT JOIN players ON players.id = dps_stats.player_id WHERE log_id = $1`,
      [id]);
    if (!dpsStats) {
      return;
    }
    return dpsStats.rows;
  }

  /**
   * @param {BigSerial} id
   * @param {JSONWebToken} jwt
   * @return {Object} Every percentile from the log
   */
  async getLogPercentiles(id, jwt) {
    let timings = {};
    if (TIMING_ENABLED) {
      timings.getLogPercentiles = performance.now();
      timings.getLog = performance.now();
    }
    let log = await this.getLog(id, jwt);
    if (TIMING_ENABLED) {
      timings.getLog = performance.now() - timings.getLog;
    }
    if (!log) {
      return;
    }
    const fightName = log.fightName;
    const allowEmboldened = log.meta.emboldened;
    if (TIMING_ENABLED) {
      timings.getLogStats = performance.now();
    }
    let dpsStats = await this.getLogStats(id);
    if (TIMING_ENABLED) {
      timings.getLogStats = performance.now() - timings.getLogStats;
    }
    const dpsStatsByAccount = {};
    for (let stat of dpsStats) {
      dpsStatsByAccount[stat.account] = stat;
    }
    let out = {
      fightName,
      players: [],
    };
    let mechanicsCache = {};

    if (TIMING_ENABLED) {
      timings.getDpsPercentiles = [];
      timings.getBuffOutputPercentile = [];
      timings.getMechanicPercentile = [];
    }
    for (let player of log.players) {
      let outPlayer = {
        name: player.name,
        account: player.account,
      };

      let start = performance.now();
      let targetDps = dpsStatsByAccount[player.account].target_dps;
      let allDps = dpsStatsByAccount[player.account].all_dps;
      let [targetDpsPercentile, allDpsPercentile] =
        await Promise.all([
          this.getTargetDpsPercentile(fightName, player.role, targetDps, allowEmboldened),
          this.getAllDpsPercentile(fightName, player.role, allDps, allowEmboldened),
        ]);
      if (TIMING_ENABLED) {
        timings.getDpsPercentiles.push({
          time: performance.now() - start,
          query: JSON.stringify({role: player.role, targetDps, allDps}),
        });
      }

      outPlayer.dps = {
        targetDps,
        targetDpsPercentile,
        allDps,
        allDpsPercentile,
      };

      start = performance.now();
      let quickness = quicknessGeneration(player);
      let quicknessPercentile = quickness < 10 ?
        null :
        await this.getBuffOutputPercentile(
          fightName, player.role, buffIds.quickness, quickness,
          allowEmboldened);
      if (TIMING_ENABLED && performance.now() - start > 1) {
        timings.getBuffOutputPercentile.push({
          time: performance.now() - start,
          query: JSON.stringify({role: player.role, quickness}),
        });
      }
      start = performance.now();
      let alacrity = alacrityGeneration(player);
      let alacrityPercentile = alacrity < 10 ?
        null :
        await this.getBuffOutputPercentile(
          fightName, player.role, buffIds.alacrity, alacrity,
          allowEmboldened);
      if (TIMING_ENABLED && performance.now() - start > 1) {
        timings.getBuffOutputPercentile.push({
          time: performance.now() - start,
          query: JSON.stringify({role: player.role, alacrity}),
        });
      }
      start = performance.now();
      let might = mightGeneration(player);
      let mightPercentile = might < 10 ?
        null :
        await this.getBuffOutputPercentile(
          fightName, player.role, buffIds.might, might,
          allowEmboldened);
      if (TIMING_ENABLED && performance.now() - start > 1) {
        timings.getBuffOutputPercentile.push({
          time: performance.now() - start,
          query: JSON.stringify({role: player.role, might}),
        });
      }

      outPlayer.buffOutput = {
        quickness,
        quicknessPercentile,
        alacrity,
        alacrityPercentile,
        might,
        mightPercentile,
      };

      outPlayer.mechanics = [];
      if (!Array.isArray(log.mechanics)) {
        log.mechanics = [];
      }
      for (let mechanic of log.mechanics) {
        let times = 0;
        if (boringMechanics.hasOwnProperty(mechanic.name)) {
          continue;
        }
        if (mechanic.mechanicsData.length === 0) {
          continue;
        }
        for (let occurrence of mechanic.mechanicsData) {
          if (occurrence.actor === player.name) {
            times += 1;
          }
        }
        let percentile = 0;
        let cacheKey = mechanic.name + times;
        if (mechanicsCache.hasOwnProperty(cacheKey)) {
          percentile = mechanicsCache[cacheKey];
        } else if (times > 0) {
          start = performance.now();
          percentile = await this.getMechanicPercentile(
            fightName, mechanic.name, times, allowEmboldened);
          if (TIMING_ENABLED) {
            timings.getMechanicPercentile.push({
              time: performance.now() - start,
              query: JSON.stringify({name: mechanic.name, times}),
            });
          }
          mechanicsCache[cacheKey] = percentile;
        }

        outPlayer.mechanics.push({
          name: mechanic.name,
          description: mechanic.description,
          value: times,
          percentile,
        });
      }
      out.players.push(outPlayer);
    }
    if (TIMING_ENABLED) {
      timings.getLogPercentiles = performance.now() - timings.getLogPercentiles;
      let totalPostgres = timings.getLog + timings.getLogStats;
      timings.getDpsPercentiles.forEach(a => {
        totalPostgres += a.time;
      });
      timings.getBuffOutputPercentile.forEach(a => {
        totalPostgres += a.time;
      });
      timings.getMechanicPercentile.forEach(a => {
        totalPostgres += a.time;
      });
      timings.totalPostgres = totalPostgres;
      console.log(timings);
    }
    return out;
  }

  async getTargetDpsPercentile(fightName, role, targetDps, allowEmboldened = false) {
    let emboldenedCheck = allowEmboldened ? '' : 'logs_meta.emboldened = false and';
    const res = await this.pool.query(
      `select percent_rank($1) within group (order by target_dps asc)
      from dps_stats left join logs_meta on dps_stats.log_id = logs_meta.log_id
      where logs_meta.fight_name = $2 and ${emboldenedCheck} dps_stats.role = $3`,
      [targetDps, fightName, role]);
    return res.rows[0].percent_rank * 100;
  }

  async getAllDpsPercentile(fightName, role, dps, allowEmboldened = false) {
    let emboldenedCheck = allowEmboldened ? '' : 'logs_meta.emboldened = false and';
    const res = await this.pool.query(
      `select percent_rank($1) within group (order by all_dps asc)
      from dps_stats left join logs_meta on dps_stats.log_id = logs_meta.log_id
      where logs_meta.fight_name = $2 and ${emboldenedCheck} dps_stats.role = $3`,
      [dps, fightName, role]);
    return res.rows[0].percent_rank * 100;
  }

  async getBuffOutputPercentile(fightName, role, buffId, output, allowEmboldened = false) {
    let emboldenedCheck = allowEmboldened ? '' : 'logs_meta.emboldened = false and';
    const res = await this.pool.query(
      `select percent_rank($1) within group (order by output asc)
      from boon_output_stats left join logs_meta on boon_output_stats.log_id = logs_meta.log_id
      where logs_meta.fight_name = $2 and ${emboldenedCheck} boon_output_stats.role = $3 and boon_output_stats.buff_id = $4`,
      [output, fightName, role, buffId]);
    return res.rows[0].percent_rank * 100;
  }

  async getMechanicPercentile(fightName, mechanicName, occurrences, allowEmboldened = false) {
    let emboldenedCheck = allowEmboldened ? '' : 'logs_meta.emboldened = false and';
    const res = await this.pool.query(
      `select percent_rank($1) within group (order by occurrences asc)
      from mechanics_stats left join logs_meta on mechanics_stats.log_id = logs_meta.log_id
      where logs_meta.fight_name = $2 and ${emboldenedCheck} mechanics_stats.mechanic_name = $3`,
      [occurrences, fightName, mechanicName]);
    return res.rows[0].percent_rank * 100;
  }

  async getDurationMsPercentile(fightName, durationMs, allowEmboldened = false) {
    let emboldenedCheck = allowEmboldened ? '' : 'logs_meta.emboldened = false and';
    const res = await this.pool.query(
      `select percent_rank($1) within group (order by duration_ms desc)
      from logs_meta
      where logs_meta.fight_name = $2 and ${emboldenedCheck} logs_meta.success = true`,
      [durationMs, fightName]);
    return res.rows[0].percent_rank * 100;
  }

  async filterTargetDpsStats(query) {
    const {role, fightName, allowEmboldened} = query;
    let emboldenedCheck = allowEmboldened ? '' : 'logs_meta.emboldened = false and';
    let res;
    if (fightName) {
      res = await this.pool.query(
        `select (target_dps) from dps_stats
        left join logs_meta on dps_stats.log_id = logs_meta.log_id
        where role = $1 and ${emboldenedCheck} logs_meta.fight_name = $2`, [role, fightName]);
    } else {
      res = await this.pool.query(
        `select (target_dps) from dps_stats
        where role = $1`, [role]);
    }
    return res.rows.map(row => row.target_dps);
  }

  async getRoles(query) {
    const {fightName} = query;
    let res;
    if (fightName) {
      res = await this.pool.query(
        `select distinct (role) from dps_stats
        left join logs_meta on dps_stats.log_id = logs_meta.log_id
        where logs_meta.fight_name = $1`, [fightName]);
    } else {
      res = await this.pool.query(
        `select distinct (role) from dps_stats`);
    }
    return res.rows.map(row => row.role);
  }

  async filterMechanicStats(query) {
    const {role, fightName, allowEmboldened} = query;
    let emboldenedCheck = allowEmboldened ? '' : 'and logs_meta.emboldened = false';
    let res;
    if (fightName) {
      res = await this.pool.query(
        `select (occurrences) from mechanics_stats
        left join logs_meta on mechanics_stats.log_id = logs_meta.log_id
        where mechanic_name = $1 and logs_meta.fight_name = $2 ${emboldenedCheck}`, [name, fightName]);
    } else {
      res = await this.pool.query(
        `select (occurrences) from mechanics_stats
        left join logs_meta on mechanics_stats.log_id = logs_meta.log_id
        where mechanic_name = $1 ${emboldenedCheck}`, [name]);
    }
    return res.rows.map(row => row.occurrences);
  }

  async getMechanics(query) {
    const {fightName} = query;
    let res;
    if (fightName) {
      res = await this.pool.query(
        `select distinct (mechanic_name) from mechanics_stats
        left join logs_meta on mechanics_stats.log_id = logs_meta.log_id
        where logs_meta.fight_name = $1`, [fightName]);
    } else {
      res = await this.pool.query(
        `select distinct (mechanic_name) from mechanics_stats`);
    }
    return res.rows.map(row => row.mechanic_name);
  }

  async filterBoonOutputStats(query) {
    const {role, buffId, fightName, allowEmboldened} = query;
    let emboldenedCheck = allowEmboldened ? '' : 'and logs_meta.emboldened = false';
    let res;
    if (fightName) {
      res = await this.pool.query(
        `select (output) from boon_output_stats
        left join logs_meta on boon_output_stats.log_id = logs_meta.log_id
        where role = $1 and buff_id = $2 and logs_meta.fight_name = $3 ${emboldenedCheck}`, [role, buffId, fightName]);
    } else {
      res = await this.pool.query(
        `select (output) from boon_output_stats
        left join logs_meta on boon_output_stats.log_id = logs_meta.log_id
        where role = $1 and buff_id = $2 ${emboldenedCheck}`, [role, buffId, fightName]);
    }
    return res.rows.map(row => row.output);
  }

  async getBoonOutputRoles(query) {
    const {buffId, fightName, allowEmboldened} = query;
    let emboldenedCheck = allowEmboldened ? '' : 'and logs_meta.emboldened = false';
    let res;
    if (fightName) {
      res = await this.pool.query(
        `select distinct (role) from boon_output_stats
        left join logs_meta on boon_output_stats.log_id = logs_meta.log_id
        where buff_id = $1 and logs_meta.fight_name = $2 ${emboldenedCheck}`, [buffId, fightName]);
    } else {
      res = await this.pool.query(
        `select distinct (role) from boon_output_stats
        left join logs_meta on boon_output_stats.log_id = logs_meta.log_id
        where buff_id = $1 ${emboldenedCheck}`, [buffId]);
    }
    return res.rows.map(row => row.role);
  }

  async getDpsLeaderboard(query, _jwt) {
    let {fightName, role, _personal, all, allowEmboldened} = query;
    const limit = 10;
    if (fightName === 'Twin Largos') {
      all = true;
    }
    const dpsOrder = all ? 'all_dps' : 'target_dps';

    let statement = `select
         players.account,
         dps_stats.role,
         dps_stats.target_dps,
         dps_stats.all_dps,
         dps_stats.log_id,
         logs_meta.fight_name,
         logs_meta.time_start,
         logs_meta.duration,
         logs_meta.duration_ms,
         logs_meta.players,
         logs_meta.dps_report_link
      from dps_stats
      left join players on players.id = player_id
      left join logs_meta on logs_meta.log_id = dps_stats.log_id`;
    let conditions = [];
    let args = [];
    if (fightName) {
      conditions.push(`logs_meta.fight_name = $${args.length + 1}`);
      args.push(fightName);
    }
    if (role) {
      conditions.push(`role = $${args.length + 1}`);
      args.push(role);
    }
    conditions.push(`logs_meta.success = true`);
    if (!allowEmboldened) {
      conditions.push(`logs_meta.emboldened = false`);
    }
    statement += ` where ` + conditions.join(' and ');
    statement += ` order by ${dpsOrder} desc limit $${args.length + 1}`;
    args.push(limit);
    const res = await this.pool.query(statement, args);
    return res.rows;
  }

  async filterFightDurations(query) {
    const {fightName, allowEmboldened} = query;
    const emboldenedCheck = allowEmboldened ? '' : 'and emboldened = false'
    let res = await this.pool.query(
      `select (duration_ms) from logs_meta
      where fight_name = $1 and success = true ${emboldenedCheck}`, [fightName]);
    return res.rows.map(row => row.duration_ms / 1000);
  }

  async getFightNames() {
    let res = await this.pool.query(
      `select distinct (fight_name) from logs_meta where success = true`);
    return res.rows.map(row => row.fight_name);
  }

  async insertLogTag(logId, userId, tag) {
    let res = await this.pool.query(
      'select (user_id) from logs_meta where log_id = $1', [logId]);
    if (res.rows.length === 0) {
      return;
    }
    let uploader = res.rows[0].user_id;
    if (uploader.toString() !== userId.toString()) {
      console.warn('Uploader is not tagger', uploader, userId);
      return;
    }
    res = await this.pool.query(
      `insert into logs_tags (log_id, tag) VALUES ($1, $2)`, [logId, tag]);
    return res.rowCount > 0;
  }

  async deleteLogTag(logId, userId, tag) {
    let res = await this.pool.query(
      'select (user_id) from logs_meta where log_id = $1', [logId]);
    if (res.rows.length === 0) {
      return;
    }
    let uploader = res.rows[0].user_id;
    if (uploader.toString() !== userId.toString()) {
      console.warning('Uploader is not tagger');
      return;
    }
    res = await this.pool.query(
      `delete from logs_tags WHERE (log_id = $1 and tag = $2)`, [logId, tag]);
    return res.rowCount;
  }

  async getLogTags(logId, userId) {
    let meta = await this.getLogMeta(logId);
    if (!meta) {
      console.log('no meta', logId);
      return;
    }
    let uploader = meta.user_id;
    if (uploader.toString() !== userId.toString()) {
      // TODO this is fine if the log is public
      console.warning('Uploader is not tagger');
      return;
    }
    let res = await this.pool.query(
      `select (tag) from logs_tags where log_id = $1`, [logId]);
    return res.rows.map(row => row.tag);
  }

  async tagifyLogMeta(logMeta) {
    let res = await this.pool.query(
      `select (tag) from logs_tags where log_id = $1`, [logMeta.log_id]);
    let tags = res.rows.map(row => row.tag);
    logMeta.tags = tags;
  }

  async insertUser(name, email, password) {
    let passwordHash = null;
    if (password) {
      passwordHash = await Passwords.hash(password);
    }
    const res = await this.pool.query(
      `INSERT INTO users (name, email, password_hash)
      VALUES ($1, $2, $3) RETURNING (id)`,
      [name, email.toLowerCase(), passwordHash]);
    return res.rows[0].id;
  }

  /**
   * @param {number} userId
   * @return {User}
   */
  async getUser(userId) {
    const res = await this.pool.query(
      `select name, email from users where id = $1`,
      [userId]);
    if (!res.rows || !res.rows[0]) {
      return;
    }
    let user = res.rows[0];
    user.keys = await this.getUserKeys(userId);
    return user;
  }

  /**
   * @param {string} name
   * @return {number} userId
   */
  async getUserIdByName(name) {
    const res = await this.pool.query(
      `select (id) from users where name = $1`,
      [name]);
    if (!res.rows || !res.rows[0]) {
      return;
    }
    return res.rows[0].id;
  }

  /**
   * @param {string} name
   * @param {string} password
   * @param {number?} userId if successful
   */
  async attemptLogin(name, password) {
    const res = await this.pool.query(
      `select (password_hash) from users where name = $1`,
      [name]);
    if (!res.rows || !res.rows[0]) {
      return false;
    }
    const realHash = res.rows[0].password_hash;
    if (!realHash) {
      return false;
    }
    const equal = await Passwords.compare(password, realHash);
    if (equal) {
      return await this.getUserIdByName(name);
    }
    return false;
  }

  /**
   * @param {number} userId
   * @param {Array<Key>}
   */
  async getUserKeys(userId) {
    const res = await this.pool.query(
      `select key, account from users_api_keys where user_id = $1`,
      [userId]);
    return res.rows.map(row => {
      return {
        key: row.key,
        account: row.account,
      };
    });
  }

  /**
   * @param {number} userId
   * @param {string} key
   * @return {number} number of keys deleted
   */
  async deleteUserKey(userId, key) {
    const res = await this.pool.query(
      `delete from users_api_keys where user_id = $1 and key = $2`,
      [userId, key]);
    return res.rowCount;
  }

  /**
   * @param {number} userId
   * @param {string} key
   * @param {string} account
   */
  async addUserKey(userId, key, account) {
    const res = await this.pool.query(
      `insert into users_api_keys (user_id, key, account) values ($1, $2, $3)`,
      [userId, key, account]);
    console.log(res);
    return res.rowCount;
  }

  /**
   * Get a JWT by its key id.
   * @param {string} keyId
   * @return {Promise<Object>} jwt data
   */
  async getJSONWebTokenByKeyId(keyId) {
    const res = await this.pool.query(
      `select * from jsonwebtokens where key_id = $1`,
      [keyId]);
    if (!res.rows || !res.rows[0]) {
      return;
    }
    return res.rows[0];
  }

  /**
   * Insert a JSONWebToken into the database
   * @param {JSONWebToken} token
   * @return {Promise<number>} resolved to JWT's primary key
   */
  async createJSONWebToken(token) {
    const {keyId, user, publicKey, issuedAt, payload} = token;
    const result = await this.pool.query(
      `INSERT INTO jsonwebtokens (key_id, user_id, issued_at, public_key, payload)
      VALUES ($1, $2, $3, $4, $5) RETURNING (id)`,
      [keyId, user, issuedAt, publicKey, JSON.stringify(payload)]);
    return result.rows[0].id;
  }

  /**
   * Delete a JWT by its key id.
   * @param {string} keyId
   * @return {Promise<boolean>} whether deleted
   */
  async deleteJSONWebTokenByKeyId(keyId) {
    const res = await this.pool.query(
      `delete from jsonwebtokens where key_id = $1`,
      [keyId]);
    return res.rowCount > 0;
  }
}

export default new PGDatabase();
