// testclient.js
// Created by yanggt
// ²âÊÔ¿Í»§¶Ë

var cfg   = require('./cfg.js');
var comm  = require('./comm/Comm.js');

var debug_t1 = -1;
var debug_t2 = 0;
var interval = 0;
var debug_times = 0;

function TestClient() {
    if (! (this instanceof TestClient))
        return new TestClient();

    this.aaaHost = cfg.host;
    this.aaaPort = cfg.port;
    this.connection = comm.createConnection();
    this.regSelfCallback('MSG_CLIENT_CONNECTED',    this.onConnected);
    this.regSelfCallback('MSG_CLIENT_DISCONNECTED', this.onDisConnected);
}

TestClient.prototype.onConnected = function(msg, data) {
    debug_t2 = process.uptime();

    if (! (debug_times % 1000))
        console.log("debug_times:" + debug_times + " interval:" + (debug_t2 - debug_t1));

    if (++debug_times > 10000)
        return;

    this.connection.end();
    this.connection.connect(this.aaaHost, this.aaaPort);
}

TestClient.prototype.onDisConnected = function(msg, data) {
    if (data["result"] != 'end')
    {
        console.log('disconnect by error');
        this.onConnected(msg, data);
    }
}

TestClient.prototype.regCallback = function(msg, func) {
    this.connection.regCallback(msg, func);
}

TestClient.prototype.regSelfCallback = function(msg, func) {
    this.regCallback(msg, func.bind(this));
}

TestClient.prototype.run = function() {
    debug_times = 1;
    debug_t1 = process.uptime();
    this.connection.connect(this.aaaHost, this.aaaPort);
}

module.exports = {
    create : function() { return new TestClient() },
};
