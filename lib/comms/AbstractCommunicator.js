"use strict";

var AbstractCommunicator = function(options) {
	var me = this;

	var group = null;
	var name = null;
	var handlers = [];

	options = options || {};
	options.group = options.group || "congress";
	if (!options.name) {
		options.name = "";
		for (var i=0;i<16;i++) options.name += String.fromCharCode(97+Math.random()*26);
	}

	group = options.group;
	name = options.name;

	var initialize = function() {
		throw new Error("Missing initialize implementation.");
	};
	this.initialize = initialize;

	var send = function(/*to,title,content,callback*/) {
		throw new Error("Missing send implementation.");
	};
	this.send = send;

	var forward = function(/*packet,callback*/) {
		throw new Error("Missing forward implementation.");
	};
	this.forward = forward;

	var ready = function() {
		throw new Error("Missing send implementation.");
	};
	this.ready = ready;

	var handleError = function() {
		console.error(arguments);
	};
	this.handleError = handleError;

	var handleMessage = function(buffer/*,origin*/) {
		var packet = null;
		try {
			packet = JSON.parse(buffer.toString("utf8"));
		}
		catch (ex) {
			return handleError("Unable to decode message.");
		}

		if (!packet) return;

		var headers = packet.headers;
		if (!headers) return;
		if (!headers.group) return;
		if (!headers.to) return;
		if (!headers.from) return;
		if (!headers.from.name) return;
		if (!headers.from.address) return;
		if (!headers.from.port) return;
		if (!headers.timestamp) return;

		if (headers.group!==me.getGroup()) return;
		if (headers.from.name===me.getName()) return;
		if (headers.to.name && headers.to.name!=="*" && headers.to.name!==me.getName()) return;
		if (headers.route && headers.route[me.getName()]) return;

		if (options.debug) console.log("Received: "+packet.title);
		me.fireHandler(packet.title,headers,packet.content);

		if (headers.to.name==="*" && headers.forward) me.forward(packet);
	};
	this.handleMessage = handleMessage;

	var makeSendPacket = function(sourceAddress,sourcePort,targetName,targetAddress,targetPort,title,content) {
		if (!sourcePort) throw new Error("Invalid sourcePort.");
		if (!targetName) throw new Error("Invalid targetName.");
		if (!targetAddress) throw new Error("Invalid targetAddress.");
		if (!targetPort) throw new Error("Invalid targetPort.");
		if (!title || typeof(title)!=="string") throw new Error("Invalid title.");

		var contentJSON = null;
		if (content!==undefined && content!==null) {
			try {
				contentJSON = JSON.stringify(content);
			}
			catch (ex) {
				throw new Error("Unable to parse content into JSON.",ex);
			}
		}

		var packet = {
			title: title,
			headers: {
				group: me.getGroup(),
				to: {
					name: targetName,
					address: targetAddress,
					port: targetPort
				},
				from: {
					name: me.getName(),
					address: sourceAddress,
					port: sourcePort
				},
				timestamp: Date.now(),
				forward: false
			},
			content: content
		};

		return packet;
	};
	this.makeSendPacket = makeSendPacket;

	var makeForwardPacket = function(packet) {
		if (!packet) return null;
		if (!packet.headers) return null;
		if (!packet.headers.route) return null;

		packet.headers.forward = true;
		packet.headers.route[me.getName()] = Date.now();

		return packet;
	};
	this.makeForwardPacket = makeForwardPacket;

	var getName = function() {
		return name;
	};
	this.getName = getName;

	var getGroup = function() {
		return group;
	};
	this.getGroup = getGroup;

	var addHandler = function(handler) {
		handlers.push(handler);
	};
	this.addHandler = addHandler;

	var removeHandler = function(handler) {
		handlers = handler.filter(function(h){
			return handler!==h;
		});
	};
	this.removeHandler = removeHandler;

	var fireHandler = function(type,headers,content) {
		if (!type) return;

		handlers.forEach(function(handler){
			try {
				handler.call(me,type,headers,content);
			}
			catch (ex) {
				console.error("Error executing handler.");
				console.error(ex);
			}
		});
	};
	this.fireHandler = fireHandler;

};

module.exports = AbstractCommunicator;
