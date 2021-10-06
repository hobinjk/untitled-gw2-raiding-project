import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

import API from '../API';

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

function createGraph(svgRoot: any, outputByRole: {[role: string]: Array<number>}) {
  const width = 30 * Object.keys(outputByRole).length;
  const height = 400;
  const margin = {top: 20, right: 20, bottom: 80, left: 40};

  svgRoot
    .attr('width', width)
    .attr('height', height);

  const labels = Object.keys(outputByRole).map(role => {
    return role
      .replace(/Condition/, 'C')
      .replace(/Boon/, 'B')
      .replace(/Heal/, 'H')
      .replace(/Tank/, 'T')
      .replace(/Power/, 'P');
  });
  const bins: Array<Array<number>> = Object.values(outputByRole);
  bins.forEach((bin: any, i) => {
    bin.label = labels[i];
    bin.sort((a: number, b: number) => a - b);
    const min = bin[0];
    const max = bin[bin.length - 1];
    bin.min = min;
    bin.max = max;
  });
  bins.sort((binA: any, binB: any) => binB.max - binA.max);
  const n = labels.length;
  bins.forEach((bin: any, i) => {
    bin.x0 = i;
    bin.x1 = i + 1;
    bin.xm = i + 0.5;
    const q1 = d3.quantile(bin, 0.25)!;
    const q2 = d3.quantile(bin, 0.5);
    const q3 = d3.quantile(bin, 0.75)!;
    const iqr = q3 - q1;
    const r0 = Math.max(bin.min, q1 - iqr * 1.5);
    const r1 = Math.min(bin.max, q3 + iqr * 1.5);
    bin.quartiles = [q1, q2, q3];
    bin.range = [r0, r1];
    bin.outliers = bin.filter((v: number) => v < r0 || v > r1);
    bin.outliers = bin.outliers.map((v: number) => {
      return {
        x0: bin.x0,
        x1: bin.x1,
        y: v,
      };
    });
  });
  let x = d3.scaleLinear()
    .domain([d3.min(bins, (d: any) => d.x0), d3.max(bins, (d: any) => d.x1)])
    .rangeRound([margin.left, width - margin.right]);
  let y = d3.scaleLinear()
    .domain([d3.min(bins, (d: any) => d.range[0]), d3.max(bins, (d: any) => d.range[1])]).nice()
    .range([height - margin.bottom, margin.top])
  let xAxis = (g: any) => g
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x)
      .tickValues(d3.range(0.5, n, 1))
      .tickSizeOuter(0)
      .tickFormat((i: any) => (bins[Math.floor(i)] as any).label));
  let yAxis = (g: any) => g
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(null, "s"))
    .call((g: any) => g.select(".domain").remove());
  const g = svgRoot.append("g")
    .selectAll("g")
    .data(bins)
    .join("g");

  g.append("path")
      .attr("stroke", "currentColor")
      .attr("d", (d: any) => `
        M${x((d.x0 + d.x1) / 2)},${y(d.range[1])}
        V${y(d.range[0])}
      `);

  g.append("path")
      .attr("fill", "#ddd")
      .attr("d", (d: any) => `
        M${x(d.x0) + 1},${y(d.quartiles[2])}
        H${x(d.x1)}
        V${y(d.quartiles[0])}
        H${x(d.x0) + 1}
        Z
      `);

  g.append("path")
      .attr("stroke", "currentColor")
      .attr("stroke-width", 2)
      .attr("d", (d: any) => `
        M${x(d.x0) + 1},${y(d.quartiles[1])}
        H${x(d.x1)}
      `);

  g.append("g")
      .attr("fill", "currentColor")
      .attr("fill-opacity", 0.2)
      .attr("stroke", "none")
      .attr("transform", (d: any) => `translate(${x((d.x0 + d.x1) / 2)},0)`)
    .selectAll("circle")
    .data((d: any) => d.outliers)
    .join("circle")
      .attr("r", 2)
      .attr("cx", () => (Math.random() - 0.5) * 4)
      .attr("cy", (d: any) => y(d.y));

  svgRoot.append("g")
      .call(xAxis)
      .selectAll("text")
        .style("text-anchor", "start")
        .attr("dx", ".8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(45)");

  svgRoot.append("g")
      .call(yAxis);
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
