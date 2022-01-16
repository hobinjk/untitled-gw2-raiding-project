import React from 'react';
import './LogsSessionTimeOverview.css';

type IExtent = {
  name: string,
  start: number,
  end: number,
  success: boolean,
}

export default function LogsSessionTimeOverview(props: any) {
  const { logs } = props;
  if (!logs) {
    return (
      <></>
    );
  }

  let extents: IExtent[] = [];
  let kills = 0;
  let fails = 0;

  for (const log of logs) {
    let logDateStart = new Date(log.time_start);
    let logDateEnd = new Date(logDateStart.getTime() + log.duration_ms);
    let dur = logDateEnd.getTime() - logDateStart.getTime();
    extents.push({
      name: log.fight_name,
      start: logDateStart.getTime(),
      end: logDateEnd.getTime(),
      success: log.success,
    });
    if (log.success) {
      kills += dur;
    } else {
      fails += dur;
    }
  }
  extents.sort((a, b) => {
    return a.start - b.start;
  });
  let total = extents[extents.length - 1].end - extents[0].start;
  let prettySP = Math.round(100 * kills / total);
  let prettyDP = Math.round(100 * (total - kills - fails) / total);
  let prettyFP = Math.round(100 * fails / total);

  return (
    <div>
      <div>
        {prettySP}% successes {prettyFP}% failures {prettyDP}% downtime
      </div>
      <div className="logs-session-time-overview-graph-container">
        {extents.map((extent) => {
          let cls = 'logs-session-time-overview-graph-' +
            (extent.success ? 'success' : 'failure');
          let start = 100 * (extent.start - extents[0].start) / total + '%';
          let width = 100 * (extent.end - extent.start) / total + '%';
          let durPretty = ((extent.end - extent.start) / 1000).toFixed(1)
          let title = (extent.success ? 'Killed ' : 'Wiped on ') +
            extent.name + ' in ' + durPretty + 's'
          return (
            <div className={cls}
                 title={title}
                 style={{
                   left: start,
                   width,
                 }}></div>
          );
        })}
      </div>
    </div>
  );
}

