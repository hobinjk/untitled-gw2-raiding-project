import { MaxDpsAnalysis } from '../logAnalysis/getMaxDpsReport';

import type {ILogStats} from './LogsSession';

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

function zeroPad(n: string, len: number): string {
  while (n.length < len) {
    n = '0' + n;
  }
  return n;
}

let prevComp = '';

function logStatsToString(logStats: ILogStats): string {
  let durS = zeroPad(Math.floor((logStats.durationMs / 1000) % 60).toString(), 2);
  let durM = Math.floor(logStats.durationMs / (60 * 1000)).toString();
  let durMs = zeroPad((logStats.durationMs % 1000).toString(), 3)
  let durPretty = `${durM}:${durS}.${durMs}`;
  let durPercEmoji = '';
  if (logStats.success) {
    durPercEmoji = Math.round(logStats.durationMsPercentile).toString();
    if (logStats.logMeta.emboldened) {
      durPercEmoji += 'E';
    }
  } else {
    durPercEmoji = logStats.finalPhase;
  }

  let failsBefore = '';
  if (logStats.success) {
    for (let i = 0; i < logStats.failsBefore; i++) {
      failsBefore += ':skull_crossbones: ';
    }
  }

  let groupLast = -1;
  let comp = Array.from(logStats.logMeta.players).sort((playerA: any, playerB: any) => {
    if (playerA.group !== playerB.group) {
      return playerA.group - playerB.group;
    }
    return playerA.role.localeCompare(playerB.role);
  }).map((player: any) => {
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
  if (comp === prevComp) {
    comp = '';
  } else {
    prevComp = comp;
  }
  let str = `${logStats.dpsReportLink} ${durPretty} ${durPercEmoji} ${failsBefore}\n` +
    `${comp}       ${logStats.downs}:small_red_triangle_down:   ${logStats.deaths}:skull:\n`;
  if (logStats.revealIncidentReport) {
    str += logStats.revealIncidentReport + '\n';
  }
  return str;
}

export default function LogsSessionOverviewCopy(props: any) {
  const logStats: Array<ILogStats> = props.logStats;

  const copySuccessStats = () => {
    copyStats(logStats.filter(ls => ls.success));
  };

  const copyLogStats = () => {
    copyStats(logStats);
  };

  const copyStats = (stats: Array<ILogStats>) => {
    let text = stats.map(logStats => {
      return logStatsToString(logStats);
    }).join('\n');

    const maxDpsAnalysis = new MaxDpsAnalysis();
    for (let logStats of stats) {
      maxDpsAnalysis.process(logStats.dpsReportLink, logStats.log);
    }
    text += '\n\nMax DPS by phase:' + maxDpsAnalysis.toString();

    navigator.clipboard.writeText(text);
  };

  return (
    <div>
      <input type="button" className="button" onClick={copySuccessStats} value="Copy Wins" />
      <input type="button" className="button" onClick={copyLogStats} value="Copy All" />
    </div>
  );
}

