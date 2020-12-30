import React, { useEffect, useState } from 'react';
import {
  useLocation,
  Link,
} from 'react-router-dom';

import './LogsView.css';
import LogsList from './LogsList';

type ILogsViewState = {
  loading: boolean,
  logs: any,
  logsLinkFirst: string|null,
  logsLinkPrev: string|null,
  logsLinkNext: string|null,
  logsLinkLast: string|null,
};

function makeQueryWithStart(query: URLSearchParams, start: number) {
  let qws = new URLSearchParams(query);
  qws.set('start', start.toString());
  return qws.toString();
}

function LogsView() {
  const location = useLocation();

  const [appState, setAppState] = useState<ILogsViewState>({
    loading: false,
    logs: null,
    logsLinkFirst: null,
    logsLinkPrev: null,
    logsLinkNext: null,
    logsLinkLast: null,
  });

  useEffect(() => {
    setAppState({
      loading: true,
      logs: null,
      logsLinkFirst: null,
      logsLinkPrev: null,
      logsLinkNext: null,
      logsLinkLast: null,
    });
    const load = async () => {
      const query = new URLSearchParams(location.search);
      const res = await fetch(`/api/v0/logs?${query.toString()}`);
      const data = await res.json();

      let logsLinkFirst = `/logs?${makeQueryWithStart(query, 0)}`;
      let logsLinkPrev: string|null = null;
      let logsLinkNext: string|null = null;
      let lastStart = Math.floor(data.count / data.page.limit) * data.page.limit;
      let logsLinkLast = `/logs?${makeQueryWithStart(query, lastStart)}`;

      if (data.logs.length >= data.page.limit) {
        const nextStart = data.page.start + data.page.limit;
        logsLinkNext = `/logs?${makeQueryWithStart(query, nextStart)}`;
      }

      if (data.page.start > 0) {
        const prevStart = Math.max(0, data.page.start - data.page.limit);
        logsLinkPrev = `/logs?${makeQueryWithStart(query, prevStart)}`;
      }

      setAppState({
        loading: false,
        logs: data.logs,
        logsLinkFirst,
        logsLinkPrev,
        logsLinkNext,
        logsLinkLast,
      });
    };
    load();
  }, [setAppState, location]);


  return (
    <section className="section">
      <div className="container is-centered">
        <LogsList loading={appState.loading} logs={appState.logs} />
      </div>
      <nav className="pagination is-centered" role="navigation" aria-label="pagination">
        {appState.logsLinkFirst &&
          <Link className="pagination-previous" to={appState.logsLinkFirst}>First</Link>}

        {appState.logsLinkPrev &&
          <Link className="pagination-previous" to={appState.logsLinkPrev}>Previous</Link>}

        {appState.logsLinkNext &&
          <Link className="pagination-next" to={appState.logsLinkNext}>Next</Link>}

        {appState.logsLinkLast &&
          <Link className="pagination-next" to={appState.logsLinkLast}>Last</Link>}
      </nav>
    </section>
  );
}

export default LogsView;

