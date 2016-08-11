/*
 * Copyright (c) 2016 Eduardo David Jr.
 * Licensed under the MIT License. See LICENSE file in the project root for full license information.
 */

/*jslint browser: true*/
/*global queue, L, d3, Path*/

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
    // dates would always be in local timezone
    var delay = ((new Date(layer.feature.properties.startTime)).getTime() -
      Path.config.startTime) / Path.config.simStep * Path.config.time / 1000;
    // duration should be in seconds
    var runTime = layer.feature.properties.duration / Path.config.simStep;

    new Path(layer, delay, runTime);
  });

  // `zoomend` event doesn't wait until the paths are resized
  map.on("moveend", function() {
    Path.eachPath(function(p) {
      p.onZoomEnd();
    });
  });

  return map;
}

function ready(error, mapJson) {
  "use strict";
  if (error) {
    console.log(error);
  }
  // let's use a different start time
  Path.config.startTime = (new Date('2016-01-01T12:00:00')).getTime();
  Path.config.simStep = 30;
  Path.config.runTime = 20000;

  // Let's display the id of the currently animating path
  Path.prototype.onAnimationStart = function() {
    // `this` inside the function = path instance
    var msg = d3.select("#message");
    msg.append("p").text(this.getElement().id + ": Starting");
  };

  Path.prototype.onAnimationEnd = function() {
    var msg = d3.select("#message");
    msg.append("p").text(this.getElement().id + ": End");
  };
  var map = loadGeoJson(mapJson);

  var pathIds = [];
  for (var k in Path.paths) {
    if (!Path.paths.hasOwnProperty(k)) {
      continue;
    }
    pathIds.push(k);
  }

  var followIdx = 2;

  var followPath = function() {
    var path = Path.paths[pathIds[followIdx]];
    var elem = path.getElement();
    var length = elem.getTotalLength();
    var p = elem.getPointAtLength(length * path.pathLoc);
    var latlng = map.layerPointToLatLng(L.point(p.x, p.y));
    map.panTo(latlng);

    if (path.animDone && followIdx > 0) {
      followIdx -= 1;
    }
  };

  // just comment the next line if we don't want the map following
  // the path movement
  Path.config.animationEnd = followPath;
  Path.animateAll();
}
