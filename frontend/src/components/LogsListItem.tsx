import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PlayersComposition from './PlayersComposition';
import makePercentile from '../makePercentile';
import API from '../API';

type ILogsListItemState = {
  percentile: number|null,
};


export default function LogsListItem(props: any) {
  const {
    logId,
    success,
    fightName,
    timeStart,
    duration,
    durationMs,
    players,
    healthPercentBurned
  } = props;

  const [appState, setAppState] = useState<ILogsListItemState>({
    percentile: null,
  });

  let dateParts = timeStart.split(' ');
  // let date = new Date(`${dateParts[0]} ${dateParts[1]}${dateParts[2]}`);
  let prettyStart = `${dateParts[0]} ${dateParts[1]}`;
  let durationRe = /((\d+)h )?((\d+)m )?(\d+)s (\d+)ms/;
  let durationParts = durationRe.exec(duration);
  let durPretty = duration;
  let durPrettyLong = duration;
  if (durationParts) {
    let durHours: string|number = parseInt(durationParts[2] || '0');
    let durMinutes: string|number = parseInt(durationParts[4] || '0');
    let durSeconds: string|number = parseInt(durationParts[5] || '0');
    let durMs: string = durationParts[6];
    if (durMinutes < 10 && durHours > 0) {
      durMinutes = `0${durMinutes}`;
    }
    if (durSeconds < 10) {
      durSeconds = `0${durSeconds}`;
    }
    durPretty = (durHours > 0 ? `${durHours}:` : ``) +
      `${durMinutes}:${durSeconds}`;
    durPrettyLong = `${durPretty}.${durMs}`;
  }

  useEffect(() => {
    if (!success) {
      return;
    }

    (async () => {
      const query = new URLSearchParams();
      query.set('fightName', fightName);
      query.set('durationMs', durationMs);

      const res = await API.fetch(`/api/v0/stats/percentiles/durationMs?${query.toString()}`);
      const percentile: number = (await res.json()).durationMsPercentile;
      setAppState({
        percentile,
      });
    })();
  }, []);


  return (
    <tr>
      <td>
        {success ?
          <span className="icon has-text-success"><i className="fas fa-check"></i></span> :
          <span className="has-text-danger">{Math.ceil(100 - healthPercentBurned)}</span>
        }
      </td>
      <td>
        {fightName}
      </td>
      <td>
        {prettyStart}
      </td>
      <td>
        <span title={durPrettyLong}>{makePercentile(durPretty, appState.percentile, false)}</span>
      </td>
      <td>
        <PlayersComposition players={players} />
      </td>
      <td>
        <Link to={`/logs/${logId}`}>More</Link>
      </td>
    </tr>
  );
}

