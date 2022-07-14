const moment = require('moment')
const {ethers} = require('ethers')
const {v4: uuidv4} = require('uuid');
const validator = require('validator')
const HttpStatus = require('http-status')
const CONFIG = require("../configs/global.configs");

const {isAddress} = ethers.utils
const {isEmail, isStrongPassword} = validator
const ObjectId = require('mongoose').Types.ObjectId

const {User} = require('../models')
const {isEmpty, isNull, ReE, ReS, ReF, to} = require('../services/utils.service');

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

exports.verifySignature = async function (signature) {
    let time = moment().utc().startOf('day').unix();
    let timeHash = ethers.utils.solidityKeccak256(['uint'], [time])
    let message =  `Hello! Welcome to NFT Marketplace
                    This request is only to verify your address with us and this will not trigger a blockchain transaction.
                    Hash: ${timeHash}`
    let hash = ethers.utils.solidityKeccak256(['string'], [CONFIG.signature_message])
    let address = await ethers.utils.verifyMessage(hash, signature)
    return address
}