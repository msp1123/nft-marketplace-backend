const jwt = require('jsonwebtoken')
const CONFIG = require('../configs/global.configs')

const signJWT = function (userId) {
    let expiration = CONFIG.jwt_expiration
    return 'Bearer ' + jwt.sign({uid: userId}, CONFIG.jwt_encryption,
        // {expiresIn: expiration}
    )
}

module.exports.signJWT = signJWT