import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

import API from '../API';
import createGraph from '../createGraph';

const buffIds: {[buffName: string]: number} = {
  quickness: 1187,
  alacrity: 30328,
  might: 740,
};

async function loadBuffOutput(fightName: string, role: string, buffId: number) {
  const query = new URLSearchParams();
  if (fightName) {
    query.set('fightName', fightName);
  }
  query.set('role', role);
  query.set('buffId', buffId.toString());
  const res = await API.fetch(`/api/v0/stats/buffOutput?${query.toString()}`);
  return await res.json();
}

async function loadRoles(fightName: string, buffId: number) {
  const query = new URLSearchParams();
  query.set('fightName', fightName);
  query.set('buffId', buffId.toString());
  const res = await API.fetch(`/api/v0/stats/buffOutputRoles?${query.toString()}`);
  return await res.json();
}


function BuffOutputGraph(props: any) {
  const {fightName, buffName} = props;
  const buffId: number = buffIds[buffName];
  const svgRootRef = useRef(null);

  useEffect(() => {
    (async () => {
      const roles = await loadRoles(fightName, buffId);
      const outputByRole: {[role: string]: Array<number>} = {};
      for (let role of roles) {
        outputByRole[role] = await loadBuffOutput(fightName, role, buffId);
      }

      const svgRoot = d3.select(svgRootRef.current!);
      createGraph(svgRoot, outputByRole);
    })();
  }, []);


  return (
    <div className="graph buff-output-graph">
      <svg ref={svgRootRef} />
    </div>
  );
}

export default BuffOutputGraph;
