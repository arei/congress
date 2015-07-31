"use strict";


var ConnectionManager = function() {
	var me = this;

	var connections = {};
	var timeout = 300000; // 5 minutes

	/**
	 * Returns the number of milliseconds before a connection times out. By
	 * default this is 5 minutes.
	 *
	 * @return {number} number of milliseconds.
	 */
	var getTimeout = function() {
		return timeout;
	};
	this.getTimeout = getTimeout;

	/**
	 * Set the number of milliseconds before a connection times out.  If set to
	 * zero, connections timeout immediately.  If -1, connections never timeout. If
	 * greater than 0, connections timeout in that many milliseconds.
	 *
	 * @param {number} i number of milliseconds.
	 */
	var setTimeout = function(i) {
		if (i===undefined || i===null) return;
		if (i<0) i = -1;
		timeout = i;
	};
	this.setTimeout = setTimeout;

	var addConnection = function(name,address,port) {
		if (timeout===0) return;

		connections[name] = {
			name: name,
			address: address,
			port: port,
			updated: Date.now()
		};

		if (timeout>0) invalidateConnections();
	};
	this.addConnection = addConnection;

	var removeConnection = function(name) {
		delete connections[name];
	};
	this.removeConnection = removeConnection;

	var getConnection = function(name) {
		console.log(module.id);
		var connection = connections[name];
		if (timeout>0 && connection && Date.now()-connection.updated>timeout) connection = null;
		return connection;
	};
	this.getConnection = getConnection;

	var hasConnection = function(name) {
		return !!me.getConnection(name);
	};
	this.hasConnection = hasConnection;

	var getConnectionAddress = function(name) {
		var connection = me.getConnection(name);
		return connection && connection.address || null;
	};
	this.getConnectionAddress = getConnectionAddress;

	var getConnectionPort = function(name) {
		var connection = me.getConnection(name);
		return connection && connection.port || null;
	};
	this.getConnectionPort = getConnectionPort;

	var getConnectionUpdated = function(name) {
		var connection = me.getConnection(name);
		return connection && connection.updated || null;
	};
	this.getConnectionUpdated = getConnectionUpdated;

	var getNames = function() {
		if (timeout>0) invalidateConnections();
		return Object.keys(connections);
	};
	this.getNames = getNames;

	var invalidateConnections = function() {
		var names = Object.keys(connections);
		var now = Date.now();
		names.forEach(function(name){
			var connection = connections[name];
			if (!connection) return;

			var since = now-connection.updated;
			if (since>timeout) connections[name] = null;
		});
	};
};

module.exports = new ConnectionManager();
