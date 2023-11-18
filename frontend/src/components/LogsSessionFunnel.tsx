import { useRef, useEffect } from 'react';
import type {ILogStats} from './LogsSession';
import createBarChar from '../createBarChart';
import './LogsSessionFunnel.css';

import * as d3 from 'd3';

export default function LogsSessionFunnel(props: any) {
  const logStats: Array<ILogStats> = props.logStats;
  const svgRootRef = useRef(null);
  const svgRootDursRef = useRef(null);

  useEffect(() => {
    const svgRoot = d3.select(svgRootRef.current!);
    const svgRootDurs = d3.select(svgRootDursRef.current!);
    if (Object.keys(phases).length === 0) {
      return;
    }
    createBarChar(svgRoot, phases);
    createBarChar(svgRootDurs, phaseDurs);
  }, [logStats]);

  let phases: {[name: string]: number} = {};
  let phaseDurs: {[name: string]: number} = {};
  for (const stats of logStats) {
    let log = stats.log;
    if (!log || !log.phases) {
      continue;
    }
    for (let phase of log.phases) {
      if (phase.breakbarPhase || phase.subPhases) {
        continue;
      }
      if (!phases[phase.name]) {
        phases[phase.name] = 0;
        phaseDurs[phase.name] = 0;
      }
      phases[phase.name] += 1;
      phaseDurs[phase.name] += (phase.end - phase.start) / 1000;
    }
  }

  return (
    <div>
      <div className="graph-container">
        <h2 className="subtitle">Pull Count</h2>
        <svg ref={svgRootRef} />
      </div>
      <div className="graph-container">
        <h2 className="subtitle">Phase Duration</h2>
        <svg ref={svgRootDursRef} />
      </div>
    </div>
  );
}

