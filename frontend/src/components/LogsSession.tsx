import React from 'react';
import './LogsSession.css';
import LogsSessionTimeOverview from './LogsSessionTimeOverview';
import LogsSessionPlayerOverview from './LogsSessionPlayerOverview';

export default function LogsSession(props: any) {
  const { logs, session } = props;

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
        </div>
      </div>
      <div className="container mb-4">
        <LogsSessionTimeOverview logs={logs} />
      </div>
      <div className="container mb-4">
        <LogsSessionPlayerOverview logs={logs} />
      </div>
    </div>
  );
  // {logs.map((log: any) => {
  //   return (
  //     <LogsSessionItem key={log.log_id} logId={log.log_id}
  //       success={log.success} fightName={log.fight_name}
  //       timeStart={log.time_start} duration={log.duration}
  //       durationMs={log.duration_ms} players={log.players}
  //       healthPercentBurned={log.health_percent_burned} tags={log.tags} />
  //   );
  // })}
}
