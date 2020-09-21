import React from 'react';
import DPSBar from './DPSBar';
import BoonStats from './BoonStats';
import MechanicStats from './MechanicStats';
import './PlayersListItem.css';

export default function PlayersListItem(props: any) {
  const { player, log, stats } = props;

  console.log(stats);

  return (
    <tr>
      <td>
        <div>
          <h2 className="subtitle name">{ player.name } <span className="account">{ player.account }</span></h2>
        </div>
        <p><small>{ player.role }</small></p>
        <DPSBar player={player} log={log} stats={stats} />
      </td>
      <td>
        <BoonStats player={player} stats={stats} />
      </td>
      <td>
        <MechanicStats player={player} log={log} stats={stats} />
      </td>
    </tr>
  );
}


