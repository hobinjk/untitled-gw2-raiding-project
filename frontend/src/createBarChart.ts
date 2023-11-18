import * as d3 from 'd3';

export default function createBarChar(svgRoot: any, counts: {[name: string]: number}) {
  const margin = {top: 20, right: 80, bottom: 80, left: 40};
  const width = 40 * Object.keys(counts).length;
  const height = 200;

  const svg = svgRoot
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
      .attr('transform',
            'translate(' + margin.left + ',' + margin.top + ')');

  const data = Object.entries(counts);

  let yMax = data.reduce((a, d) => Math.max(a, d[1]), 0);

  const x = d3.scaleBand()
    .range([0, width])
    .domain(data.map(function(d: any) { return d[0]; }))
    .padding(0.2);

  svg.append('g')
    .attr('transform', 'translate(0,' + height + ')')
    .call(d3.axisBottom(x))
    .selectAll('text')
      .attr('transform', 'translate(-10, 0) rotate(-45)')
      .style('text-anchor', 'end');

  // Add Y axis
  var y = d3.scaleLinear()
    .domain([0, Math.ceil(yMax / 10) * 10])
    .range([ height, 0]);
  svg.append('g')
    .call(d3.axisLeft(y));

  // Bars
  svg.selectAll('mybar')
    .data(data)
    .enter()
    .append('rect')
      .attr('x', function(d: any) { return x(d[0]); })
      .attr('y', function(d: any) { return y(d[1]); })
      .attr('width', x.bandwidth())
      .attr('height', function(d: any) { return height - y(d[1]); })
      .attr('fill', '#69b3a2')
      .append('title')
        .text(function(d: any) { return d[1].toString(); });
}
