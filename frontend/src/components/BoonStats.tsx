import React, { useEffect, useState } from 'react';
import {quickness, alacrity, might} from '../squadBuffGeneration';
import rarityForPercentile from '../rarityForPercentile';

type IBoonState = {
  name: string,
  value: number,
  percentile: number|null,
};

type IBoonStatsState = {
  [name: string]: IBoonState,
};

function makePercentile(value: number, percentile: number|null) {
  console.log('makePercentile', value, percentile);
  if (typeof percentile  === 'number') {
    const rarity = rarityForPercentile(percentile);
    return (<span className={`rarity-${rarity}`} title={Math.round(percentile).toString()}>
      {Math.round(value).toString()}
    </span>);
  } else {
    return (<span className="rarity-junk">
      {Math.round(value).toString()}
    </span>);
  }
}

export default function BoonStats(props: any) {
  const { player, log } = props;

  const [mightState, setMightState] = useState<IBoonState>({
    name: 'Might',
    value: might(player),
    percentile: null,
  });
  const [quicknessState, setQuicknessState] = useState<IBoonState>({
    name: 'Quickness',
    value: quickness(player),
    percentile: null,
  });
  const [alacrityState, setAlacrityState] = useState<IBoonState>({
    name: 'Alacrity',
    value: alacrity(player),
    percentile: null,
  });

  const states = [
    {state: mightState, setter: setMightState},
    {state: quicknessState, setter: setQuicknessState},
    {state: alacrityState, setter: setAlacrityState},
  ];

  const loadPercentile = async (name: string, output: number) => {
    if (output < 10) {
      return null;
    }

    const query = new URLSearchParams();
    query.set('fightName', log.fightName);
    query.set('role', player.role);
    query.set('output', output.toString());
    query.set('buff', name.toLowerCase());

    const res = await fetch(`/api/v0/stats/percentiles/buffOutput?${query.toString()}`);
    const percentile: number = (await res.json()).outputPercentile;
    return percentile;
  };

  useEffect(() => {
    for (let state of states) {
      (async () => {
        const percentile = await loadPercentile(state.state.name, state.state.value);
        state.setter({
          name: state.state.name,
          value: state.state.value,
          percentile,
        });
      })();
    }
  }, states.map(state => state.setter).concat([log.fightName, player.role]));

  return (
    <div>
      <table className="table">
        <tr>
          {states.map((state) => {
            return (<td><abbr title={state.state.name}>
              {state.state.name.charAt(0)}
            </abbr></td>);
          })}
        </tr>
        <tr>
          {states.map((state) => {
            return (<td>
              {makePercentile(state.state.value, state.state.percentile)}
            </td>);
          })}
        </tr>
      </table>

    </div>
  );
}




