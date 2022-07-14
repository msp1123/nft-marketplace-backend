const jwt = require('jsonwebtoken')
const CONFIG = require('../configs/global.configs')

// The signJwt function is used to get a signed jwt token with the address 
const signJWT = function (address) {
    let expiration = CONFIG.jwt_expiration
    return 'Bearer ' + jwt.sign({address: address}, CONFIG.jwt_encryption)
}

// used to check whether the array is empty or not
function isEmpty(obj) {
    return !Object.keys(obj).length > 0;
}

// used to verify the field is null or undefined or empty value
function isNull(field) {
    return typeof field === 'undefined' || field === '' || field === null
}

// This function is used to handle the prmoises
async function to(promise) {
    return await
        promise
            .then(data => {
                return [null, data]
            }).catch(err => {
                return [err]
            });
}

// used to return success response
const ReS = (res, data) => {

    res.statusCode = 200;
    return res.json({
        success: true,
        result: data
    })
};

// used to return failure response
const ReE = (res, data, code) => {

    typeof code !== 'undefined'
        ? res.statusCode = code
        : res.statusCode = 400;

    return res.json({
        success: false,
        result: data
    })
};

// used when a field is required on an API call
const ReF = (res, field) => {

    res.statusCode = 400;
    return res.json({
        success: false,
        message: `${field} is required`
    })
};

module.exports = {
    signJWT,
    isEmpty,
    isNull,
    ReE,
    ReS,
    ReF,
    to
}
