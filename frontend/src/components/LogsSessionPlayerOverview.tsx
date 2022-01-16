import React, {useEffect, useState} from 'react';
import API from '../API';
import isSwap from '../isSwap';
import LogsSessionPlayerRoleOverview from './LogsSessionPlayerRoleOverview';

type IPlayerStats = {
  account: string,
  roles: Array<string>,
  downs: number|string,
  deaths: number|string,
  scoreDps: number|string,
  scoreSupport: number|string,
  swaps: number,
}

type IOLogsSessionPlayerOverviewState = {
  loading: boolean,
  playerStats: {[name: string]: IPlayerStats},
}

export default function LogsSessionPlayerOverview(props: any) {
  const { logs } = props;

  let initialPlayerStats: {[name: string]: IPlayerStats} = {}

  for (const log of logs) {
    for (const player of log.players) {
      if (!player.account.includes('.')) {
        continue;
      }
      if (!initialPlayerStats[player.account]) {
        initialPlayerStats[player.account] = {
          account: player.account,
          roles: [],
          downs: '?',
          deaths: '?',
          scoreDps: '?',
          scoreSupport: '?',
          swaps: 0,
        };
      }
      let stats = initialPlayerStats[player.account];
      if (stats.roles.length > 0 && isSwap(stats.roles[stats.roles.length - 1], player.role)) {
        stats.swaps += 1;
      }
      stats.roles.push(player.role);
    }
  }

  let [appState, setAppState] = useState<IOLogsSessionPlayerOverviewState>({
    loading: false,
    playerStats: initialPlayerStats,
  });

  useEffect(() => {
    appState.loading = true;
    setAppState(appState);
    const load = async () => {
      let allMechanicsProms = logs.map(async (logMeta: any) => {
        const logId = logMeta.log_id;
        const res = await API.fetch(`/api/v0/logs/${logId}`);
        const log = await res.json();
        let nameToAccount: {[name: string]: string} = {};
        for (let player of log.players) {
          nameToAccount[player.name] = player.account;
        }
        let mechanicsByPlayer: {[name: string]: Array<any>} = {};
        for (let mechanic of log.mechanics) {
          for (let occurence of mechanic.mechanicsData) {
            let name = occurence.actor;
            let account = nameToAccount[name];
            if (!account) {
              continue;
            }

            if (!mechanicsByPlayer[account]) {
              mechanicsByPlayer[account] = [];
            }
            mechanicsByPlayer[account].push(Object.assign({name: mechanic.name, account}, occurence));
          }
        }
        return mechanicsByPlayer;
      });
      let allMechanics: Array<{[name: string]: Array<any>}> = await Promise.all(allMechanicsProms);
      for (const playerName in appState.playerStats) {
        appState.playerStats[playerName].deaths = 0;
        appState.playerStats[playerName].downs = 0;
      }
      for (let allMechLog of allMechanics) {
        for (let playerName in allMechLog) {
          for (let occ of allMechLog[playerName]) {
            if (occ.name === 'Dead') {
              let stats = appState.playerStats[playerName]
              stats.deaths = (stats.deaths as number) + 1;
            }
            if (occ.name === 'Downed') {
              let stats = appState.playerStats[playerName]
              stats.downs = (stats.downs as number) + 1;
            }
          }
        }
      }
      setAppState({
        loading: false,
        playerStats: appState.playerStats,
      });
    };
    load();
  }, [setAppState]);

  let playerStatsList = Object.values(appState.playerStats);
  playerStatsList.sort((a, b) =>
    a.account.toLowerCase().localeCompare(b.account.toLowerCase()));

  return (
    <table className="table">
      <thead>
        <th>
          Account
        </th>
        <th>
          Downs
        </th>
        <th>
          Deaths
        </th>
        <th>
          <abbr title="DPS Percentile Score Total">DPS</abbr>
        </th>
        <th>
          <abbr title="Support Percentile Score Total">Support</abbr>
        </th>
        <th>
          Swaps
        </th>
        <th>
          Uniq Roles
        </th>
        <th>
          Roles
        </th>
      </thead>
      {playerStatsList.map((playerStat) => {
        let uniqueRolesMap: {[role: string]: boolean} = {};
        for (let role of playerStat.roles) {
          uniqueRolesMap[role] = true;
        }
        let uniqueRoles = Object.keys(uniqueRolesMap);
        return (<tr>
          <td>{playerStat.account}</td>
          <td>{playerStat.downs}</td>
          <td>{playerStat.deaths}</td>
          <td>{playerStat.scoreDps}</td>
          <td>{playerStat.scoreSupport}</td>
          <td>{playerStat.swaps}</td>
          <td title={uniqueRoles.join(', ')}>{uniqueRoles.length}</td>
          <td><LogsSessionPlayerRoleOverview roles={playerStat.roles} /></td>
        </tr>);
      })}
      <tr>
      </tr>
    </table>
  );
}
