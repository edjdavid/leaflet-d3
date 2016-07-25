/*
 * Copyright (c) 2016 Eduardo David Jr.
 * Licensed under the MIT License. See LICENSE file in the project root for full license information.
 */

/*jslint browser: true*/
/*global queue, L, d3*/

queue()
  .defer(d3.json, "files/map.geojson")
  .await(ready);

function loadGeoJson(mapJson) {
  "use strict";
  var map, gj;
  map = L.map('map', {
    center: [1.30009, 103.85],
    zoom: 15
  });

  L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
    subdomains: 'abcd',
    maxZoom: 15
  }).addTo(map);

  gj = L.geoJson(mapJson, {
    color: "#ff7800",
    weight: 2,
    opacity: 0
  }).addTo(map);

  gj.eachLayer(function(layer) {
    new Path(layer);
  });
}

function Path(layer, t) {
  "use strict";
  // I'll place everything into a class
  // this would make everything easier later on
  this.layer = layer;
  this.setId();
  this.addMarker();
  Path.paths[this.getElement().id] = this;
  this.startTime = t || 0;
  this.simTime = 60; // 60 mins
  this.animDone = false;
}

Path.prototype.getElement = function() {
  "use strict";
  return this.layer.getElement();
};

Path.prototype.setId = function() {
  "use strict";
  // layer.feature is the geojson data
  // since my sample geojson doesn't contain an id
  // I'll just generate a random id
  var id = Math.floor(Math.random() * 100000);
  this.getElement().id = "feature-" + id; // this.layer.feature.id;
};

Path.prototype.getSvg = function() {
  "use strict";
  return this.getElement().parentNode.parentNode;
};

Path.prototype.getStartPoint = function() {
  "use strict";
  var p = this.getElement().getPointAtLength(0);
  return p.x + "," + p.y;
};

Path.prototype.addMarker = function() {
  "use strict";
  // ToDo This marker doesn't scale properly on leaflet zoom
  var path = d3.select(this.getElement());
  var svg = d3.select(this.getSvg());

  var startPoint = this.getStartPoint();

  var marker = svg.append("circle");
  marker.attr("r", 2)
    .attr("id", "marker-" + path.attr("id"))
    .attr("fill", "yellow")
    .attr("transform", "translate(" + startPoint + ")");

  this.marker = marker;
};

Path.prototype.tweenDash = function() {
  "use strict";
  var path = d3.select(this);
  var l = path.node().getTotalLength();
  var i = d3.interpolateString("0," + l, l + "," + l);
  var marker = d3.select("#marker-" + path.attr("id"));

  path.attr("stroke-dasharray", i(0));
  path.attr("stroke-opacity", 0.45);
  return function(t) {
    var p = path.node().getPointAtLength(t * l);
    marker.attr("transform", "translate(" + p.x + "," + p.y + ")");
    return i(t);
  };
};

Path.prototype.transition = function(endCallback) {
  "use strict";
  var path = d3.select(this.getElement());
  path.transition()
    .duration(3500)
    .attrTween("stroke-dasharray", this.tweenDash)
    .each("end", endCallback || this.noop);
};

Path.prototype.animate = function(t) {
  "use strict";
  var relTime = t - this.startTime;
  if (relTime < 0) {
    return;
  }
  var path = this.getElement();
  var length = path.getTotalLength();
  var d = 1.0 * (length / this.simTime) * (relTime / Path.config.time);
  if (d > length) {
    this.animDone = true;
  }
  d3.select(path).attr("stroke-opacity", 0.45)
    .attr("stroke-dasharray", d + "," + length);
};

Path.prototype.noop = function() {
  "use strict";
  return;
};

Path.paths = {};
Path.config = {
  "time": 100.0 / 1.0 // 100 ms real time = 1 min sim time
};

Path.animateAll = function() {
  "use strict";
  d3.timer(Path.timerCallback);
};

Path.timerCallback = function(t) {
  "use strict";
  for (var p in Path.paths) {
    if (!Path.paths.hasOwnProperty(p)) {
      continue;
    }

    if (!Path.paths[p].animDone) {
      Path.paths[p].animate(t);
    }
  }

  if (t > 10000) {
    return true; // this would stop the timer
  }
};

function ready(error, mapJson) { // jshint ignore:line
  "use strict";
  loadGeoJson(mapJson);

  function runParallel() {
    for (var k in Path.paths) {
      if (!Path.paths.hasOwnProperty(k)) {
        continue;
      }
    }
  }

  function runSequential() {
    // load sequentially, in no particular order
    var pathOrder = [];
    for (var k in Path.paths) {
      if (!Path.paths.hasOwnProperty(k)) {
        continue;
      }

      pathOrder.push(k);
    }

    var ctr = 0;

    function runNext() {
      if (pathOrder[ctr]) {
        Path.paths[pathOrder[ctr]].transition(runNext);
        ++ctr;
      } else {
        runParallel();
      }
    }
    runNext();
  }
  // runSequential();

  Path.animateAll();
}
