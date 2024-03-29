import React, { useEffect, useState } from 'react';
import {
  useParams,
} from 'react-router-dom';

import PlayersList from './PlayersList';
import LogHeader from './LogHeader';
import API from '../API';

function LogView() {
  const params: any = useParams();
  const logId = params.logId;

  const [appState, setAppState] = useState({
    loading: false,
    log: null,
    stats: null,
  });

  useEffect(() => {
    setAppState({
      loading: true,
      log: null,
      stats: null,
    });

    const load = async () => {
      const res = await API.fetch(`/api/v0/logs/${logId}`);
      const log = await res.json();
      const resStats = await API.fetch(`/api/v0/logs/percentiles/${logId}`);
      const dataStats = await resStats.json();

      const players: { [name: string]: boolean } = {};
      for (let player of log.players) {
        players[player.name] = true;
      }

      log.mechanics = (log.mechanics || []).filter((mechanic: any) => {
        for (let occurrence of mechanic.mechanicsData) {
          if (players.hasOwnProperty(occurrence.actor)) {
            return true;
          }
        }
        return false;
      });

      setAppState({
        loading: false,
        log,
        stats: dataStats,
      });
    };
    load();
  }, [setAppState, params]);

  return (
    <section className="section">
      <div className="container is-centered">
        <LogHeader loading={appState.loading} log={appState.log} />
      </div>
      <div className="container">
        <PlayersList log={appState.log} stats={appState.stats} />
      </div>
    </section>
  );
}

export default LogView;
