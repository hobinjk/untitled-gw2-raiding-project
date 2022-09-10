import API from '../API';
import { useEffect, useState } from 'react';

type ILogsSessionOverviewCopyState = {
  logStats: Array<ILogStats>
}

const specToEmoji: { [spec: string]: string } = {
  'Elementalist': '0_elementalist',
  'Catalyst': '0_elementalist_catalyst',
  'Tempest': '0_elementalist_tempest',
  'Weaver': '0_elementalist_catalyst',

  'Engineer': '0_engineer',
  'Holosmith': '0_engineer_holosmith',
  'Mechanist': '0_engineer_mechanist',
  'Scrapper': '0_engineer_scrapper',

  'Guardian': '0_guardian',
  'Dragonhunter': '0_guardian_dragonhunter',
  'Firebrand': '0_guardian_firebrand',
  'Willbender': '0_guardian_willbender',

  'Mesmer': '0_mesmer',
  'Chronomancer': '0_mesmer_chronomancer',
  'Mirage': '0_mesmer_mirage',
  'Virtuoso': '0_mesmer_virtuoso',

  'Necromancer': '0_necromancer',
  'Harbinger': '0_necromancer_harbinger',
  'Reaper': '0_necromancer_reaper',
  'Scourge': '0_necromancer_scourge',

  'Ranger': '0_ranger',
  'Druid': '0_ranger_druid',
  'Soulbeast': '0_ranger_soulbeast',
  'Untamed': '0_ranger_untamed',

  'Revenant': '0_revenant',
  'Herald': '0_revenant_herald',
  'Renegade': '0_revenant_renegade',
  'Vindicator': '0_revenant_vindicator',

  'Thief': '0_thief',
  'Daredevil': '0_thief_daredevil',
  'Deadeye': '0_thief_deadeye',
  'Specter': '0_thief_specter',

  'Warrior': '0_warrior',
  'Berserker': '0_warrior_berserker',
  'Bladesworn': '0_warrior_bladesworn',
  'Spellbreaker': '0_warrior_spellbreaker',
}

type ILogStats = {
  log: any,
  dpsReportLink: string,
  durationMs: number,
  durationMsPercentile: number,
  downs: number,
  deaths: number,
  failsBefore: number,
}

function zeroPad(n: string, len: number): string {
  while (n.length < len) {
    n = '0' + n;
  }
  return n;
}

function logStatsToString(logStats: ILogStats): string {
  let durS = zeroPad(Math.floor((logStats.durationMs / 1000) % 60).toString(), 2);
  let durM = Math.floor(logStats.durationMs / (60 * 1000)).toString();
  let durMs = zeroPad((logStats.durationMs % 1000).toString(), 3)
  let durPretty = `${durM}:${durS}.${durMs}`;
  let durPercEmoji = Math.round(logStats.durationMsPercentile).toString();
  let failsBefore = '';
  for (let i = 0; i < logStats.failsBefore; i++) {
    failsBefore += ':skull_crossbones: ';
  }

  let groupLast = -1;
  let comp = logStats.log.players.map((player: any) => {
    let group = player.group;
    if (groupLast < 0) {
      groupLast = group;
    }
    let groupPad = groupLast === group ? '' : `    `;
    groupLast = group;
    const parts = player.role.split(' ');
    const spec = parts[parts.length - 1];

    if (specToEmoji.hasOwnProperty(spec)) {
      return `${groupPad}:${specToEmoji[spec]}:`;
    }
    return '';
  }).join('').trim();
  return `${logStats.dpsReportLink} ${durPretty} ${durPercEmoji} ${failsBefore}\n` +
    `${comp}       ${logStats.downs}:small_red_triangle_down:   ${logStats.deaths}:skull:\n`;
}

export default function LogsSessionOverviewCopy(props: any) {
  const { logs } = props;

  let fails: { [fightName: string]: number } = {};

  const logStats: Array<ILogStats> = [];

  for (const log of logs) {
    if (!log.success) {
      if (!fails.hasOwnProperty(log.fight_name)) {
        fails[log.fight_name] = 0;
      }
      fails[log.fight_name] += 1;
      continue;
    }
    let durationMs = log.duration_ms;
    let failsBefore = fails[log.fight_name] || 0;
    logStats.push({
      log: log,
      dpsReportLink: log.dps_report_link,
      durationMs,
      durationMsPercentile: -1,
      downs: -1,
      deaths: -1,
      failsBefore,
    });
  }

  const [appState, setAppState] = useState<ILogsSessionOverviewCopyState>({ logStats: logStats });

  useEffect(() => {
    const load = async () => {
      const newLogStats = appState.logStats.map((obj: ILogStats) => Object.assign({}, obj));
      let proms = newLogStats.map(async (logStats) => {
        const logId = logStats.log.log_id;
        const res = await API.fetch(`/api/v0/logs/${logId}`);
        const log = await res.json();
        logStats.deaths = 0;
        logStats.downs = 0;
        for (let mechanic of log.mechanics) {
          for (let _occ of mechanic.mechanicsData) {
            if (mechanic.name === 'Dead') {
              logStats.deaths += 1;
            } else if (mechanic.name === 'Downed') {
              logStats.downs += 1;
            }
          }
        }

        const query = new URLSearchParams();
        query.set('fightName', logStats.log.fight_name)
        query.set('durationMs', logStats.durationMs.toString())
        const resPerc = await API.fetch(`/api/v0/stats/percentiles/durationMs?${query.toString()}`);
        const percentile: number = (await resPerc.json()).durationMsPercentile;
        logStats.durationMsPercentile = percentile;

        return logStats;
      });
      await Promise.all(proms);

      setAppState({ logStats: newLogStats });
    }
    load();
  }, []);

  const copyLogStats = () => {
    let text = appState.logStats.map(logStats => {
      return logStatsToString(logStats);
    }).join('\n');

    navigator.clipboard.writeText(text);
  };

  return (
    <div>
      <input type="button" className="button" onClick={copyLogStats} value="Copy" />
    </div>
  );
}

