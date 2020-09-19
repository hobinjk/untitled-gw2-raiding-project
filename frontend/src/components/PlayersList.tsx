import React from 'react';
import PlayersListItem from './PlayersListItem';

export default function PlayersList(props: any) {
  const { log, stats } = props;
  if (!log) {
    return (
      <p>Loading</p>
    );
  }

  const statsByAccount: { [account:string]:any; } = {};
  for (let stat of stats) {
    statsByAccount[stat.account] = stat;
  }

  return (
    <table>
      {log.players.map((player: any) => {
        return (
          <PlayersListItem key={player.account} player={player} log={log} stats={statsByAccount[player.account]} />
        );
      })}
    </table>
  );
}

