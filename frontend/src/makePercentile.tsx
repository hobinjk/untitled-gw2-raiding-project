import React from 'react';
import rarityForPercentile from './rarityForPercentile';

export default function makePercentile(value: number, percentile: number|null) {
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
