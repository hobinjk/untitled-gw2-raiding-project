import React, { useEffect, useState } from 'react';
import makePercentile from '../makePercentile';
import API from '../API';

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
  const { player, log } = props;

  const [mechanicStatsState, setState] = useState<IMechanicStatsState>((() => {
    const mechanicStatsState: IMechanicStatsState = {};

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
      mechanicStatsState[mechanic.name] = {
        name: mechanic.description,
        value: times,
        percentile: null,
      };
    }

    return mechanicStatsState;
  })());

  const loadPercentile = async (name: string, value: number) => {
    const query = new URLSearchParams();
    query.set('fightName', log.fightName);
    query.set('mechanicName', name);
    query.set('occurrences', value.toString());

    const res = await API.fetch(`/api/v0/stats/percentiles/mechanic?${query.toString()}`);
    const percentile: number = (await res.json()).occurrencesPercentile;
    return percentile;
  };

  useEffect(() => {
    for (const name in mechanicStatsState) {
      (async () => {
        const stat = mechanicStatsState[name];
        const percentile = await loadPercentile(name, stat.value);
        setState((prevState) => {
          return {
            ...prevState,
            [name]: {
              name: prevState[name].name,
              value: prevState[name].value,
              percentile,
            },
          };
        });
      })();
    }
  }, []);


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
