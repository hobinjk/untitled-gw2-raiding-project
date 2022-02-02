import React from 'react';
import SpecIcon from './SpecIcon';

export default function PlayersComposition(props: any) {
  const players = props.players.filter((player: any) => {
    return player.account.includes('.');
  });

  if (players.length === 0) {
    return (<span></span>);
  }

  let group = players[0].group;

  return (
    <span>
      {players.map((player: any) => {
        let parts = player.role.split(' ');
        let icon = (
          <SpecIcon spec={parts[parts.length - 1]} title={player.account} />
        )
        if (player.group === group) {
          return icon;
        }
        group = player.group;
        return (
          <span>
            <span style={{display: 'inline-block', width: '10px'}} > </span>
            {icon}
          </span>
        );
      })}
    </span>
  );
}

