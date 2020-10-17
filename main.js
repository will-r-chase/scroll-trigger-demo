gsap.registerPlugin(ScrollTrigger);
const purple = '#854794';
const blue = '#00A8DE';
const green = '#54AE37';
const yellow = '#FFDB00';
const orange = '#F5A336';
const red = '#E84750';
const rainbow = [red, orange, yellow, green, blue, purple];

//////////////////////////////////////////////////
// This is all just for the menu, nothing to do //
// with scrolling or animations                 //
//////////////////////////////////////////////////
const pinCheck = document.querySelector('#pin');
const toggleCheck = document.querySelector('#toggle');
const box1Check = document.querySelector('#box1');
const box2Check = document.querySelector('#box2');
const box3Check = document.querySelector('#box3');
const scrubCheck = document.querySelector('#scrub');
const pinLabel = document.querySelector('#pin-label');
const toggleLabel = document.querySelector('#toggle-label');
const box1Label = document.querySelector('#box1-label');
const box2Label = document.querySelector('#box2-label');
const box3Label = document.querySelector('#box3-label');
const scrubLabel = document.querySelector('#scrub-label');
const checkLabels = document.querySelectorAll('.check-label');
let menuCollapsed = true;
const menuTitle = document.querySelector('.collapse');
const menu = document.querySelector('.checkbox-group');
menuTitle.addEventListener('click', e => {
  if (menuCollapsed) {
    menu.style.height = '400px';
    menuCollapsed = false;
  } else {
    menu.style.height = '0px';
    menuCollapsed = true;
  }
});
function contains(selector, text) {
  var elements = document.querySelectorAll(selector);
  return Array.prototype.filter.call(elements, function(element) {
    return RegExp(text).test(element.textContent);
  });
}
//////////////////////////////////////////////////
//////////////////////////////////////////////////

//loads and then cleans some data I used previously in a different project
//basically just a set of points with some positions
d3.json(
  'https://gist.githubusercontent.com/will-r-chase/375d6366e6c32caf3862d1f6154f87a0/raw/f632753fc5940ac57e55276f38bca2262cb87907/landers_before2.geojson'
)
  .then(d => clean(d))
  .then(data => {
    const svgWidth = 700;
    const svgHeight = 500;
    const circleRad = 10;

    //set up a scale for when the points become a timeline
    const timeScaleTriggered = d3
      .scaleTime()
      .domain(d3.extent(data.features, d => d.properties.day))
      .range([circleRad, svgWidth - circleRad]);

    //set up SVG to fill wrapper
    const svg = d3
      .select('svg')
      .attr('preserveAspectRatio', 'xMinYMin meet')
      .attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`);

    const g = svg.append('g');

    //create some circles from our data with a random position and color
    //initially they have radius of 0 so they're not visible right away
    let circles = g
      .selectAll('circle')
      .data(data.features)
      .join('circle')
      .attr('class', 'points')
      .attr('r', 0)
      .attr('cx', () => Math.random() * svgWidth)
      .attr('cy', () => Math.random() * svgHeight)
      .style('fill', () => rainbow[Math.floor(Math.random() * rainbow.length)])
      .style('opacity', 0.7);

    //sets up the class toggle on each scrolling text box
    //so that it becomes opaque when in view and transparent when exiting
    gsap.utils.toArray('.step').forEach(step => {
      ScrollTrigger.create({
        trigger: step,
        start: 'top 80%',
        end: 'center top',
        toggleClass: 'active',
        markers: true,
        id: 'toggle-active-class'
      });
    });

    //The initial animation to show the points
    //sets the point radius to a random value from 0 to 20
    gsap.to('.points', {
      scrollTrigger: {
        trigger: '#step-1',
        start: 'top center',
        toggleActions: 'play none none reverse',
        markers: true,
        id: 'first-box'
      },
      attr: {r: () => Math.random() * 20},
      duration: 0.5,
      ease: 'power3.out'
    });

    //the animation triggered by the second text box
    //shuffles the X position of the points to a random value
    gsap.to('.points', {
      scrollTrigger: {
        trigger: '#step-2',
        start: 'top center',
        toggleActions: 'play none none reverse',
        markers: true,
        id: 'second-box'
      },
      attr: {cx: () => Math.random() * svgWidth},
      duration: 0.5,
      ease: 'power3.inOut'
    });

    //the animation triggered by the third text box
    //this just sets up the scroll trigger, but the animation
    //is done using our D3 functions, passed as callbacks to onEnter and onLeaveBack
    ScrollTrigger.create({
      trigger: '#step-3',
      start: 'top center',
      onEnter: circlesToTimeline,
      onLeaveBack: circlesToRandom,
      markers: true,
      id: 'third-box'
    });

    //This pins the SVG chart wrapper when it hits the center of the viewport
    //and releases the pin when the final textbox meets the bottom of the chart
    //we use a function to define the end point to line up the bottom of the
    //text box with the bottom of the chart
    ScrollTrigger.create({
      trigger: '#chart-wrapper',
      endTrigger: '#step-4',
      start: 'center center',
      end: () => {
        const height = window.innerHeight;
        const chartHeight = document.querySelector('#chart-wrapper')
          .offsetHeight;
        return `bottom ${chartHeight + (height - chartHeight) / 2}px`;
      },
      pin: true,
      pinSpacing: false,
      markers: true,
      id: 'chart-pin'
    });

    //scrubbing animation
    //sets an animation on each stacked text element
    //but gives each one a slightly different scrub value
    //so when you scroll they separate and catch up at
    //different rates
    gsap.utils.toArray('.scrub').forEach((el, i) => {
      gsap.to(el, {
        scrollTrigger: {
          trigger: '.scrub-wrapper',
          start: 'top top',
          end: 'bottom center+=150',
          pin: '.scrub-wrapper',
          scrub: (7 - i) * 0.1,
          markers: true,
          id: 'scrub-tween'
        },
        y: '45vh'
      });
    });

    //our custom d3 functions that stack our circles
    //into a timeline dot plot
    function circlesToTimeline() {
      circles
        .transition()
        .duration(1000)
        .attr('r', circleRad)
        .attr('cx', d => timeScaleTriggered(d.properties.day))
        .attr('cy', d => svgHeight - d.properties.id_day * 20)
        .style('opacity', 1);
    }
    //reverses the circles back to a random position
    function circlesToRandom() {
      circles
        .transition()
        .attr('r', () => Math.random() * 20)
        .attr('cx', () => Math.random() * svgWidth)
        .attr('cy', () => Math.random() * svgHeight)
        .style('opacity', 0.7);
    }

    //////////////////////////////////////////////////
    // Ignore this, it's all just for the markers   //
    // menu, nothing to do with animation           //
    //////////////////////////////////////////////////
    const pinMarkers = contains('div', 'chart-pin');
    const toggleMarkers = contains('div', 'toggle-active-class');
    const box1Markers = contains('div', 'first-box');
    const box2Markers = contains('div', 'second-box');
    const box3Markers = contains('div', 'third-box');
    const scrubMarkers = contains('div', 'scrub-tween');

    const allMarkers = [
      ...pinMarkers,
      ...toggleMarkers,
      ...box1Markers,
      ...box2Markers,
      ...box3Markers,
      ...scrubMarkers
    ];
    allMarkers.forEach(el => {
      el.classList.add('hidden');
    });

    function updateMarkers(check, markers) {
      if (check.checked) {
        markers.forEach(el => {
          el.classList.add('hidden');
        });
      } else {
        markers.forEach(el => {
          el.classList.remove('hidden');
        });
      }
    }

    pinLabel.addEventListener('click', () =>
      updateMarkers(pinCheck, pinMarkers)
    );
    toggleLabel.addEventListener('click', () =>
      updateMarkers(toggleCheck, toggleMarkers)
    );
    box1Label.addEventListener('click', () =>
      updateMarkers(box1Check, box1Markers)
    );
    box2Label.addEventListener('click', () =>
      updateMarkers(box2Check, box2Markers)
    );
    box3Label.addEventListener('click', () =>
      updateMarkers(box3Check, box3Markers)
    );
    scrubLabel.addEventListener('click', () =>
      updateMarkers(scrubCheck, scrubMarkers)
    );
  });

const timeParse = d3.timeParse('%Y-%m-%d %H:%M:%S');
function clean(data) {
  for (const d of data.features) {
    const date = timeParse(d.properties.time);
    d.properties.date = date;
    d.properties.day = d3.timeDay(date);
  }
  return data;
}
