// DataStream.js
// created by cheny Jul/23/2015
// 提供读取数据的相关接

function DataStream(data, start, end) {
    if (! (this instanceof DataStream))
        return new DataStream(data, start, end);

    this.data = data;
    this.pos = start;
    this.end = end;
    this.putLen = 0;
    this.haveError = (this.start >= this.end || this.end > data.length);
}

DataStream.prototype.getDataLen = function() {
    if (this.end >= this.pos) {
        return this.end - this.pos;
    }

    return 0;
}

DataStream.prototype.readUInt8 = function() {
    if (this.haveError || this.pos >= this.end) {
        this.haveError = true;
        return 0;
    }

    return this.data.readUInt8(this.pos++);
}

DataStream.prototype.readUInt16BE = function() {
    if (this.haveError || this.pos + 2 > this.end) {
       this.haveError = true;
       return 0;
    }

    var v = this.data.readUInt16BE(this.pos);
    this.pos += 2;
    return v;
}

DataStream.prototype.readUInt32BE = function() {
    if (this.haveError || this.pos + 4 > this.end) {
        this.haveError = true;
        return 0;
    }

    var v = this.data.readUInt32BE(this.pos);
    this.pos += 4;
    return v;
}

DataStream.prototype.readString = function(encoding, len) {
    if (this.haveError || this.pos + len > this.end) {
        this.haveError = true;
        return "";
    }

    var end = (len > 0) ? (this.pos + len) : this.end;
    var v = this.data.toString(encoding, this.pos, end);
    this.pos = end;
    return v;
}

DataStream.prototype.readBuf8 = function() {
    var len = this.readUInt8();
    if (0 === len) {
        return null;
    }

    var buf = new Buffer(len);
    this.copy(buf, 0, len);
    if (this.haveError) {
        return null;
    }

    var str = iconv.decode(buf, 'gbk')

    return str;
}

DataStream.prototype.copy = function(desBuf, desBufPos, len) {
    if (this.haveError || this.pos + len > this.end) {
        this.haveError = true;
        return;
    }

    var end = (len > 0) ? (this.pos + len) : this.end;
    this.data.copy(desBuf, desBufPos, this.pos, end);
    this.pos = end;
};

DataStream.prototype.getChar = DataStream.prototype.readUInt8;
DataStream.prototype.getShort = DataStream.prototype.readUInt16BE;
DataStream.prototype.getLong = DataStream.prototype.readUInt32BE;

DataStream.prototype.getSignedChar = function() {
    if (this.haveError || this.pos >= this.end) {
        this.haveError = true;
        return 0;
    }

    return this.data.readInt8(this.pos++);
}

DataStream.prototype.getSignedShort = function() {
    if (this.haveError || this.pos + 2 > this.end) {
       this.haveError = true;
       return 0;
    }

    var v = this.data.readInt16BE(this.pos);
    this.pos += 2;
    return v;
}

DataStream.prototype.getSignedLong = function() {
    if (this.haveError || this.pos + 4 > this.end) {
        this.haveError = true;
        return 0;
    }

    var v = this.data.readInt32BE(this.pos);
    this.pos += 4;
    return v;
}

DataStream.prototype.getString = DataStream.prototype.readBuf8;
DataStream.prototype.getString2 = function() {
    var len = this.getShort();
    if (0 == len) {
        return null;
    }

    var buf = new Buffer(len);
    this.copy(buf, 0, len);
    if (this.haveError) {
        return null;
    }

    var str = iconv.decode(buf, 'gbk')

    return str;
}

DataStream.prototype.getString4 = function() {
    var len = this.getLong();
    if (0 == len) {
        return null;
    }

    var buf = new Buffer(len);
    this.copy(buf, 0, len);
    if (this.haveError) {
        return null;
    }

    var str = iconv.decode(buf, 'gbk')

    return str;
}

DataStream.prototype.putChar = function(v) {
    var idx = this.pos + this.putLen;
    if (idx >= this.end)
        // 满了
        return false;

    this.data.writeUInt8(v, idx);
    this.putLen += 1;
    return true;
}

DataStream.prototype.putShort = function(v) {
    var idx = this.pos + this.putLen;
    if (idx + 1 >= this.end)
        // 满了
        return false;

    this.data.writeUInt16BE(v, idx);
    this.putLen += 2;
    return true;
}

DataStream.prototype.putLong = function(v) {
    var idx = this.pos + this.putLen;
    if (idx + 3 >= this.end)
        // 满了
        return false;

    this.data.writeUInt32BE(v, idx);
    this.putLen += 4;
    return true;
}

DataStream.prototype.putString = function(v) {
    if (typeof(v) == 'string') {
        v = iconv.encode(v, "gbk");
    }

    this.putChar(v.length);

    var idx = this.pos + this.putLen;
    if (idx + v.length > this.end)
        // 满了
        return false;

    v.copy(this.data, idx)
    this.putLen += v.length;
    return true;
}

DataStream.prototype.putString2 = function(v) {
    if (typeof(v) == 'string') {
        v = iconv.encode(v, "gbk");
    }

    this.putShort(v.length);

    var idx = this.pos + this.putLen;
    if (idx + v.length > this.end)
        // 满了
        return false;

    v.copy(this.data, idx)
    this.putLen += v.length;
    return true;
}

DataStream.prototype.putString4 = function(v) {
    if (typeof(v) == 'string') {
        v = iconv.encode(v, "gbk");
    }

    this.putLong(v.length);

    var idx = this.pos + this.putLen;
    if (idx + v.length > this.end)
        // 满了
        return false;

    v.copy(this.data, idx)
    this.putLen += v.length;
    return true;
}

DataStream.prototype.getPutLen = function() {
    return this.putLen;
}

module.exports = {
    create : function(data, start, end) { return new DataStream(data, start, end) },
};

