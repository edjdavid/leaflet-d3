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
}

function ready(error, mapJson) { // jshint ignore:line
  "use strict";
  // let's use a different start time
  Path.config.startTime = (new Date('2016-01-01T12:00:00')).getTime();
  Path.config.simStep = 30;
  loadGeoJson(mapJson);

  Path.animateAll();
}
