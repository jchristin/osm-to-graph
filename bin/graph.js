#!/usr/bin/env node

"use strict";

var path = require("path"),
	osmToGraph = require("../lib/index.js"),
	argv = process.argv.slice(2);

if (argv.length !== 1) {
	throw new Error("Invalid parameters.");
}

var extname = path.extname(argv[0]);
if (extname !== ".osm") {
	throw new Error("Input file must be an OSM file.");
}

var basename = path.basename(argv[0], extname);
var graph = osmToGraph.buildGraph(argv[0]);
osmToGraph.addEdgeInfo(graph);
osmToGraph.displayGraphInfo(graph);
osmToGraph.saveGraph(graph, basename + ".json");
