// log.js
// create by chenyq Jan/03/2014

var fs = require('fs');

function Log(path, flag) {
    if (!(this instanceof Log))
        return new Log(path, flag);

    this.path = path;
    this.flag = flag;
}

// 保存日志中
Log.prototype.log = function(level, text) {
    var date = new Date();
    var p = this.path + '/' + date.getFullYear() + '_' + (date.getMonth() + 1);
    var file = p + '/' + this.flag + date.getDate() + '.log';
    fs.exists(p, function(exists) {
        if (exists) {
            fs.appendFile(file, date.toLocaleTimeString() + ' ' + level + ':\t' + text + '\n');
        } else {
            fs.mkdir(p, function() {
                fs.appendFile(file, date.toLocaleTimeString() + ' ' + level + ':\t' + text + '\n');
            });
        }
    });
}

Log.prototype.info = function(text) { this.log('INF', text); }
Log.prototype.error = function(text) { this.log('ERR', text); }
Log.prototype.warning = function(text) { this.log('WAR', text); }

// 将异常保存在指定路径中
Log.prototype.exception = function(err) {
    var date = new Date();
    var p = this.path + '/crash/' + date.getFullYear() + '_' + (date.getMonth() + 1);
    var file = p + '/' + this.flag + date.getDate() + '_' + date.getHours() + '.log';
    var msg = date + '\n' + err.stack + '\n\n';
    fs.exists(p, function(exists) {
        if (exists) {
            fs.appendFile(file, msg);
        } else {
            fs.mkdir(p, function() {
                fs.appendFile(file, msg);
            });
        }
    });
}

module.exports = {
    create : function(path, flag) { return new Log(path, flag); },
};

