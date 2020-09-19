import React, { useEffect, useState } from 'react';
import './DPSBar.css';

type IDPSBarState = {
  targetPercentile: number|null,
  allPercentile: number|null,
};

function rarityForPercentile(percentile: number) {
  if (percentile > 99) {
    return 'legendary';
  } else if (percentile > 95) {
    return 'ascended';
  } else if (percentile > 90) {
    return 'exotic';
  } else if (percentile > 80) {
    return 'rare';
  } else if (percentile > 70) {
    return 'masterwork';
  } else if (percentile > 60) {
    return 'fine';
  } else if (percentile > 50) {
    return 'basic';
  }
  return 'junk';
}

export default function DPSBar(props: any) {
  const { player, log, stats } = props;
  console.log(player, log);

  const [appState, setAppState] = useState<IDPSBarState>({
    targetPercentile: null,
    allPercentile: null,
  });

  useEffect(() => {
    const load = async () => {
      const query = new URLSearchParams();
      query.set('fightName', log.fightName);
      query.set('role', player.role);
      query.set('targetDps', stats.target_dps);
      query.set('allDps', stats.all_dps);
      const res = await fetch(`/api/v0/stats/percentiles?${query.toString()}`);
      const {targetPercentile, allPercentile} = await res.json();

      setAppState({
        targetPercentile,
        allPercentile
      });
    };
    load();
  }, [setAppState]);

  if (typeof appState.targetPercentile !== 'number' || typeof appState.allPercentile !== 'number') {
    return (
      <div>
        {stats.target_dps} | {stats.all_dps}
      </div>
    );
  }

  const targetRarity = rarityForPercentile(appState.targetPercentile);
  const allRarity = rarityForPercentile(appState.allPercentile);

  if (log.fightName.startsWith('Twin Largos') || log.fightName.includes('Kitty Golem')) {
    return (
      <div>
        <span className={`rarity-${allRarity}`}>{stats.all_dps} | {Math.round(appState.allPercentile)}</span>
      </div>
    );
  }

  return (
    <div>
      <span className={`rarity-${targetRarity}`}>{stats.target_dps} | {Math.round(appState.targetPercentile)}</span>
      <br/>
      <span className={`rarity-${allRarity}`}>{stats.all_dps} | {Math.round(appState.allPercentile)}</span>
    </div>
  );
}

