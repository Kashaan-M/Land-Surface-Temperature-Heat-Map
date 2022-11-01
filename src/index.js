import { select, selectAll } from 'd3-selection';
import { axisBottom, axisLeft } from 'd3-axis';
import { scaleLinear, scaleBand, scaleThreshold } from 'd3-scale';
import { transition } from 'd3-transition';
import { json } from 'd3-fetch';
import { min, max } from 'd3-array';
import { timeFormat } from 'd3-time-format';

import './index.css';

//variables
let w = 1600;
let h = 550;
let url =
  'https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json';
let padding = 30;
let dataset = [];
// colors from colorbrewer2.org/
let legendColors = [
  '#313695',
  '#4575b4',
  '#74add1',
  '#abd9e9',
  '#e0f3f8',
  '#ffffbf',
  '#fee090',
  '#fdae61',
  '#f46d43',
  '#d73027',
  '#a50026',
];

let months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
//fetch data
json(url).then((data) => {
  let baseT = data['baseTemperature'];
  dataset = [...data['monthlyVariance']];

  const xScale = scaleBand()
    .domain(
      dataset.map((obj) => {
        return obj['year'];
      })
    )
    .range([padding, w - padding])
    .padding(0);

  //console.log('xScale', xScale(1753));

  const yScale = scaleBand()
    .domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
    .range([0, h])
    .padding(0);

  // years on x-axis
  const xAxis = axisBottom(xScale)
    .tickValues(
      xScale.domain().filter((year) => {
        // return( and set ticks ) the years which are completely divisible by 10
        return year % 10 === 0;
      })
    )
    .tickFormat((d) => {
      let date = new Date(0);
      date.setFullYear(d);
      let format = timeFormat('%Y');
      return format(date);
    })
    .tickSize(10);

  const yAxis = axisLeft(yScale)
    .tickValues(yScale.domain())
    .tickFormat((d) => {
      //console.log('d is', d);
      let date = new Date(0);
      date.setMonth(d);
      let format = timeFormat('%B');
      //console.log('format is', format(date));
      return format(date);
    })
    .tickSize(10);

  //console.log('yAxis', yAxis.tickFormat(1);
  //tooltip
  const tooltip = select('main').append('div').attr('id', 'tooltip');
  // svg
  const svg = select('main')
    .append('svg')
    .attr('width', w + padding * 2)
    .attr('height', h + padding * 4)
    .style('margin', 'auto');

  // append x-axis to svg
  svg
    .append('g')
    .attr('id', 'x-axis')
    .call(xAxis)
    .style('transform', `translate(45px,${h}px)`);

  // x-axis label
  select('#x-axis')
    .append('g')
    .append('text')
    .text('Years')
    .style('transform', `translate(${w / 2}px,50px)`)
    .attr('fill', 'black')
    .style('font-size', '15px');

  // append y-axis to svg
  svg
    .append('g')
    .attr('id', 'y-axis')
    .call(yAxis)
    .style('transform', `translate(75px,0px)`);

  // y-axis label
  select('#y-axis')
    .append('g')
    .append('text')
    .text('Months')
    .style('transform', `translate(-55px,${h / 2 - 50}px) rotate(-90deg)`)
    .attr('fill', 'black')
    .style('font-size', '15px');

  // legendThreshold - (for calculating fill for <rect> elements with class of "cell")
  const variances = dataset.map((d) => d['variance']);
  let minT = baseT + Math.min(...variances); // 1
  let maxT = baseT + Math.max(...variances); // 13
  //console.log('minT = ', minT, 'maxT = ', maxT, 'step = ', step);
  const legendThreshold = scaleThreshold()
    .domain(
      ((min, max, count) => {
        let array = [];
        let step = (max - min) / count;
        let base = min;
        for (let i = 1; i < count; i++) {
          array.push(base + i * step);
        }
        //console.log('array ', array);
        return array;
      })(minT, maxT, legendColors.length)
    )
    .range(legendColors);
  //map

  const cell = svg
    .selectAll('rect')
    .data(dataset)
    .enter()
    .append('rect')
    .attr('class', 'cell')
    .attr('width', (d) => xScale.bandwidth(d['year']))
    .attr('height', (d) => yScale.bandwidth(d['month']))
    .attr('x', (d) => xScale(d['year']))
    .attr('y', (d) => yScale(d['month'] - 1))
    .attr('data-month', (d) => d['month'] - 1)
    .attr('data-year', (d) => d['year'])
    .attr('data-temp', (d) => baseT + d['variance'])
    .style('transform', 'translate(45px,0px)')
    //relativeY += cellHeight;
    .attr('fill', (d) => {
      return legendThreshold(baseT + d['variance']);
    })
    .on('mouseover', (e, d) => {
      //console.log('e', e, 'd', d);
      select(e.target).attr('stroke', 'black').attr('stroke-width', 3);
      let { pageX, pageY } = e;
      let { year, month, variance } = d;
      //console.log('month is ', month);

      let temperature = parseFloat((baseT + variance).toFixed(1));
      //console.log('temp', temperature);
      variance = parseFloat(variance.toFixed(1));
      //console.log(variance);
      if (variance > 0) {
        variance = `+${variance}`;
      }
      tooltip.attr('data-year', year);
      tooltip.style('display', 'block');
      tooltip.style('left', `${pageX - 45}px`);
      tooltip.style('top', `${pageY - 100}px`);
      tooltip.html(
        `<p>${year} - ${
          months[month - 1]
        }</p><p>Temperature ${temperature}&#8451;</p><p>variance ${variance}&#8451;</p>`
      );
    })
    .on('mouseout', (e, d) => {
      select(e.target).attr('stroke', 'none');
      tooltip.style('display', 'none');
    });

  //legend
  let legendWidth = 400;
  let legendHeight = 300 / legendColors.length;

  let legendScale = scaleLinear().domain([minT, maxT]).range([0, legendWidth]);

  let legendXAxis = axisBottom(legendScale)
    .tickValues(legendThreshold.domain())
    .tickSize(10);

  const legend = svg
    .append('g')
    .attr('id', 'legend')
    .style('transform', `translate(100px,${h + 50}px)`);

  legend
    .append('g')
    .selectAll('rect')
    .data(legendThreshold.domain())
    .enter()
    .append('rect')
    .attr('fill', (d) => legendThreshold(d))
    .attr('x', (d) => legendScale(d))
    .attr('y', 0)
    .attr('width', (d) => legendWidth / legendColors.length)
    .attr('height', legendHeight);

  legend
    .append('g')
    .call(legendXAxis)
    .style('transform', `translate(0,${legendHeight}px)`);
  // legend label
  legend
    .append('g')
    .append('text')
    .text('Base Temperature + variance')
    .style(
      'transform',
      `translate(${legendWidth / 4}px,${legendHeight + 35}px)`
    )
    .style('font-size', '14px');
});
