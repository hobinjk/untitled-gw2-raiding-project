import React from 'react';
import makePercentile from '../makePercentile';

const boringMechanics = {
  'Got up': true,
  'Res': true,
  // VG
  'Green Cast R': true,
  'Green Cast G': true,
  'Green Cast B': true,
  'Invuln Strip': true,
  // Gorseval
  // Sabetha
  // Slothasor
  // Matthias Gabrel
  // KC
  'Rift#': true,
  // Xera
  'Button1': true,
  'Button2': true,
  'Button3': true,
  'Shield': true,
  // Cairn
  // Mursaat Overseer
  'Dispel': true,
  // Samarog
  'G.Fix': true,
  'R.Fix': true,
  // Deimos
  'Green': true,
  'TP': true,
  'DMG Debuff': true,
  // Soulless Horror
  // Dhuum
  // Conjured Amalgamate
  'Pulverize': true,
  // Twin Largos
  'Ken Aura': true,
  'Nik Aura': true,
  // Qadim
  'Claw': true,
  // Adina
  // Sabir
  // Qadim the Peerless
};

type IMechanicState = {
  name: string,
  value: number,
  percentile: number|null,
};

type IMechanicStatsState = {
  [key: string]: IMechanicState
};

function abbreviate(name: string) {
  return name.replace(/[^A-Z]/g, '');
}

export default function MechanicStats(props: any) {
  const { stats } = props;

  const mechanicStatsState = (() => {
    const mechanicStatsState: IMechanicStatsState = {};

    for (let mechanic of stats.mechanics) {
      if (boringMechanics.hasOwnProperty(mechanic.name)) {
        continue;
      }
      mechanicStatsState[mechanic.name] = {
        name: mechanic.description,
        value: mechanic.value,
        percentile: mechanic.percentile,
      };
    }

    return mechanicStatsState;
  })();

  return (
    <div>
      <table className="table">
        <tr>
          {Object.keys(mechanicStatsState).map((name) => {
            return (<td>
              <abbr title={mechanicStatsState[name].name}>
                {abbreviate(name)}
              </abbr>
          </td>);
          })}
        </tr>
        <tr>
          {Object.values(mechanicStatsState).map((stat) => {
            return (<td>
              {makePercentile(stat.value, stat.percentile)}
            </td>);
          })}
        </tr>
      </table>
    </div>
  );
}
