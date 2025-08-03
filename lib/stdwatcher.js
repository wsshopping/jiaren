// stdwatcher.js
// Created by chenyq Aug/21/2013

var events = require('events');
var sysu = require('util');
var readline = require('readline');

function StdWatcher() {
    if (!(this instanceof StdWatcher)) {
        return new StdWatcher();
    }

    this.rl = readline.createInterface({input:process.stdin, output:process.stdout});
    
    var watcher = this;
    this.rl.on('line', function(text) {
        if (text == 'server.quit') {
            watcher.rl.close();
            watcher.emit('quit');
        } else {
            watcher.emit('line', text);
        }
    });

    events.EventEmitter.call(this);
}

sysu.inherits(StdWatcher, events.EventEmitter);

StdWatcher.prototype.close = function() {
    console.log("close StdWatcher");
};

StdWatcher.prototype.write = function(data) {
    if (this.rl)
        this.rl.write(data);
};

function create() { return new StdWatcher(); }

module.exports.create = create;

