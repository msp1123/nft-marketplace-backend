const bcrypt = require('bcryptjs')

const getPasswordHash = async function (password) {
    let salt, hash;

    salt = await bcrypt.genSalt(10)

    hash = await bcrypt.hash(password, salt)
    return hash
}

module.exports.getPasswordHash = getPasswordHash

const comparePassword = async function (password, hash) {
    let pass;

    pass = await bcrypt.compare(password, hash)
    if (!pass) return false;

    return true
}

module.exports.comparePassword = comparePassword

function isNull(field) {
    return typeof field === 'undefined' || field === '' || field === null
}

module.exports.isNull = isNull

function isEmpty(obj) {
    return !Object.keys(obj).length > 0;
}

module.exports.isEmpty = isEmpty
