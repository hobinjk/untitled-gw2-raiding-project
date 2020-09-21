import React from 'react';
import {quickness, alacrity, might} from '../squadBuffGeneration';

export default function BoonStats(props: any) {
  const { player } = props;

  const stats: {[name:string]: number} = {
    Might: might(player),
    Quickness: quickness(player),
    Alacrity: alacrity(player),
  };

  return (
    <div>
      <table className="table">
        <tr>
          {Object.keys(stats).map((name) => {
            return (<td><abbr title={name}>
              {name.charAt(0)}
            </abbr></td>);
          })}
        </tr>
        <tr>
          {Object.keys(stats).map((name) => {
            return (<td style={{width: '63px'}}>
              {stats[name]}
            </td>);
          })}
        </tr>
      </table>

    </div>
  );
}




