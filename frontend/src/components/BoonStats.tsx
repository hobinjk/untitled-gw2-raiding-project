import React from 'react';
import makePercentile from '../makePercentile';

type IBoonState = {
  name: string,
  value: number,
  percentile: number|null,
};

type IBoonStatsState = {
  [name: string]: IBoonState,
};

export default function BoonStats(props: any) {
  const { stats } = props;

  const state = {
    might: {
      name: 'Might',
      value: stats.buffOutput.might,
      percentile: stats.buffOutput.mightPercentile,
    },
    quickness: {
      name: 'Quickness',
      value: stats.buffOutput.quickness,
      percentile: stats.buffOutput.quicknessPercentile,
    },
    alacrity: {
      name: 'Alacrity',
      value: stats.buffOutput.alacrity,
      percentile: stats.buffOutput.alacrityPercentile,
    },
  };

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
