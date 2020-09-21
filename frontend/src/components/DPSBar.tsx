import React, { useEffect, useState } from 'react';
import './DPSBar.css';
import rarityForPercentile from '../rarityForPercentile';

type IDPSBarState = {
  targetPercentile: number|null,
  allPercentile: number|null,
};

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
      const res = await fetch(`/api/v0/stats/percentiles/dps?${query.toString()}`);
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

