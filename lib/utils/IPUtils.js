"use strict";

var IPUtils = {};

IPUtils.GetIPAddress = function() {
	var os = require('os');
	var interfaces = os.networkInterfaces();

	var found = null;
	Object.keys(interfaces).forEach(function(name) {
		if (found) return;
		interfaces[name].forEach(function (inface) {
			if (found) return;
			if (inface.family!=="IPv4" || inface.internal) return;
			found = inface;
		});
	});

	return found && found.address || null;
};

module.exports = IPUtils;
