const moment = require('moment')
const {ethers} = require('ethers')
const {v4: uuidv4} = require('uuid')
const validator = require('validator')
const HttpStatus = require('http-status')
const CONFIG = require("../configs/global.configs")

const {isAddress} = ethers.utils
const {isEmail, isStrongPassword} = validator
const ObjectId = require('mongoose').Types.ObjectId

const {User} = require('../models')
const {isEmpty, isNull, ReE, ReS, ReF, to, signJWT} = require('../services/utils.service')

//global constants
const regexp = /^[a-zA-Z0-9-_]+$/;

exports.login = async function (req, res, next) {
    let address = req.body.address
    let message = req.body.message
    let signature = req.body.signature
    if (!signature) return ReF(res, "Address")
    if (!message) return ReF(res, "Message")
    if (!signature) return ReF(res, "Signature")
    
    if(!isAddress(address)) return ReE(res, {
        message: "Invalid address"
    })

    try {
        var signedAddress = await ethers.utils.verifyMessage(message, signature)
    } catch (error) {
        return ReE(res, {
            message: "Invalid signature"
        })
    }

    if (address != signedAddress) {
        return ReE(res, {
            message: "Signature doesn't match."
        })
    }
    let query = {
        active: true,
        address: address
    }
    let err, user;
    [err, user] = await to(User.findOne(query));
    if (err) return ReE(res, {
        message: "Auth failed. please contact support"
    });
    if (!user) return ReE(res, {
        message: "User not found"
    })

    if (user) {
        return ReS(res, {
            message: "Logged in successfully",
            token: signJWT(address),
            user: user
        });
    }
}

exports.getUser = async function(req, res) {
    
    let value = req.params.id;
    if (isNull(value)) return ReF(res, "Address or User name")
    
    let query = {
        active: true
    }
    
    if(isAddress(value)){
        query.address = value;
    }else {
        query.name = value;
    }
    
    let err, user;
    [err, user] = await to(User.findOne(query))
    if (err) {
        return ReE(res)
    }
    
    if(user){
        return ReS(res, {
            user: user
        })
    }
    
    if(!user && isAddress(value)){
        [err, user] = await to(User.create({address: value}))
        if (err) {
            return ReE(res)
        }
        
        return ReS(res, {
            message: "User registered successfully",
            user: user
        })
    }
    
    if(!user){
        return ReE(res, {
            message: "User not found" 
        })
    }
}

exports.updateUser = async function(req, res) {
    
    let body = req.body;
    let user = req.user;
    
    if (isEmpty(body)) return ReE(res, {
        message: "No input found to update"
    })
    
    if(!isNull(body.name)){
        
        if(body.name.search(regexp) === -1){
            return ReE(res, {
                message: "Invalid name format"
            })
        }
        
        let err, tempUser;
        [err, tempUser] = await to(User.findOne({name: body.name})
            .collation( { locale: 'en', strength: 2 } ))
        if (err) {
            return ReE(res)
        }
        
        if(tempUser && tempUser._id.toString() == user._id.toString()){
            return ReE(res, {
                message: "You already using this name."
            })
        }
        
        if(tempUser){
            return ReE(res, {
                message: "Name is already taken."
            })
        }
    }
    
    CONFIG.editableUserFields.forEach(function (field) {
        if (typeof field === "string" && body[field] !== undefined) {
            if (isEmpty(body[field])) {
                var newFields = Object.keys(body[field]);
                var ObjName = body[field].name;
                newFields.map((field2) => {
                    user[field][field2] = body[field][field2];
                });
                return;
            }
            user[field] = body[field];
        }
    });
    
    let err;
    [err, user] = await to(user.save())
    if (err) {
        return ReE(res)
    }
    
    return ReS(res, {
        message: "User updated.",
        user: user
    })
}

exports.verifyName = async function (req, res) {
    
    let name = req.params.id;
    let user = req.user;
    
    if(isNull(name)) return ReF(res, 'Name')
    
    let err, tempUser;
    [err, tempUser] = await to(User.findOne({name: name})
        .collation( { locale: 'en', strength: 2 } ))
    if (err) {
        return ReE(res)
    }
    
    if(tempUser && tempUser._id.toString() == user._id.toString()){
        return ReE(res, {
            message: "You already using this name."
        })
    }
    
    if(tempUser){
        return ReE(res, {
            message: "Name is already taken."
        })
    }
    
    return ReS(res, {
        message: "Name is available"
    })
}