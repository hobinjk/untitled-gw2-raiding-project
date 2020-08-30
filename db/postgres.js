import pg from 'pg';
const {Pool} = pg;

export default class PGDatabase {
  constructor() {
    this.pool = new Pool({
      database: 'raidcleanser',
    });
  }

  async create() {
    await this.pool.query(`drop index if exists logs_fightname_idx`);
    await this.pool.query(`drop table if exists dps_stats`);
    await this.pool.query(`drop table if exists players_to_logs`);
    await this.pool.query(`drop table if exists players`);
    await this.pool.query(`drop table if exists logs`);

    await this.pool.query(`CREATE TABLE IF NOT EXISTS logs (
      id BIGSERIAL PRIMARY KEY,
      data jsonb not null
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

    await this.pool.query(`CREATE INDEX IF NOT EXISTS logs_fightname_idx ON logs ((data -> 'fightName'))`);
  }

  async insertLog(log) {
    let res = await this.pool.query(
      'INSERT INTO logs (data) VALUES ($1) RETURNING (id)',
      [log]);
    let logId = res.rows[0].id;
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
    }
  }

  /**
   * @param {Object} Query
   * @return {Array<Object>} metadata objects of all logs
   */
  async filterLogsMetadata(query) {
    const logMeta = `id, data -> 'success' AS success, data -> 'fightName' AS fightName, data -> 'timeStartStd' AS timeStart, data -> 'duration' AS duration, (SELECT jsonb_agg(filtered_player) from jsonb_array_elements(data -> 'players') player, jsonb_build_object('account', player -> 'account', 'group', player -> 'group', 'role', player -> 'role') filtered_player) as players FROM logs`;

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

      let logs = await this.pool.query(
        `SELECT ${logMeta} WHERE id IN (SELECT log_id FROM players_to_logs WHERE player_id = $1)`,
        [playerId]);
      return logs.rows;
    } else if (query.fightName) {
      let logs = await this.pool.query(`SELECT ${logMeta} WHERE data -> 'fightName' = $1`,
                                       [JSON.stringify(query.fightName)]);
      return logs.rows;
    } else {
      let logs = await this.pool.query(`SELECT ${logMeta}`);
      return logs.rows;
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
    return logs.rows[0].data;
  }
}
