const Crypto = require('crypto-js')

exports.encrypt = (data,key) => {
    return Crypto.AES.encrypt(data,key).toString();
}

exports.decrypt = (data,key) => {
    return Crypto.AES.decrypt(data,key).toString(Crypto.enc.Utf8);
}