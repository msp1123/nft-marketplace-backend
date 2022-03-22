var CryptoJS = require("crypto-js");
const CONFIG = require("../configs/global.configs");

const encryptData = (text, key) => {
    return CryptoJS.AES.encrypt(text, key).toString()
}

const decryptData = (text, key) => {
    var bytes = CryptoJS.AES.decrypt(text, key);
    return bytes.toString(CryptoJS.enc.Utf8)
}

module.exports = {
    encryptData,
    decryptData
}