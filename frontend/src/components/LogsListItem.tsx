import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import PlayersComposition from './PlayersComposition';
import makePercentile from '../makePercentile';
import API from '../API';
import makePrettyChronology from '../chrono';

type ILogsListItemState = {
  percentile: number|null,
};


export default function LogsListItem(props: any) {
  const location = useLocation();

  const {
    logId,
    success,
    emboldened,
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

  const {
    prettyStart,
    durPretty,
    durPrettyLong
  } = makePrettyChronology(timeStart, duration);

  useEffect(() => {
    if (!success) {
      return;
    }

    (async () => {
      const query = new URLSearchParams();
      query.set('fightName', fightName);
      query.set('durationMs', durationMs);
      if (emboldened) {
        query.set('allowEmboldened', 'true');
      }

      const res = await API.fetch(`/api/v0/stats/percentiles/durationMs?${query.toString()}`);
      const percentile: number = (await res.json()).durationMsPercentile;
      setAppState({
        percentile,
      });
    })();
  }, []);

  const emboldenedMarker = emboldened ? 'E' : '';

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
        <span title={durPrettyLong + emboldenedMarker}>{makePercentile(durPretty, appState.percentile, false)}</span>
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

