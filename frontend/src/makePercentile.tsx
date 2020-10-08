import React from 'react';
import rarityForPercentile from './rarityForPercentile';

export default function makePercentile(value: number|string, percentile: number|null, useTitle: boolean = false) {
  if (typeof value === 'number') {
    value = Math.round(value).toString();
  }
  if (typeof percentile  === 'number') {
    const rarity = rarityForPercentile(percentile);
    if (useTitle) {
      return (<span className={`rarity-${rarity}`} title={Math.round(percentile).toString()}>
        {value}
      </span>);
    } else {
      return (<span className={`rarity-${rarity}`}>
        {value}
      </span>);
    }
  } else {
    return (<span className="rarity-junk">
      {value}
    </span>);
  }
}
