/*jslint browser: true*/
/*global queue, L, d3*/

queue()
.defer(d3.json, "files/map.geojson")
.await(ready);

function loadGeoJson(mapJson) {
    "use strict";
    var map, gj, ctr;
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
        opacity: 0.45
    }).addTo(map);

    ctr = 1;
    gj.eachLayer(function (layer) {
        // layer.feature is the geojson data
        // since my sample geojson doesn't contain an id
        // I'll just generate a sequential id
        layer.getElement().id = 'feature-' + ctr; // + layer.feature.id;
        ctr = ctr + 1;
    });
}

function ready(error, mapJson) { // jshint ignore:line
  "use strict";
  loadGeoJson(mapJson);

  var path = d3.select("path#feature-1").call(transition);
  var svg = d3.select(path.node().parentNode.parentNode);
  var startPoint = pathStartPoint(path);

  var marker = svg.append("circle");
  marker.attr("r", 7)
    .attr("id", "marker")
    .attr("transform", "translate(" + startPoint + ")");

  //Get path start point for placing marker
  function pathStartPoint(path) {
    var d = path.attr("d"),
    dsplitted = d.split(" ");
    return dsplitted[1].replace("L", ",");
  }

  function transition(path) {
    path.transition()
        .duration(7500)
        .attrTween("stroke-dasharray", tweenDash)
        .each("end", function() { d3.select(this).call(transition); });
  }

  function tweenDash() {
    var l = path.node().getTotalLength();
    var i = d3.interpolateString("0," + l, l + "," + l);
    return function(t) {
      var marker = d3.select("#marker");
      var p = path.node().getPointAtLength(t * l);
      marker.attr("transform", "translate(" + p.x + "," + p.y + ")");
      return i(t);
  };
  }
}
