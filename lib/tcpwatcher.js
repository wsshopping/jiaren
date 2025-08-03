// tcpwatcher.js
// Created by chenyq Sep/04/2013

var events = require('events');
var sysu = require('util');
var readline = require('readline');
var net = require('net');

function TcpWatcher(port) {
    if (!(this instanceof TcpWatcher)) {
        return new TcpWatcher(port);
    }

    this.svr = net.createServer((function(socket) {
        if (this.socket) {
            socket.end('Only one connection is allowed!');
            return;
        }

        this.socket = socket;
        socket.on('error', function(e) { this.emit('error', e); });
        socket.on('close', (function(hasError) {
            this.socket = null;
            if (this.rl) this.rl.close();
        }).bind(this));

        this.rl = readline.createInterface({input:socket, output:socket});
        this.rl.on('line', (function(text) {
            if (text == 'server.quit') {
                this.rl.close();
                this.emit('quit');
            } else {
                this.emit('line', text);
            }
        }).bind(this));
    }).bind(this)).listen(port);

    events.EventEmitter.call(this);
}

sysu.inherits(TcpWatcher, events.EventEmitter);

TcpWatcher.prototype.close = function() {
    this.socket.end('Goodbye!');
    this.svr.close();
};

TcpWatcher.prototype.write = function(data) {
    if (this.rl)
        this.rl.write(data);
}

function create(port) { return new TcpWatcher(port); }

module.exports.create = create;

