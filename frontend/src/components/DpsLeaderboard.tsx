import React, { useEffect, useState } from 'react';
import DpsLeaderboardItem from './DpsLeaderboardItem';
import API from '../API';

type IDpsLeaderboardState = {
  loading: boolean,
  logs: any,
};

export default function DpsLeaderboard(props: any) {
  const {
    fightName,
    role,
    personal,
  } = props;

  const [appState, setAppState] = useState<IDpsLeaderboardState>({
    loading: false,
    logs: null,
  });

  useEffect(() => {
    setAppState({
      loading: true,
      logs: null,
    });
    const load = async () => {
      const query = new URLSearchParams();
      query.set('fightName', fightName);
      query.set('role', role);
      query.set('personal', personal);
      const res = await API.fetch(`/api/v0/stats/targetDpsLeaderboard?${query.toString()}`);
      const data = await res.json();

      setAppState({
        loading: false,
        logs: data,
      });
    };
    load();
  }, [setAppState]);

  if (appState.loading) {
    return (
      <p>Loading</p>
    );
  }

  if (!appState.logs) {
    return (
      <p>No logs found</p>
    );
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th>
            Target DPS
          </th>
          <th>
            All DPS
          </th>
          <th>
            Account Name
          </th>
          <th>
            Role
          </th>
          <th>
            Fight Name
          </th>
          <th>
            Start
          </th>
          <th>
            <abbr title="Duration">Dur</abbr>
          </th>
          <th>
            Players
          </th>
          <th>
          </th>
          <th>
          </th>
        </tr>
      </thead>
      <tbody>
      {appState.logs.map((log: any) => {
        return (
          <DpsLeaderboardItem key={log.log_id} account={log.account}
            role={log.role} targetDps={log.target_dps}
            allDps={log.all_dps} logId={log.log_id}
            fightName={log.fight_name} timeStart={log.time_start}
            duration={log.duration} durationMs={log.duration_ms}
            players={log.players}
            dpsReportLink={log.dps_report_link} />
        );
      })}
      </tbody>
    </table>
  );
}
