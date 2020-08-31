import React from 'react';
import LogsListItem from './LogsListItem';

export default function LogsList(props: any) {
  const { loading, logs } = props;
  if (loading) {
    return (
      <p>Loading</p>
    );
  }

  if (!logs) {
    return (
      <p>No logs found</p>
    );
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th>
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
        </tr>
      </thead>
      <tbody>
      {logs.map((log: any) => {
        return (
          <LogsListItem key={log.id} success={log.success}
            fightName={log.fight_name} timeStart={log.time_start}
            duration={log.duration} players={log.players} />
        );
      })}
      </tbody>
    </table>
  );
}
