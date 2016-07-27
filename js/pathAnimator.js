/*
 * Copyright (c) 2016 Eduardo David Jr.
 * Licensed under the MIT License. See LICENSE file in the project root for full license information.
 */

/*jslint browser: true*/
/*global d3*/

function Path(layer, delay, simTime) {
  "use strict";
  // t: time delay in milliseconds (e.g. to start animating a path after
  //    1 unit of sim time, t = 1 * Path.config.time * Path.config.simStep)
  // simTime: no of simulation units that this path animates
  // see Path.config.time

  this.layer = layer;
  this.setId();
  this.addMarker();
  Path.paths[this.getElement().id] = this;
  this.startTime = delay || 0; // start animation on Path.config.startTime
  this.simTime = simTime || 3600 / Path.config.simStep; // 60 mins in default
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

  var p = path.getPointAtLength(d);
  this.marker.attr("transform", "translate(" + p.x + "," + p.y + ")");
};

Path.prototype.noop = function() {
  "use strict";
  return;
};

Path.animateAll = function() {
  "use strict";
  d3.timer(Path.config.timerCallback);
};

Path.paths = {};
Path.config = {
  time: 100.0, // milliseconds
  simStep: 60.0, // in seconds, 60s would pass in sim for every Path.config.time
  startTime: (new Date()).getTime(), // in milliseconds
  runTime: 10000, // in milliseconds
  displayTime: function(t) {
    "use strict";
    var rt = t / Path.config.time * (Path.config.simStep * 1000);
    var dt = new Date(rt + Path.config.startTime);

    // FIXME this is an ugly formatter
    d3.select("#date").text(dt.getFullYear() + "/" + (dt.getMonth() + 1) +
      "/" + dt.getDate() + " " + dt.getHours() + ":" + dt.getMinutes());
  },
  timerCallback: function(t) {
    "use strict";
    for (var p in Path.paths) {
      if (!Path.paths.hasOwnProperty(p)) {
        continue;
      }

      if (!Path.paths[p].animDone) {
        Path.paths[p].animate(t);
      }
    }

    Path.config.displayTime(t);

    if (t > Path.config.runTime) {
      return true; // this would stop the timer
    }
  }
};