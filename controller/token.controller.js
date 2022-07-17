const moment = require('moment')
const {ethers} = require('ethers')
const {v4: uuidv4} = require('uuid')
const validator = require('validator')
const HttpStatus = require('http-status')
const CONFIG = require("../configs/global.configs")
const {logger} = require('../configs/winston.config')

const {isAddress} = ethers.utils
const {isEmail, isStrongPassword} = validator
const ObjectId = require('mongoose').Types.ObjectId

const {User, Token} = require('../models')
const {isEmpty, isNull, ReE, ReS, ReF, to} = require('../services/utils.service')

exports.minted = async function (
    nftAddress, tokenId, amount, owner, txHash, chainId) {

    if (!isAddress(nftAddress)) throw new Error("Invalid nftAddress")
    if (isNull(tokenId)) throw new Error("No tokenId found")
    if (isNull(amount)) throw new Error("No amount found")
    if (isNull(owner)) throw new Error("No owner found")
    if (isNull(txHash)) throw new Error("No txHash found")
    if (isNull(chainId)) throw new Error("No chainId found")

}
