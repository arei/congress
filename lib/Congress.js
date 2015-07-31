"use strict";

var BroadcastCommunicator = require("./comms/BroadcastCommunicator");
var MulticastCommunicator = require("./comms/MulticastCommunicator");
var UnicastCommunicator = require("./comms/UnicastCommunicator");

var Hello = require("./commands/Hello");

var EMPTY_FUNCTION = function() {};

var Congress = function(options) {
	var me = this;

	var communicator = null;
	var handlers = {};
	var flushing = null;
	var sendBuffer = [];

	options = options || {};
	options.debug = options.debug || false;
	options.mode = options.mode || "broadcast";
	if (!options.name) {
		options.name = "";
		for (var i=0;i<16;i++) options.name += String.fromCharCode(97+Math.random()*26);
	}

	var mode = options.mode || "broadcast";
	mode = mode.toLowerCase();

	if (mode==="broadcast") communicator = new BroadcastCommunicator(options);
	else if (mode==="multicast") communicator = new MulticastCommunicator(options);
	else if (mode==="unicast") communicator = new UnicastCommunicator(options);
	else throw new Error("Invalid mode.");

	var initialize = function() {
		communicator.initialize();
		communicator.addHandler(fireHandler);

		new Hello(me,60000); // send hello and refresh every 1 minute
	};

	var getCommunicator = function() {
		return communicator;
	};
	this.getCommunicator = getCommunicator;

	var getMode = function() {
		return mode;
	};
	this.getMode = getMode;

	var addHandler = function(type,handler) {
		if (!type) throw new Error("Invalid type for handler.");
		handlers[type] = handler || EMPTY_FUNCTION;
	};
	this.addHandler = addHandler;

	var removeHandler = function(type) {
		if (!type) throw new Error("Invalid type for handler.");
		handlers[type] = EMPTY_FUNCTION;
	};
	this.removeHandler = removeHandler;

	var fireHandler = function(type,headers,content) {
		if (!type) return;

		var handler = handlers[type] || EMPTY_FUNCTION;
		try {
			handler.call(me,type,headers,content);
		}
		catch (ex) {
			console.error("Error executing handler.");
			console.error(ex);
		}

		handler = handlers["*"] || EMPTY_FUNCTION;
		try {
			handler.call(me,type,headers,content);
		}
		catch (ex) {
			console.error("Error executing handler.");
			console.error(ex);
		}
	};

	var send = function(/*to,title,content,callback*/) {
		sendBuffer.push(arguments);
		flush();
	};
	this.send = send;

	var flush = function() {
		if (flushing) return;
		flushing = setTimeout(flusher,25);
	};

	var flusher = function() {
		if (!flushing) return;
		if (sendBuffer.length<1) return;

		if (communicator && communicator.ready()) {
			var sending = sendBuffer;
			sendBuffer = [];
			sending.forEach(function(args){
				communicator.send.apply(communicator,args);
			});
		}

		flushing = null;
		if (sendBuffer.length>0) flush();
	};

	initialize();
};

module.exports = Congress;
