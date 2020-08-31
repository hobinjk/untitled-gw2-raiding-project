import React, { useEffect, useState } from 'react';
import {
  useLocation,
} from 'react-router-dom';

import './LogsView.css';
import LogsList from './LogsList';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function LogsView() {
  const query = useQuery();

  const [appState, setAppState] = useState({
    loading: false,
    logs: null,
  });

  useEffect(() => {
    setAppState({
      loading: true,
      logs: null,
    });
    const load = async () => {
      const res = await fetch(`/api/v0/logs?${query.toString()}`);
      const data = await res.json();
      console.log('huh?', data);
      setAppState({
        loading: false,
        logs: data.logs,
      });
    };
    load();
  }, [setAppState]);

  return (
    <div>
      <header className="App-header">
        Logs
      </header>
      <LogsList loading={appState.loading} logs={appState.logs} />
    </div>
  );
}

export default LogsView;

