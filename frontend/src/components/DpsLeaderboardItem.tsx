import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import PlayersComposition from './PlayersComposition';
import makePercentile from '../makePercentile';
import makePrettyChronology from '../chrono';
import API from '../API';

type IDpsLeaderboardItemState = {
  targetDpsPercentile: number|null,
  allDpsPercentile: number|null,
  durationPercentile: number|null,
};


export default function DpsLeaderboardItem(props: any) {
  const location = useLocation();

  const {
    account,
    role,
    targetDps,
    allDps,
    logId,
    fightName,
    timeStart,
    duration,
    durationMs,
    players,
    dpsReportLink,
  } = props;

  const {
    prettyStart,
    durPretty,
    durPrettyLong
  } = makePrettyChronology(timeStart, duration);

  const [appState, setAppState] = useState<IDpsLeaderboardItemState>({
    targetDpsPercentile: null,
    allDpsPercentile: null,
    durationPercentile: null,
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

  useEffect(() => {
    (async () => {
      const query = new URLSearchParams();
      query.set('fightName', fightName);
      query.set('role', role);
      query.set('targetDps', targetDps);
      query.set('allDps', allDps);

      const res = await API.fetch(`/api/v0/stats/percentiles/dps?${query.toString()}`);
      const percentiles = await res.json();

      const queryDur = new URLSearchParams();
      queryDur.set('fightName', fightName);
      queryDur.set('durationMs', durationMs);

      const resDur = await API.fetch(`/api/v0/stats/percentiles/durationMs?${queryDur.toString()}`);
      const percentile: number = (await resDur.json()).durationMsPercentile;

      setAppState({
        targetDpsPercentile: percentiles.targetPercentile,
        allDpsPercentile: percentiles.allPercentile,
        durationPercentile: percentile,
      });
    })();
  }, []);


  return (
    <tr>
      <td>
        {makePercentile(targetDps, appState.targetDpsPercentile, true)}
      </td>
      <td>
        {makePercentile(allDps, appState.allDpsPercentile, true)}
      </td>
      <td>
        {account}
      </td>
      <td>
        {role}
      </td>
      <td>
        <Link to={`/logs?${queryPlus({fightName: fightName})}`}>{fightName}</Link>
      </td>
      <td>
        {prettyStart}
      </td>
      <td>
        <span title={durPrettyLong}>{makePercentile(durPretty, appState.durationPercentile, false)}</span>
      </td>
      <td>
        <PlayersComposition players={players} />
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


