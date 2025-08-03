const fs = require("fs");

let userDatas = [];

const fileName = "data/list.json";

function verifyFileExists() {
    if (!fs.existsSync(fileName)) {
        fs.writeFileSync(fileName, "[]");
    }
}

function pushUserData(v) {
    verifyFileExists();
    //读取
    try {
        const data = fs.readFileSync(fileName, "utf8");
        const list = JSON.parse(data);
        console.log(list);
        userDatas = list.slice();
    } catch (err) {
        console.log("数据读取错误", err);
    }

    // 检查是否存在具有相同 gid 的对象
    const exists = userDatas.some((item) => item.account === v.account);

    // 如果不存在，则添加到数组中
    if (!exists) {
        userDatas.push(v);
    }

    //写入文件
    const jsonString = JSON.stringify(userDatas.slice(), null, 2);
    try {
        fs.writeFileSync(fileName, jsonString);
    } catch (err) {
        console.log("数据存储错误", err);
    }
}

function getUserDatas() {
    verifyFileExists();
    //读取
    try {
        const data = fs.readFileSync(fileName, "utf8");
        const list = JSON.parse(data);
        userDatas = list.slice();
    } catch (err) {
        console.log("数据读取错误", err);
    }
    return userDatas;
}

function removeUserDatas() {
    verifyFileExists();
    userDatas = [];
    //写入文件
    const jsonString = JSON.stringify(userDatas.slice(), null, 2);
    try {
        fs.writeFileSync(fileName, jsonString);
    } catch (err) {
        console.log("数据存储错误", err);
    }
}

//覆盖json文件的内容
function writeUserData(list) {
    if (typeof list != "object") {
        console.error("类型不是object");
    }
    removeUserDatas();
    //写入文件
    const jsonString = JSON.stringify(list, null, 2);
    try {
        fs.writeFileSync(fileName, jsonString);
    } catch (err) {
        console.log("数据存储错误", err);
    }
}

module.exports = {
    userDatas,
    getUserDatas,
    removeUserDatas,
    pushUserData,
    writeUserData,
};
