"use strict";

var fs = require("fs"),
	_ = require("lodash"),
	cheerio = require("cheerio"),
	turfpoint = require("turf-point"),
	turfdistance = require("turf-distance"),
	turfbearing = require("turf-bearing");

module.exports.buildGraph = function(path) {
	console.log("Reading file...");
	var content = fs.readFileSync(path);

	console.log("Parsing XML...");
	var $ = cheerio.load(content, {
			xmlMode: true
		}),
		graph = {};

	console.log("Getting nodes and edges...");
	$("way tag[k=highway]").each(function(index, element) {
		var children = $("nd", element.parentNode).get(),
			nodes = [],
			ref,
			node,
			i;

		for (i = 0; i < children.length; i++) {
			ref = children[i].attribs.ref;
			node = graph[ref];

			if (!node) {
				node = {
					edges: []
				};

				graph[ref] = node;
			}

			nodes.push(node);
		}

		for (i = 0; i < children.length - 1; i++) {
			nodes[i].edges.push(nodes[i + 1]);
		}

		for (i = 1; i < children.length; i++) {
			nodes[i].edges.push(nodes[i - 1]);
		}
	});

	console.log("Getting coordinates...");
	$("osm").children().each(function(index, element) {
		var node = graph[element.attribs.id];
		if (node) {
			node.latitude = element.attribs.lat;
			node.longitude = element.attribs.lon;
		}
	});

	return graph;
};

module.exports.saveGraph = function(graph, path) {
	console.log("Preparing graph for serialization...");
	_.forEach(graph, function(node, ref) {
		node.ref = ref;
	});

	_.forEach(graph, function(node) {
		_.forEach(node.edges, function(edge, index, edges) {
			edges[index] = {
				ref: edge.edge.ref,
				distance: edge.distance,
				bearing: edge.bearing
			};
		});
	});

	console.log("Serializing graph...");
	var content = JSON.stringify(graph);

	console.log("Writing file...");
	fs.writeFile(path, content, function(err) {
		if (err) {
			return console.log(err);
		}
	});
};

module.exports.loadGraph = function(path) {
	console.log("Reading file...");
	var content = fs.readFileSync(path);

	console.log("Parsing content...");
	var graph = JSON.parse(content);

	console.log("Referencing nodes...");
	_.forEach(graph, function(node) {
		_.forEach(node.edges, function(edge, index, edges) {
			edges[index] = graph[edge.ref];
		});
	});

	return graph;
};

module.exports.displayGraphInfo = function(graph) {
	console.log("Node count: " + _.size(graph));
	console.log("Edge count: " + _.reduce(graph, function(result, value) {
		return result + _.size(value.edges);
	}, 0));
};

module.exports.addEdgeInfo = function(graph) {

	console.log("Adding edge informations...");
	_.forEach(graph, function(node) {
		_.forEach(node.edges, function(edge, index, edges) {

			var pointorigin = turfpoint([
				node.longitude,
				node.latitude
			]);

			var pointdest = turfpoint([
				edge.longitude,
				edge.latitude
			]);

			var distance = turfdistance(pointorigin, pointdest, 'kilometers');
			var bearing = turfbearing(pointorigin, pointdest);

			var edgedata = {
				distance: distance,
				bearing: bearing,
				edge: edge
			};

			edges[index] = edgedata;
		});
	});

	return graph;
};
