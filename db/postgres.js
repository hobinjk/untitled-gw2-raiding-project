import {
  quicknessGeneration,
  alacrityGeneration,
  mightGeneration,
  buffIds,
} from '../guessRole.js';

import pg from 'pg';
const {Pool} = pg;

export default class PGDatabase {
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

    await this.pool.query(`CREATE TABLE IF NOT EXISTS logs (
      id BIGSERIAL PRIMARY KEY,
      data jsonb not null
    )`);
    await this.pool.query(`CREATE TABLE IF NOT EXISTS logs_meta (
      log_id BIGSERIAL REFERENCES logs(id),
      success boolean,
      fight_name VARCHAR(64) NOT NULL,
      time_start VARCHAR(64) NOT NULL,
      duration VARCHAR(16) NOT NULL,
      duration_ms integer,
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

  async insertLog(log) {
    let res = await this.pool.query(
      'INSERT INTO logs (data) VALUES ($1) RETURNING (id)',
      [log]);
    let logId = res.rows[0].id;

    await this.pool.query(
      `INSERT INTO logs_meta SELECT id as log_id, (data -> 'success')::boolean AS success, data ->> 'fightName' AS fight_name, data ->> 'timeStartStd' AS time_start, data ->> 'duration' AS duration, (data -> 'phases' -> 0 -> 'end')::int as duration_ms, (SELECT jsonb_agg(filtered_player) from jsonb_array_elements(data -> 'players') player, jsonb_build_object('account', player -> 'account', 'group', player -> 'group', 'role', player -> 'role') filtered_player) as players FROM logs WHERE id = $1`,
      [logId]);

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
  }

  /**
   * @param {Object} Query
   * @return {Array<Object>} metadata objects of all logs
   */
  async filterLogsMetadata(query, page = {start: 0, limit: 20}) {
    const logMeta = `* FROM logs_meta`;

    const order = query.order === 'duration' ? 'duration_ms' : 'time_start';
    const orderLimitOffset = `ORDER BY ${order} LIMIT ${page.limit} OFFSET ${page.start}`;

    let conditions = [];
    let args = [];

    if (query.account) {
      // do some nonsense
      const playerRes = await this.pool.query(
        `SELECT * FROM players WHERE account = $1`,
        [query.account]);
      if (!playerRes.rows[0]) {
        console.warn(`Player ${JSON.stringify(query.account)} not found`);
        return [];
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
      let logs = await this.pool.query(`SELECT ${logMeta} ${orderLimitOffset}`);
      return {
        logs: logs.rows,
        page,
      };
    } else {
      let where = 'WHERE ' + conditions.join(' AND ');
      let logs = await this.pool.query(
        `SELECT ${logMeta} ${where} ${orderLimitOffset}`,
        args);
      return {
        logs: logs.rows,
        page,
      };
    }
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
   * @return {Object} raw json data of log
   */
  async getLogStats(id) {
    let dpsStats = await this.pool.query(
      `SELECT * FROM dps_stats LEFT JOIN players ON players.id = dps_stats.player_id WHERE log_id = $1`,
      [id]);
    if (!dpsStats) {
      return;
    }
    return dpsStats.rows;
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

  async getMechanicsPercentile(fightName, mechanicName, occurrences) {
    const res = await this.pool.query(
      `select percent_rank($1) within group (order by occurrences asc)
      from mechanics_stats left join logs_meta on mechanics_stats.log_id = logs_meta.log_id
      where logs_meta.fight_name = $2 and mechanics_stats.mechanic_name = $3`,
      [occurrences, fightName, mechanicName]);
    return res.rows[0].percent_rank * 100;
  }

}
