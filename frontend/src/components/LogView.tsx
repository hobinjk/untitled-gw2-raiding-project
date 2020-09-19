import React, { useEffect, useState } from 'react';
import {
  useParams,
  Link,
} from 'react-router-dom';

import PlayersList from './PlayersList';
import LogHeader from './LogHeader';

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
      const res = await fetch(`/api/v0/logs/${logId}`);
      const data = await res.json();
      const resStats = await fetch(`/api/v0/logs/stats/${logId}`);
      const dataStats = await resStats.json();

      setAppState({
        loading: false,
        log: data,
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
