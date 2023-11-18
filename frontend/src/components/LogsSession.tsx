import API from '../API';
import { useEffect, useState } from 'react';
import './LogsSession.css';
import LogsSessionTimeOverview from './LogsSessionTimeOverview';
import LogsSessionPlayerOverview from './LogsSessionPlayerOverview';
import LogsSessionOverviewCopy from './LogsSessionOverviewCopy';
import LogsSessionFunnel from './LogsSessionFunnel';
import { getRevealIncidentReport } from '../logAnalysis/getRevealIncidentReport';

export type ILogMeta = any;

export type ILogStats = {
  logMeta: ILogMeta,
  log: any,
  success: boolean,
  dpsReportLink: string,
  durationMs: number,
  durationMsPercentile: number,
  downs: number,
  deaths: number,
  failsBefore: number,
  finalPhase: string,
  revealIncidentReport: string,
}

type ILogsSessionState = {
  logStats: Array<ILogStats>
}

export default function LogsSession(props: any) {
  const { logs, session } = props;

  let fails: { [fightName: string]: number } = {};

  const logStats: Array<ILogStats> = [];

  for (const log of logs) {
    if (!log.success) {
      if (!fails.hasOwnProperty(log.fight_name)) {
        fails[log.fight_name] = 0;
      }
      fails[log.fight_name] += 1;
    }
    let durationMs = log.duration_ms;
    let failsBefore = fails[log.fight_name] || 0;
    const stats: ILogStats = {
      logMeta: log,
      log: null,
      success: log.success,
      dpsReportLink: log.dps_report_link,
      durationMs,
      durationMsPercentile: -1,
      downs: -1,
      deaths: -1,
      failsBefore,
      finalPhase: '',
      revealIncidentReport: '',
    };
    logStats.push(stats);
  }

  const [appState, setAppState] = useState<ILogsSessionState>({
    logStats,
  });

  useEffect(() => {
    const load = async () => {
      const newLogStats = appState.logStats.map((obj: ILogStats) => Object.assign({}, obj));
      let proms = newLogStats.map(async (logStats) => {
        const logId = logStats.logMeta.log_id;
        const res = await API.fetch(`/api/v0/logs/${logId}`);
        const log = await res.json();
        logStats.log = log;
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

        if (log.phases && log.phases.length > 0) {
          let finalPhaseName = log.phases[log.phases.length - 1].name;
          for (let target of Array.from(log.targets).reverse() as Array<any>) {
            if (target.name === finalPhaseName) {
              finalPhaseName = target.healthPercentBurned.toFixed(1) + ' ' + finalPhaseName;
              break;
            }
          }

          logStats.finalPhase = finalPhaseName;

        }

        logStats.revealIncidentReport = getRevealIncidentReport(log)

        const query = new URLSearchParams();
        query.set('fightName', logStats.logMeta.fight_name)
        query.set('durationMs', logStats.durationMs.toString())
        const resPerc = await API.fetch(`/api/v0/stats/percentiles/durationMs?${query.toString()}`);
        const percentile: number = (await resPerc.json()).durationMsPercentile;
        logStats.durationMsPercentile = percentile;

        return logStats;
      });
      await Promise.all(proms);

      setAppState({
        logStats: newLogStats,
      });
    }
    load();
  }, []);

  if (!session || !logs) {
    return (
      <></>
    );
  }

  let sessionName = session.split('-')[1];
  let dateStart = null;
  let dateEnd = null;

  for (const log of logs) {
    let logDateStart = new Date(log.time_start);
    let logDateEnd = new Date(logDateStart.getTime() + log.duration_ms);
    if (!dateStart || logDateStart.getTime() < dateStart.getTime()) {
      dateStart = logDateStart;
    }
    if (!dateEnd || logDateEnd.getTime() > dateEnd.getTime()) {
      dateEnd = logDateEnd;
    }
  }

  if (!dateStart) {
    return (
      <></>
    );
  }

  let dateParts = dateStart.toISOString().split('T');
  let prettyStart = `${dateParts[0]} ${dateParts[1].split('.')[0]}`;

  return (
    <div className="container is-centered">
      <div className="logs-session-container mb-4">
        <div className="logs-session-title title">
          {sessionName}
        </div>
        <div className="logs-session-date">
          {prettyStart}
          <LogsSessionOverviewCopy logStats={appState.logStats} />
        </div>
      </div>
      <div className="container mb-4">
        <LogsSessionTimeOverview logs={logs} />
      </div>
      <div className="container mb-4">
        <LogsSessionPlayerOverview logs={logs} />
      </div>
      <div className="container mb-4">
        <LogsSessionFunnel logStats={appState.logStats} />
      </div>
    </div>
  );
}
