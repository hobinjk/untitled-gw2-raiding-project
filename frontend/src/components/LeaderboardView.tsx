import React, { useEffect, useState } from 'react';
import {
  useLocation,
} from 'react-router-dom';

import LogsList from './LogsList';
import './LeaderboardView.css';
import API from '../API';

type ILeaderboardViewState = {
  loading: {[fightName: string]: boolean}
  logs: {[fightName: string]: any},
};

async function loadFightLeaderboardLogs(fightName: string) {
  const query = new URLSearchParams();
  query.set('fightName', fightName);
  query.set('order', 'duration');
  query.set('success', 'true');
  query.set('limit', '10');
  const res = await API.fetch(`/api/v0/logs?${query.toString()}`);
  const data = await res.json();
  return data.logs;
}

function LeaderboardView() {
  const fightNames = [
    'Vale Guardian',
    'Gorseval the Multifarious',
    'Sabetha the Saboteur',
    'Slothasor',
    'Matthias Gabrel',
    'Keep Construct',
    'Xera',
    'Cairn',
    'Mursaat Overseer',
    'Samarog',
    'Deimos',
    'Soulless Horror',
    'Dhuum',
    'Conjured Amalgamate',
    'Twin Largos',
    'Qadim',
    'Cardinal Adina',
    'Cardinal Sabir',
    'Qadim the Peerless',
  ];
  const location = useLocation();

  let allLoading: {[fightName: string]: boolean} = {};
  for (let fightName of fightNames) {
    allLoading[fightName] = true;
  }

  const [appState, setAppState] = useState<ILeaderboardViewState>({
    loading: allLoading,
    logs: {},
  });

  useEffect(() => {
    let allLogs: {[fightName: string]: any} = {};
    for (let fightName of fightNames) {
      (async () => {
        const logs = await loadFightLeaderboardLogs(fightName);
        allLogs[fightName] = logs;
        allLoading[fightName] = false;
        setAppState({
          loading: allLoading,
          logs: allLogs,
        });
      })();
    };
  }, [setAppState, location]);


  return (
    <section className="section">
      <h1 className="title">Leaderboard</h1>

    {fightNames.map(fightName => {
      return (<div>
        <h2 className="subtitle">{fightName}</h2>
        <LogsList loading={appState.loading[fightName]} logs={appState.logs[fightName]} />
      </div>);
    })}
    </section>
  );
}

export default LeaderboardView;


