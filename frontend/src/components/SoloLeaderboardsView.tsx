import React from 'react';
import {
  useLocation,
  Link,
} from 'react-router-dom';

import DpsLeaderboard from './DpsLeaderboard';

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

const golemNames = [
  'Standard Kitty Golem',
  'Medium Kitty Golem',
  'Large Kitty Golem',
];

export default function SoloLeaderboardsView() {
  const location = useLocation();

  const query = new URLSearchParams(location.search);
  const role = query.get('role') || '';
  const personal = query.get('personal') || false;

  return (
    <section className="section">
      <h1 className="title">Solo Leaderboards</h1>

    {fightNames.map(fightName => {
      return (<div>
        <h2 className="subtitle">{fightName}</h2>
        <h3 className="subtitle">Target DPS</h3>
        <DpsLeaderboard fightName={fightName} role={role} personal={personal} />
      </div>);
    })}

    {golemNames.map(fightName => {
      return (<div>
        <h2 className="subtitle">{fightName}</h2>
        <h3 className="subtitle">Target DPS</h3>
        <DpsLeaderboard fightName={fightName} role={role} personal={personal} />
      </div>);
    })}
    </section>
  );
}
