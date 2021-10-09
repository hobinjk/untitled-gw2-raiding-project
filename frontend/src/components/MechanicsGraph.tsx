import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

import './MechanicsGraph.css';

import API from '../API';
import createGraph from '../createGraph';

async function loadMechanic(fightName: string, name: string) {
  const query = new URLSearchParams();
  if (fightName) {
    query.set('fightName', fightName);
  }
  query.set('name', name);
  const res = await API.fetch(`/api/v0/stats/mechanic-times?${query.toString()}`);
  return await res.json();
}

async function loadMechanics(fightName: string) {
  const query = new URLSearchParams();
  query.set('fightName', fightName);
  const res = await API.fetch(`/api/v0/stats/mechanics?${query.toString()}`);
  return await res.json();
}

function MechanicsGraph(props: any) {
  const {fightName} = props;
  const svgRootRef = useRef(null);

  useEffect(() => {
    (async () => {
      const mechanics = await loadMechanics(fightName);
      const timesByMechanic: {[name: string]: Array<number>} = {};
      for (let name of mechanics) {
        timesByMechanic[name] = await loadMechanic(fightName, name);
      }

      const svgRoot = d3.select(svgRootRef.current!);
      createGraph(svgRoot, timesByMechanic);
    })();
  }, []);


  return (
    <div className="graph mechanics-graph">
      <svg ref={svgRootRef} />
    </div>
  );
}

export default MechanicsGraph;
