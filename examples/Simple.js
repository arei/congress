"use strict";

var Congress = require("./congress");

(function(){
	var args = process.argv.slice(2);
	new Congress({
		name: args[0] || null,
		mode: args[1] || "broadcast",
		debug: true
	});
})();

