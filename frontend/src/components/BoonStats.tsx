import React, { useEffect, useState } from 'react';
import {quickness, alacrity, might} from '../squadBuffGeneration';
import makePercentile from '../makePercentile';
import API from '../API';

type IBoonState = {
  name: string,
  value: number,
  percentile: number|null,
};

type IBoonStatsState = {
  [name: string]: IBoonState,
};

export default function BoonStats(props: any) {
  const { player, log } = props;

  const [state, setState] = useState<IBoonStatsState>({
    might: {
      name: 'Might',
      value: might(player),
      percentile: null,
    },
    quickness: {
      name: 'Quickness',
      value: quickness(player),
      percentile: null,
    },
    alacrity: {
      name: 'Alacrity',
      value: alacrity(player),
      percentile: null,
    },
  });

  const loadPercentile = async (name: string, output: number) => {
    if (output < 10) {
      return null;
    }

    const query = new URLSearchParams();
    query.set('fightName', log.fightName);
    query.set('role', player.role);
    query.set('output', output.toString());
    query.set('buff', name.toLowerCase());

    const res = await API.fetch(`/api/v0/stats/percentiles/buffOutput?${query.toString()}`);
    const percentile: number = (await res.json()).outputPercentile;
    return percentile;
  };

  useEffect(() => {
    for (let key in state) {
      (async () => {
        const percentile = await loadPercentile(state[key].name, state[key].value);
        setState((prevState) => {
          return {
            ...prevState,
            [key]: {
              name: prevState[key].name,
              value: prevState[key].value,
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
          {Object.values(state).map((state) => {
            return (<td><abbr title={state.name}>
              {state.name.charAt(0)}
            </abbr></td>);
          })}
        </tr>
        <tr>
          {Object.values(state).map((state) => {
            return (<td>
              {makePercentile(state.value, state.percentile)}
            </td>);
          })}
        </tr>
      </table>
    </div>
  );
}
