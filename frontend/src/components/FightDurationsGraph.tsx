import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

import API from '../API';
import createGraph from '../createGraph';

async function loadFightDuration(fightName: string) {
  const query = new URLSearchParams();
    query.set('fightName', fightName);
  const res = await API.fetch(`/api/v0/stats/fightDuration?${query.toString()}`);
  return await res.json();
}

async function loadFightNames() {
  const res = await API.fetch(`/api/v0/stats/fightNames`);
  return await res.json();
}

function FightDurationsGraph() {
  const svgRootRef = useRef(null);

  useEffect(() => {
    (async () => {
      const fightNames = await loadFightNames();
      const durByName: {[name: string]: Array<number>} = {};
      for (let fightName of fightNames) {
        durByName[fightName] = await loadFightDuration(fightName);
      }

      const svgRoot = d3.select(svgRootRef.current!);
      createGraph(svgRoot, durByName);
    })();
  }, []);


  return (
    <div className="graph buff-output-graph">
      <svg ref={svgRootRef} />
    </div>
  );
}

export default FightDurationsGraph;
