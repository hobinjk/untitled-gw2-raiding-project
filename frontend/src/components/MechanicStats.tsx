import React from 'react';

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

function abbreviate(name: string) {
  return name.replace(/[^A-Z]/g, '');
}

export default function MechanicStats(props: any) {
  const { player, log } = props;

  const mechanicsOfPlayer: {[name:string]: any} = {};

  for (let mechanic of log.mechanics) {
    let times = 0;
    if (boringMechanics.hasOwnProperty(mechanic.name)) {
      continue;
    }
    if (mechanic.mechanicsData.length === 0) {
      continue;
    }
    for (let occurrence of mechanic.mechanicsData) {
      if (occurrence.actor === player.name) {
        times += 1;
      }
    }
    mechanicsOfPlayer[mechanic.name] = {
      times,
      description: mechanic.description,
    };
  }

  return (
    <div>
      <table className="table">
        <tr>
          {Object.keys(mechanicsOfPlayer).map((name) => {
            return (<td><abbr title={mechanicsOfPlayer[name].description}>
              {abbreviate(name)}
            </abbr></td>);
          })}
        </tr>
        <tr>
          {Object.keys(mechanicsOfPlayer).map((name) => {
            return (<td>
              {mechanicsOfPlayer[name].times}
            </td>);
          })}
        </tr>
      </table>
    </div>
  );
}





