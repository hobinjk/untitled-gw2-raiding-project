import React from 'react';

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

  const buffNames = ['Might', 'Quickness', 'Alacrity'];

  return (
    <section className="section">
      <h1 className="title">Graphs</h1>

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
    </section>
  );
}

export default GraphsView;
