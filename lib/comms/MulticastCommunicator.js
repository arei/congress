"use strict";


var Util = require("util");
var Datagram = require("dgram");

// var IPUtils = require("../utils/IPUtils");
var ConnectionManager = require("./ConnectionManager");
var AbstractCommunicator = require("./AbstractCommunicator");

var MulticastCommunicator = function(options) {
	AbstractCommunicator.call(this,options);
	var me = this;

	var pub = null;
	var priv = null;
	var privport = null;

	options = options || {};
	options.multicast = options.multicast || {};
	options.multicast.type = options.multicast.type || "udp4";
	options.multicast.interface = options.multicast.interface || options.multicast.type==="upd6" && "::0" || "127.0.0.1";
	options.multicast.port = options.multicast.port || 7216;
	options.multicast.address = options.multicast.address || options.multicast.type==="upd6" && "::0" || "239.192.10.10";
	options.listen = options.listen || {};
	options.listen.from = options.listen.from || 12700;
	options.listen.to = options.listen.to || 12799;

	var initialize = function() {
		if (options.debug) console.log("Starting "+me.getName());

		(function(){
			pub = Datagram.createSocket({
				type: "udp4",
				reuseAddr: true
			});
			pub.on("error",me.handleError);
			pub.on("message",me.handleMessage);
			pub.bind(options.multicast.port,function(){
				// pub.setTTL(5);
				pub.setBroadcast(true);
				// pub.setMulticastTTL(5);
				// pub.setMulticastLoopback(false);
				pub.addMembership(options.multicast.address,options.multicast.interface);
				if (options.debug) console.log("Public channel at "+options.multicast.interface+":"+options.multicast.port);
			});
		})();

		(function(){
			var socket = null;
			var port = options.listen.from;

			var success = function() {
				if (socket) socket.close();

				if (options.debug) console.log("Private channel at "+options.multicast.interface+":"+port);

				socket = Datagram.createSocket(options.multicast.type);
				socket.on("error",me.handleError);
				socket.on("message",me.handleMessage);
				socket.bind(port,function(){
					priv = socket;
					privport = port;
				});
			};

			var fail = function() {
				if (socket) socket.close();

				if (options.debug) console.error("Private channel failed.");
				priv = null;
				privport = null;
			};

			var next = function() {
				if (socket) socket.close();

				port += 1;
				if (port>options.listen.to) return fail();
				attempt();
			};

			var attempt = function() {
				if (options.debug) console.log("trying "+port);
				socket = Datagram.createSocket(options.multicast.type);
				socket.on("error",next);
				try {
					socket.bind(port,function(err){
						if (err) next();
						else success();
					});

				}
				catch (ex) {
					next();
				}
			};

			attempt();
		})();
	};
	this.initialize = initialize;

	var ready = function() {
		return priv!==null;
	};
	this.ready = ready;

	var send = function(to,title,content,callback) {
		callback = callback && callback instanceof Function && callback || function() {};

		var socket = priv;

		var sourceAddress = options.multicast.interface;
		var sourcePort = privport;
		var targetName,targetAddress,targetPort;

		if (!to || to==="*") {
			socket = pub;
			targetName = "*";
			targetAddress = options.multicast.address;
			targetPort = options.multicast.port;
		}
		else {
			var target = ConnectionManager.getConnection(to);
			if (!target) return callback("Invalid to address.");

			targetName = target.name;
			targetAddress = target.address;
			targetPort = target.port;
		}

		var packet = me.makeSendPacket(sourceAddress,sourcePort,targetName,targetAddress,targetPort,title,content);

		var buffer = new Buffer(JSON.stringify(packet));
		socket.send(buffer,0,buffer.length,targetPort,targetAddress,callback);
		if (options.debug) console.log("Send: "+to+"("+targetAddress+":"+targetPort+"): "+title+": "+buffer.length+" bytes.");
	};
	this.send = send;

	var forward = function(packet,callback) {
		if (!packet) return callback("Invalid forward packet.");
		callback = callback && callback instanceof Function && callback || function() {};

		packet = me.makeForwardPacket(packet);
		if (!packet) return callback("Invalid forward packet.");

		var socket = pub;
		var address = options.multicast.address;
		var port = options.multicast.port;

		var buffer = new Buffer(JSON.stringify(packet));
		socket.send(buffer,0,buffer.length,port,address,callback);
		if (options.debug) console.log("Forward: *("+address+":"+port+"): "+packet.title+": "+buffer.length+" bytes.");
	};
	this.forward = forward;

};

Util.inherits(MulticastCommunicator,AbstractCommunicator);
module.exports = MulticastCommunicator;
