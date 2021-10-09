import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

import './TargetDpsGraph.css';

import API from '../API';
import createGraph from '../createGraph';

async function loadTargetDps(fightName: string, role: string) {
  const query = new URLSearchParams();
  if (fightName) {
    query.set('fightName', fightName);
  }
  query.set('role', role);
  const res = await API.fetch(`/api/v0/stats/targetDps?${query.toString()}`);
  return await res.json();
}

async function loadRoles(fightName: string) {
  const query = new URLSearchParams();
  query.set('fightName', fightName);
  const res = await API.fetch(`/api/v0/stats/roles?${query.toString()}`);
  return await res.json();
}

function TargetDpsGraph(props: any) {
  const {fightName} = props;
  const svgRootRef = useRef(null);

  useEffect(() => {
    (async () => {
      const roles = await loadRoles(fightName);
      const dpsByRole: {[role: string]: Array<number>} = {};
      for (let role of roles) {
        dpsByRole[role] = await loadTargetDps(fightName, role);
      }

      const svgRoot = d3.select(svgRootRef.current!);
      createGraph(svgRoot, dpsByRole);
    })();
  }, []);


  return (
    <div className="graph target-dps-graph">
      <svg ref={svgRootRef} />
    </div>
  );
}

export default TargetDpsGraph;
