import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import PlayersComposition from './PlayersComposition';
import makePercentile from '../makePercentile';
import API from '../API';

type ILogsListItemState = {
  percentile: number|null,
};


export default function LogsListItem(props: any) {
  const location = useLocation();

  const {
    logId,
    success,
    fightName,
    timeStart,
    duration,
    durationMs,
    players,
    healthPercentBurned,
    tags,
    dpsReportLink,
  } = props;

  const [appState, setAppState] = useState<ILogsListItemState>({
    percentile: null,
  });

  function queryPlus(qp: {[key:string]: string}) {
    let params = new URLSearchParams(location.search);
    params.delete('start');

    for (let key in qp) {
      // if (key === 'tags') {
      //   let curTags = (params.get('tags') || '').split(',');
      //   let newTags = curTags.concat(qp[key].split(','));
      //   params.set(key, newTags.join(','));
      // }
      params.set(key, qp[key]);
    }
    return params.toString();
  }

  let dateParts = new Date(timeStart).toISOString().split('T');
  let prettyStart = `${dateParts[0]} ${dateParts[1].split('.')[0]}`;
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
        <Link to={`/logs?${queryPlus({fightName: fightName})}`}>{fightName}</Link>
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
        {tags.map((tag: string) => {
          return (<>
            <Link to={`/logs?${queryPlus({tags: tag})}`}>{tag}</Link>
          </>);
        })}
      </td>
      <td>
        {dpsReportLink &&
          <a href={dpsReportLink}>dps.report</a>}
      </td>
      <td>
        <Link to={`/logs/${logId}`}>More</Link>
      </td>
    </tr>
  );
}

