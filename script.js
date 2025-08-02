const svgWidth = 800, svgHeight = 500;
const margin = { top: 50, right: 50, bottom: 70, left: 65 };
const width = svgWidth - margin.left - margin.right;
const height = svgHeight - margin.top - margin.bottom;

const svg = d3.select('#chart')
  .append('svg')
  .attr('width', svgWidth)
  .attr('height', svgHeight)
  .append('g')
  .attr('transform', `translate(${margin.left},${margin.top})`);


const annotationSvg = d3.select('#annotation')
  .append('svg')
  .attr('width', svgWidth)
  .attr('height', 140);
const annotationGroup = annotationSvg
  .append('g')
  .attr('transform', `translate(0, 10)`);

const tooltip = d3.select('#tooltip');

d3.csv('cars2017.csv')
  .then(rawData => {
    const data = rawData.map(d => ({
      make: d.Make,
      fuel: d.Fuel,
      cylinders: +d.EngineCylinders,
      highway: +d.AverageHighwayMPG,
      city: +d.AverageCityMPG
    }));

    const xScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.cylinders))
      .range([0, width]);
    const yScale = d3.scaleLinear()
      .domain(d3.extent(data, d => d.highway))
      .range([height, 0]);

    svg.append('g').attr('class', 'x-axis').attr('transform', `translate(0,${height})`);
    svg.append('g').attr('class', 'y-axis');

    svg.append('text')
      .attr('class', 'x-title')
      .attr('x', width / 2)
      .attr('y', height + (margin.bottom - 10))
      .attr('text-anchor', 'middle')
      .text('Engine Cylinders (count)');

    svg.append('text')
      .attr('class', 'y-title')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -(margin.left - 15))
      .attr('text-anchor', 'middle')
      .text('Highway MPG (mpg)');

    const legendGroup = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - 180}, 0)`);

    let currentScene = 0;
    const scenes = [scene1, scene2, scene3];

    updateScene();

    d3.select('#next').on('click', () => {
      if (currentScene < scenes.length - 1) {
        currentScene++;
        updateScene();
      }
    });
    d3.select('#prev').on('click', () => {
      if (currentScene > 0) {
        currentScene--;
        updateScene();
      }
    });

    function updateScene() {
      d3.select('#prev').property('disabled', currentScene === 0);
      d3.select('#next').property('disabled', currentScene === scenes.length - 1);

      svg.selectAll('circle').remove();
      annotationGroup.selectAll('*').remove();
      tooltip.classed('hidden', true);

      svg.select('.x-axis').call(d3.axisBottom(xScale).ticks(6).tickFormat(d3.format('d')));
      svg.select('.y-axis').call(d3.axisLeft(yScale).ticks(6));

      legendGroup.selectAll('*').remove();
      renderLegendForScene(currentScene);

      scenes[currentScene]();
    }

    function drawLegend(items) {
      const row = legendGroup.selectAll('g.legend-row')
        .data(items)
        .enter()
        .append('g')
        .attr('class', 'legend-row')
        .attr('transform', (d, i) => `translate(0, ${i * 20})`);

      row.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('rx', 2)
        .attr('ry', 2)
        .attr('fill', d => d.color);

      row.append('text')
        .attr('x', 18)
        .attr('y', 10)
        .attr('dominant-baseline', 'middle')
        .text(d => d.label);
    }

    function renderLegendForScene(sceneIndex) {
      if (sceneIndex === 0) {
        drawLegend([{ label: 'All vehicles', color: 'grey' }]);
      } else if (sceneIndex === 1) {
        drawLegend([
          { label: 'Highway MPG > 30', color: 'steelblue' },
          { label: '≤ 30', color: 'lightgrey' }
        ]);
      } else if (sceneIndex === 2) {
        const fuelTypes = Array.from(new Set(data.map(d => d.fuel)));
        const palette = ['#1f77b4', '#ff7f0e', '#2ca02c'];
        const items = fuelTypes.map((ft, i) => ({ label: ft, color: palette[i % palette.length] }));
        drawLegend(items);
      }
    }

    // Scene 1: Base trend (cylinders vs highway MPG)
    function scene1() {
      svg.selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', d => xScale(d.cylinders))
        .attr('cy', d => yScale(d.highway))
        .attr('r', 5)
        .attr('fill', 'grey')
        .on('mouseover', showTooltip)
        .on('mousemove', moveTooltip)
        .on('mouseout', hideTooltip);

      const annotations = [{
        note: {
          label: 'Fewer cylinders generally yield higher highway MPG',
          align: 'middle',
          orientation: 'bottom',
          wrap: svgWidth - 100
        },
        x: svgWidth / 2,
        y: 0,
        dx: 0,
        dy: 0
      }];
      const makeAnn1 = d3.annotation()
        .type(d3.annotationLabel)
        .notePadding(8)
        .textWrap(svgWidth - 100)
        .annotations(annotations);
      annotationGroup.call(makeAnn1);
      annotationGroup.selectAll('.annotation-connector, .annotation-subject').attr('display', 'none');
      annotationGroup.selectAll('.annotation-note-label, .annotation-note-title').attr('text-anchor', 'middle');
    }

    // Scene 2: Highlight high efficiency (MPG > 30)
    function scene2() {
      svg.selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', d => xScale(d.cylinders))
        .attr('cy', d => yScale(d.highway))
        .attr('r', 5)
        .attr('fill', d => d.highway > 30 ? 'steelblue' : 'lightgrey')
        .on('mouseover', showTooltip)
        .on('mousemove', moveTooltip)
        .on('mouseout', hideTooltip);

      const annotations = [{
        note: {
          label: 'High-efficiency cars (Highway MPG > 30)',
          align: 'middle',
          orientation: 'bottom',
          wrap: svgWidth - 100
        },
        x: svgWidth / 2,
        y: 0,
        dx: 0,
        dy: 0
      }];
      const makeAnn2 = d3.annotation()
        .type(d3.annotationLabel)
        .notePadding(8)
        .textWrap(svgWidth - 100)
        .annotations(annotations);
      annotationGroup.call(makeAnn2);
      annotationGroup.selectAll('.annotation-connector, .annotation-subject').attr('display', 'none');
      annotationGroup.selectAll('.annotation-note-label, .annotation-note-title').attr('text-anchor', 'middle');
    }

    // Scene 3: Color by fuel type
    function scene3() {
      const color = d3.scaleOrdinal()
        .domain([...new Set(data.map(d => d.fuel))])
        .range(['#1f77b4','#ff7f0e','#2ca02c']);

      svg.selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', d => xScale(d.cylinders))
        .attr('cy', d => yScale(d.highway))
        .attr('r', 5)
        .attr('fill', d => color(d.fuel))
        .on('mouseover', showTooltip)
        .on('mousemove', moveTooltip)
        .on('mouseout', hideTooltip);

      const annotations = [{
        note: {
          label: 'Points colored by fuel type (Gasoline, Diesel, Electricity)',
          align: 'middle',
          orientation: 'bottom',
          wrap: svgWidth - 100
        },
        x: svgWidth / 2,
        y: 0,
        dx: 0,
        dy: 0
      }];
      const makeAnn3 = d3.annotation()
        .type(d3.annotationLabel)
        .notePadding(8)
        .textWrap(svgWidth - 100)
        .annotations(annotations);
      annotationGroup.call(makeAnn3);
      annotationGroup.selectAll('.annotation-connector, .annotation-subject').attr('display', 'none');
      annotationGroup.selectAll('.annotation-note-label, .annotation-note-title').attr('text-anchor', 'middle');
    }

    function showTooltip(event, d) {
      tooltip
        .classed('hidden', false)
        .html(
          `MAKE: <strong>${d.make}</strong><br/>` +
          `Fuel: ${d.fuel}<br/>` +
          `Cylinders: ${d.cylinders}<br/>` +
          `Highway MPG: ${d.highway}<br/>` +
          `City MPG: ${d.city}`
        );
    }
    function moveTooltip(event) {
      tooltip
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY + 10) + 'px');
    }
    function hideTooltip() {
      tooltip.classed('hidden', true);
    }
  });