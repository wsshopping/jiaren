// dbhelper.js
// create by chenyq May/07/2014

var mysql = require('mysql');
var async = require('async');
var cfg   = require('../cfg.js');

function DbHelper(logObj) {
    if (! (this instanceof DbHelper))
        return new DbHelper(logObj);

    this.log = logObj;
    this.idsTblNum = cfg.db.idsTblNum;
    this.noteTblNum = cfg.db.noteTblNum;
    this.maxNoteNum = cfg.db.maxNoteNum;
    this.cfg = {
        host : cfg.db.host,
        user : cfg.db.user,
        port : cfg.db.port,
		insecureAuth : true,
        password : cfg.db.password,
        database : cfg.db.dbname
    };

    this.notesList = [];
    this.savingLastNote = false;
    this.connectDb();
}

// 错误处理函数
function handleDbError(err) {
    if (err) {
        // 如果是连接断开，则重新连接
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            this.connectDb();
        } else {
            this.log.error(err.statck || err);
        }
    }
}

// 连接数据库
DbHelper.prototype.connectDb = function() {
    this.db = mysql.createConnection(this.cfg);
    this.db.connect(handleDbError.bind(this));
    this.db.on('error', handleDbError.bind(this));
}

// 关闭数据库
DbHelper.prototype.close = function() {
	if (this.db) {
		this.db.end();
	}
}

// 将给定的字符串映射成一个整数
function mapStringToInt(str) {
    var n = 0;
    for (var i = 0; i < str.length; ++i) {
        n += str.charCodeAt(i);
    }

    return n;
}

// 保存 Note 信息
DbHelper.prototype.saveNoteInfo = function(device_id, info) {
    var flag = mapStringToInt(device_id);

    if (this.savingLastNote) {
        // 正在保存上一条信息，缓存之
        this.notesList.push([flag, device_id, info]);
        return;
    }

    this.saveToDb(flag, device_id, info);
}

DbHelper.prototype.saveToDb = function(flag, device_id, info) {
    var dbhelper = this;
    dbhelper.savingLastNote = true;

    var idsTbl = 'ids_info' + (flag % dbhelper.idsTblNum);
    var noteTbl = 'note_info' + (flag % dbhelper.noteTblNum);
    var getIdsSql = 'select ids from ' + idsTbl + ' where device_id = ? limit 1';
    var insertIdsSql = 'insert into ' + idsTbl + '(device_id, ids) values(?, ?)';
    var updateIdsSql = 'update ' + idsTbl + ' set ids = ? where device_id = ?';
    var insertNoteSql = 'insert into ' + noteTbl + '(t, msg) values(?, ?)';
    var updateNoteSql = 'update ' + noteTbl + ' set t = ?, msg = ?, `read`=0 where id = ?';
    var db = dbhelper.db;
    var NOTE_NUM_PER_DEVICE = dbhelper.maxNoteNum;

    async.auto({
        getIds : function(callback) {
            // 查询设备相关信息
            db.query(getIdsSql, [device_id], function(err, rows) {
                callback(err, rows);
            });
        },
        updateNote : ['getIds', function(callback, results) {
            // 当设备对应的 Note 数量存满时，更新该设备最早的那条 Note
            if (results.getIds.length > 0) {
                var ids = results.getIds[0].ids.split(',');
                if (ids.length === NOTE_NUM_PER_DEVICE) {
                    var id = ids.shift();
                    db.query(updateNoteSql, [new Date().getTime() / 1000, info, id], function(err, result) {
                        callback(err, result);
                    });

                    return;
                }
            }

            callback(null, null);
        }],
        newNote : ['getIds', function(callback, results) {
            // 不存在该设备相关信息或者该设备对应的 Note 数未达到指定数量，则添加 Note
            if (results.getIds.length > 0) {
                var ids = results.getIds[0].ids.split(',');
                if (ids.length >= NOTE_NUM_PER_DEVICE) {
                    // 无需插入新 Note
                    callback(null, null);
                    return;
                }
            }

            db.query(insertNoteSql, [new Date().getTime() / 1000, info], function(err, result) {
                callback(err, result);
            });
        }],
        newIds : ['newNote', function(callback, results) {
            // 设备信息不存在时需要添加相应的设备信息
            if (results.getIds.length === 0) {
                db.query(insertIdsSql, [device_id, '' + results.newNote.insertId], function(err, result) {
                    callback(err, result);
                });

                return;
            }

            callback(null, null);
        }],
        updateIds : ['newNote', function(callback, results) {
            // 存在相关设备信息时需要更新该设备对应的 Note id 信息
            if (results.getIds.length === 0) {
                // 不存在相应的设备，无需更新
                callback(null, null);
                return;
            }

            var ids = results.getIds[0].ids.split(',');
            if (ids.length < NOTE_NUM_PER_DEVICE) {
                // 添加新 Note 对应的 id
                ids.push(results.newNote.insertId);
            } else {
                // 将第一个 id 移到最后
                ids.push(ids.shift());
            }

            db.query(updateIdsSql, [ids.join(','), device_id], function(err, result) {
                callback(err, result);
            });
        }],
    }, function(err, results) {
        if (err) {
            dbhelper.log.error(err);
        }

        // 如果还有未保存的 Note，则保存之
        dbhelper.savingLastNote = false;
        if (dbhelper.notesList.length > 0) {
            var request = dbhelper.notesList.shift();
            dbhelper.saveToDb(request[0], request[1], request[2], request[3]);
        }
    });
}

// 获取指定设备的 Note 信息
DbHelper.prototype.getNotes = function(device_id, callback) {
    dbhelper = this;
    var flag = mapStringToInt(device_id);
    var idsTbl = 'ids_info' + (flag % dbhelper.idsTblNum);
    var noteTbl = 'note_info' + (flag % dbhelper.noteTblNum);
    var getIdsSql = 'select ids from ' + idsTbl + ' where device_id = ? limit 1';
    var db = dbhelper.db;

    async.auto({
        getIds : function(cb) {
            db.query(getIdsSql, [device_id], function(err, rows){
                cb(err, rows);
            });
        },
        getNotes : ['getIds', function(cb, results) {
            if (results.getIds.length === 0) {
                // 没有数据
                cb(null, []);
                return;
            }

            var ids = results.getIds[0].ids;
            var num = ids.split(',').length;
            var getNotesSql = 'select id, t, msg from ' + noteTbl + ' where id in (' + ids + ') and `read`=0 limit ' + num;
            db.query(getNotesSql, [], function(err, rows) {
                cb(err, rows);
            });
        }]
    }, function(err, results) {
        if (err) {
            callback(err);
            return;
        }

        callback(null, results.getNotes);
    });
}

// 标记 Note 已读
DbHelper.prototype.setNotesRead = function(device_id, noteIds) {
    var flag = mapStringToInt(device_id);
    var noteTbl = 'note_info' + (flag % dbhelper.noteTblNum);
    this.db.query('update ' + noteTbl + ' set `read`=1 where id in (?)', [noteIds.split(',')], function(err, rows){});
}

module.exports = {
    create : function (logObj) {
        return new DbHelper(logObj);
    }
};

