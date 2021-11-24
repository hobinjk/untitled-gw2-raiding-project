import React from 'react';

import FightDurationsGraph from './FightDurationsGraph';
import TargetDpsGraph from './TargetDpsGraph';
import MechanicsGraph from './MechanicsGraph';
import BuffOutputGraph from './BuffOutputGraph';

import './GraphsView.css';

function GraphsView() {
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

  const buffNames = ['Might', 'Quickness', 'Alacrity'];

  return (
    <section className="section">
      <h1 className="title">Graphs</h1>

    <h2 className="subtitle">Durations</h2>
    <FightDurationsGraph />

    {fightNames.map(fightName => {
      return (<div>
        <h2 className="subtitle">{fightName}</h2>
        <h3 className="subtitle">Target DPS</h3>
        <TargetDpsGraph fightName={fightName} />
        <h3 className="subtitle">Mechanics</h3>
        <MechanicsGraph fightName={fightName} />
        {buffNames.map(buffName => {
          return (<>
            <h3 className="subtitle">{buffName}</h3>
            <BuffOutputGraph fightName={fightName} buffName={buffName.toLowerCase()} />
          </>);
        })}
      </div>);
    })}

    {golemNames.map(fightName => {
      return (<div>
        <h2 className="subtitle">{fightName}</h2>
        <h3 className="subtitle">Target DPS</h3>
        <TargetDpsGraph fightName={fightName} />
      </div>);
    })}
    </section>
  );
}

export default GraphsView;
