// Comm.js
// created by cheny Jul/14/2015
// 通讯模块

var no = require("./CmdMsg.js");
var Connection = require("./Connection.js");

module.exports = {
    no : no,
    createConnection : function() { return Connection.create() },
};

