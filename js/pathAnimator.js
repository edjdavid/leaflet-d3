/*
 * Copyright (c) 2016 Eduardo David Jr.
 * Licensed under the MIT License. See LICENSE file in the project root for full license information.
 */

/*jslint browser: true*/
/*global d3*/

function Path(layer, delay, simTime) {
  "use strict";
  // delay: time delay in milliseconds (e.g. to start animating a path after
  //    1 unit of sim time, t = 1 * Path.config.time * Path.config.simStep)
  // simTime: no of simulation units that this path animates
  // see Path.config.time

  this.layer = layer;
  this.setId();
  this.addMarker();
  Path.paths[this.getElement().id] = this;
  this.startTime = delay || 0; // start animation on Path.config.startTime
  this.simTime = simTime || 3600 / Path.config.simStep;
  this.pathLoc = 0.0;
  this.animDone = null;
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
  var path = d3.select(this.getElement());
  var svg = d3.select(this.getSvg());

  var startPoint = this.getStartPoint();

  var marker = svg.append("circle");
  marker.attr("r", 2)
    .attr("id", "marker-" + path.attr("id"))
    .attr("transform", "translate(" + startPoint + ")")
    .attr("class", "path-marker");

  this.marker = marker;
};

Path.prototype.noop = function() {
  "use strict";
  return;
};

Path.prototype.onAnimationStart = Path.prototype.noop;
Path.prototype.onAnimationEnd = Path.prototype.noop;

Path.prototype.animate = function(t) {
  "use strict";
  var relTime = t - this.startTime;
  if (relTime < 0) {
    return;
  } else if (this.animDone === null) {
    this.onAnimationStart();
    this.animDone = false;
  }
  var path = this.getElement();
  var length = path.getTotalLength();
  var d = 1.0 * (length / this.simTime) * (relTime / Path.config.time);
  if (d > length) {
    this.onAnimationEnd();
    this.animDone = true;
    this.pathLoc = 1.0;
  }
  d3.select(path).attr("stroke-opacity", 0.45)
    .attr("stroke-dasharray", d + "," + length);

  this.pathLoc = d / parseFloat(length);
  var p = path.getPointAtLength(d);
  this.marker.attr("transform", "translate(" + p.x + "," + p.y + ")");
};

Path.prototype.reposition = function() {
  "use strict";
  var path = this.getElement();
  var l = path.getTotalLength();
  var d = l * this.pathLoc;
  if (this.pathLoc > 0) {
    d3.select(path).attr("stroke-dasharray", d + "," + l);
  }
  var p = path.getPointAtLength(d);
  this.marker.attr("transform", "translate(" + p.x + "," + p.y + ")");
};

Path.prototype.onZoomEnd = function() {
  "use strict";
  this.reposition();
};

Path.animateAll = function() {
  "use strict";
  d3.timer(Path.config.timerCallback);
};

Path.eachPath = function(f) {
  "use strict";
  for (var p in Path.paths) {
    if (!Path.paths.hasOwnProperty(p)) {
      continue;
    }

    f(Path.paths[p]);
  }
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
  animationEnd: function() {
    "use strict";
    return;
  },
  timerCallback: function(t) {
    "use strict";
    Path.eachPath(function(p) {
      if (!p.animDone) {
        p.animate(t);
      }
    });

    Path.config.displayTime(t);
    Path.config.animationEnd();

    if (t > Path.config.runTime) {
      return true; // this would stop the timer
    }
  }
};
