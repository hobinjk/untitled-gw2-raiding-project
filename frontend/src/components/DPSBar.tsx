import React from 'react';
import './DPSBar.css';
import rarityForPercentile from '../rarityForPercentile';

type IDPSBarState = {
  targetPercentile: number|null,
  allPercentile: number|null,
};

export default function DPSBar(props: any) {
  const { log, stats } = props;

  const appState = {
    targetPercentile: stats.dps.targetDpsPercentile,
    allPercentile: stats.dps.allDpsPercentile,
  };

  if (typeof appState.targetPercentile !== 'number' || typeof appState.allPercentile !== 'number') {
    return (
      <div>
        {stats.dps.targetDps} | {stats.dps.allDps}
      </div>
    );
  }

  const targetRarity = rarityForPercentile(appState.targetPercentile);
  const allRarity = rarityForPercentile(appState.allPercentile);

  if (log.fightName.startsWith('Twin Largos') || log.fightName.includes('Kitty Golem')) {
    return (
      <div>
        <span className={`rarity-${allRarity}`}>{stats.dps.allDps} | {Math.round(appState.allPercentile)}</span>
      </div>
    );
  }

  return (
    <div>
      <span className={`rarity-${targetRarity}`}>{stats.dps.targetDps} | {Math.round(appState.targetPercentile)}</span>
      <br/>
      <span className={`rarity-${allRarity}`}>{stats.dps.allDps} | {Math.round(appState.allPercentile)}</span>
    </div>
  );
}

