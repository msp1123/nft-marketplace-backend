const jwt = require('jsonwebtoken')
const CONFIG = require('../configs/global.configs')

// The signJwt function is used to get a signed jwt token with the address 
const signJWT = function (address) {
    let expiration = CONFIG.jwt_expiration
    return 'Bearer ' + jwt.sign({active: true, address: address}, CONFIG.jwt_encryption)
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

    let output = {success: true}

    if (typeof data == 'object') {
        output = Object.assign(data, output)//merge the objects
    }
    res.statusCode = 200
    return res.json(output)
};

// used to return failure response
const ReE = (res, data, code) => {

    let output = {success: false}

    if (typeof data == 'object') {
        output = Object.assign(data, output)//merge the objects
    }

    typeof code !== 'undefined'
        ? res.statusCode = code
        : res.statusCode = 400

    if (typeof data === 'undefined') {
        output.message = 'Unknown error occured. Please contact support.'
    }

    return res.json(output)
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
