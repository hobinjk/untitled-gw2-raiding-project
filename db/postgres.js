import {
  quicknessGeneration,
  alacrityGeneration,
  mightGeneration,
  buffIds,
  boringMechanics,
} from '../guessRole.js';

import {
  compressLog,
} from '../util/compressLog.js';

import Passwords from './Passwords.js';
import Constants from '../Constants.js';

import pg from 'pg';
const {Pool} = pg;

class PGDatabase {
  constructor() {
    this.pool = new Pool({
      database: 'raidcleanser',
    });
  }

  async create() {
    await this.pool.query(`drop index if exists logs_meta_fight_name_idx`);
    await this.pool.query(`drop index if exists logs_meta_time_start_idx`);
    await this.pool.query(`drop index if exists logs_meta_duration_ms_idx`);
    await this.pool.query(`drop table if exists dps_stats`);
    await this.pool.query(`drop table if exists boon_output_stats`);
    await this.pool.query(`drop table if exists mechanics_stats`);
    await this.pool.query(`drop table if exists players_to_logs`);
    await this.pool.query(`drop table if exists players`);
    await this.pool.query(`drop table if exists logs_meta`);
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
    await this.pool.query(`CREATE TABLE IF NOT EXISTS logs_meta (
      log_id BIGSERIAL REFERENCES logs(id),
      user_id BIGSERIAL REFERENCES users(id),
      visibility varchar(16) not null,
      success boolean,
      fight_name VARCHAR(64) NOT NULL,
      time_start VARCHAR(64) NOT NULL,
      duration VARCHAR(16) NOT NULL,
      duration_ms integer,
      health_percent_burned real,
      players jsonb
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

    await this.pool.query(`CREATE INDEX IF NOT EXISTS logs_meta_fight_name_idx ON logs_meta (fight_name)`);
    await this.pool.query(`CREATE INDEX IF NOT EXISTS logs_meta_time_start_idx ON logs_meta (time_start)`);
    await this.pool.query(`CREATE INDEX IF NOT EXISTS logs_meta_duration_ms_idx ON logs_meta (duration_ms)`);
  }

  async insertLog(log, userId, visibility) {
    if (log.logErrors) {
      delete log.logErrors;
    }
    let res = await this.pool.query(
      'INSERT INTO logs (data) VALUES ($1) RETURNING (id)',
      [log]);
    let logId = res.rows[0].id;

    await this.pool.query(
      `INSERT INTO logs_meta SELECT
        id as log_id,
        $1 as user_id,
        $2 as visibility,
        (data -> 'success')::boolean AS success,
        data ->> 'fightName' AS fight_name,
        data ->> 'timeStartStd' AS time_start,
        data ->> 'duration' AS duration,
        (data -> 'phases' -> 0 -> 'end')::int as duration_ms,
        (data -> 'targets' -> 0 ->> 'healthPercentBurned')::real as health_percent_burned,
        (SELECT jsonb_agg(filtered_player) from jsonb_array_elements(data -> 'players') player, jsonb_build_object('account', player -> 'account', 'group', player -> 'group', 'role', player -> 'role') filtered_player) as players
      FROM logs WHERE id = $3`,
      [userId, visibility, logId]);

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
      conditions.push(`user_id = $${args.length + 1}`);
      console.log(jwt);
      args.push(jwt.user);
    } else {
      conditions.push(`visibility = '${Constants.LOG_VISIBILITY_PUBLIC}'`);
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

    if (conditions.length === 0) {
      let count = await this.pool.query(`SELECT count(*) from logs_meta`);
      let logs = await this.pool.query(`SELECT ${logMeta} ${orderLimitOffset}`);
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
   * @param {BigSerial} id
   * @return {Object} raw json data of log
   */
  async getLog(id) {
    let logs = await this.pool.query(
      `SELECT data FROM logs WHERE id = $1`,
      [id]);
    if (!logs || !logs.rows || !logs.rows.length) {
      return;
    }
    return logs.rows[0].data;
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
   * @param {JSONWebToken} _jwt
   * @return {Object} Every percentile from the log
   */
  async getLogPercentiles(id, _jwt) {
    let timings = {};
    timings.getLogPercentiles = performance.now();
    timings.getLog = performance.now();
    let log = await this.getLog(id);
    compressLog(log);
    for (let key of Object.keys(log.players[0])) {
      console.log(`players[0].${key}`, JSON.stringify(log.players[0][key]).length);
    }
    timings.getLog = performance.now() - timings.getLog;
    if (!log) {
      return;
    }
    const fightName = log.fightName;
    timings.getLogStats = performance.now();
    let dpsStats = await this.getLogStats(id);
    timings.getLogStats = performance.now() - timings.getLogStats;
    const dpsStatsByAccount = {};
    for (let stat of dpsStats) {
      dpsStatsByAccount[stat.account] = stat;
    }
    let out = {
      fightName,
      players: [],
    };
    let mechanicsCache = {};

    timings.getDpsPercentiles = [];
    timings.getBuffOutputPercentile = [];
    timings.getMechanicPercentile = [];
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
          this.getTargetDpsPercentile(fightName, player.role, targetDps),
          this.getAllDpsPercentile(fightName, player.role, allDps),
        ]);
      timings.getDpsPercentiles.push(performance.now() - start);

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
        await this.getBuffOutputPercentile(fightName, player.role,
                                           buffIds.quickness, quickness);
      if (performance.now() - start > 1) {
        timings.getBuffOutputPercentile.push(performance.now() - start);
      }
      start = performance.now();
      let alacrity = alacrityGeneration(player);
      let alacrityPercentile = alacrity < 10 ?
        null :
        await this.getBuffOutputPercentile(fightName, player.role,
                                           buffIds.alacrity, alacrity);
      if (performance.now() - start > 1) {
        timings.getBuffOutputPercentile.push(performance.now() - start);
      }
      start = performance.now();
      let might = mightGeneration(player);
      let mightPercentile = might < 10 ?
        null :
        await this.getBuffOutputPercentile(fightName, player.role,
                                           buffIds.might, might);
      if (performance.now() - start > 1) {
        timings.getBuffOutputPercentile.push(performance.now() - start);
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
          percentile = await this.getMechanicPercentile(fightName,
                                                        mechanic.name, times);
          timings.getMechanicPercentile.push(performance.now() - start);
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
    timings.getLogPercentiles = performance.now() - timings.getLogPercentiles;
    let totalPostgres = timings.getLog + timings.getLogStats;
    timings.getDpsPercentiles.forEach(a => {
      totalPostgres += a;
    });
    timings.getBuffOutputPercentile.forEach(a => {
      totalPostgres += a;
    });
    timings.getMechanicPercentile.forEach(a => {
      totalPostgres += a;
    });
    timings.totalPostgres = totalPostgres;
    console.log(timings);
    return out;
  }

  async getTargetDpsPercentile(fightName, role, targetDps) {
    const res = await this.pool.query(
      `select percent_rank($1) within group (order by target_dps asc)
      from dps_stats left join logs_meta on dps_stats.log_id = logs_meta.log_id
      where logs_meta.fight_name = $2 and dps_stats.role = $3`,
      [targetDps, fightName, role]);
    return res.rows[0].percent_rank * 100;
  }

  async getAllDpsPercentile(fightName, role, dps) {
    const res = await this.pool.query(
      `select percent_rank($1) within group (order by all_dps asc)
      from dps_stats left join logs_meta on dps_stats.log_id = logs_meta.log_id
      where logs_meta.fight_name = $2 and dps_stats.role = $3`,
      [dps, fightName, role]);
    return res.rows[0].percent_rank * 100;
  }

  async getBuffOutputPercentile(fightName, role, buffId, output) {
    const res = await this.pool.query(
      `select percent_rank($1) within group (order by output asc)
      from boon_output_stats left join logs_meta on boon_output_stats.log_id = logs_meta.log_id
      where logs_meta.fight_name = $2 and boon_output_stats.role = $3 and boon_output_stats.buff_id = $4`,
      [output, fightName, role, buffId]);
    return res.rows[0].percent_rank * 100;
  }

  async getMechanicPercentile(fightName, mechanicName, occurrences) {
    const res = await this.pool.query(
      `select percent_rank($1) within group (order by occurrences asc)
      from mechanics_stats left join logs_meta on mechanics_stats.log_id = logs_meta.log_id
      where logs_meta.fight_name = $2 and mechanics_stats.mechanic_name = $3`,
      [occurrences, fightName, mechanicName]);
    return res.rows[0].percent_rank * 100;
  }

  async getDurationMsPercentile(fightName, durationMs) {
    const res = await this.pool.query(
      `select percent_rank($1) within group (order by duration_ms desc)
      from logs_meta
      where logs_meta.fight_name = $2 and logs_meta.success = true`,
      [durationMs, fightName]);
    return res.rows[0].percent_rank * 100;
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

  async getUser(userId) {
    const res = await this.pool.query(
      `select name, email from users where id = $1`,
      [userId]);
    if (!res.rows || !res.rows[0]) {
      return;
    }
    let user = res.rows[0];
    user.keys = [];
    return user;
  }

  async getUserIdByName(name) {
    const res = await this.pool.query(
      `select (id) from users where name = $1`,
      [name]);
    if (!res.rows || !res.rows[0]) {
      return;
    }
    return res.rows[0].id;
  }

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
      return await this.getUser(name);
    }
    return false;
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
