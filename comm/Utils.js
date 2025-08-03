
var sysu  = require('util');
var curTime = null
var index = 1000

module.exports = {
    genUniqueId : function() {
        var nowDate = new Date();
        if (curTime == nowDate.getTime()) {
            ++index
        } else {
            curTime = nowDate.getTime()
            index = 1000
        }

        return sysu.format('000%d%d', nowDate.getTime(), index);
    }
}
