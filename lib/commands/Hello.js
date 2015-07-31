"use strict";

var ConnectionManager = require("../comms/ConnectionManager");

var Hello = function(congress,every) {
	if (!congress) throw new Error("Missing congress reference.");

	var handler = function(type,headers/*,content*/) {
		if (!ConnectionManager.hasConnection(headers.from.name)) {
			console.log("I found "+headers.from.name+" at "+headers.from.address+":"+headers.from.port);
			congress.send(headers.from.name,"HELLO");
		}
		ConnectionManager.addConnection(headers.from.name,headers.from.address,headers.from.port);
	};

	congress.addHandler("HELLO",handler);

	var send = function() {
		congress.send("*","HELLO");
		if (every && every>=1000) setTimeout(send,every);
	};
	send();
};

module.exports = Hello;
