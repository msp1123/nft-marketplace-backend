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
const {mintEventChannel, listEventChannel, buyEventChannel} = require('../services/queue.service')
const {isEmpty, isNull, ReE, ReS, ReF, to, signJWT, waitFor} = require('../services/utils.service')

exports.minted = async function (
    nftAddress, tokenId, amount, owner, txHash, chainId) {

    if (!isAddress(nftAddress)) throw new Error("Invalid nftAddress")
    if (isNull(tokenId)) throw new Error("No tokenId found")
    if (isNull(amount)) throw new Error("No amount found")
    if (isNull(owner)) throw new Error("No owner found")
    if (isNull(txHash)) throw new Error("No txHash found")
    if (isNull(chainId)) throw new Error("No chainId found")

}

exports.pushMintEvent = async (
    nftAddress, tokenId, amount, owner, txHash, chainId) => {

    let event = {
        nftAddress: nftAddress,
        tokenId: tokenId,
        amount: amount,
        owner: owner,
        txHash: txHash,
        chainId: chainId
    }
    
    let channel = await mintEventChannel();
    if(!channel){
        logger.info(`Can not get mint event channel`)   
    }

    let message = JSON.stringify(event)
    channel.sendToQueue(CONFIG.mintedQueueName, Buffer.from(message))
    console.log('[x] Mint event sent to queue with message %s', message)
}

exports.pushListedEvent = async (
    standard, nftAddress, tokenId, itemId, amount, price, txHash, chainId) => {

    let event = {
        standard: standard,
        nftAddress: nftAddress,
        tokenId: tokenId,
        itemId: itemId,
        amount: amount,
        price: price,
        txHash: txHash,
        chainId: chainId
    }
    
    let channel = await listEventChannel();
    if(!channel){
        logger.info(`Can not get list event channel`)   
    }

    let message = JSON.stringify(event)
    channel.sendToQueue(CONFIG.listedQueueName, Buffer.from(message))
    console.log('[x] Listed event sent to queue with message %s', message)
}

exports.pushBoughtEvent = async (
    standard, nftAddress, tokenId, itemId, amount, price, owner, txHash, chainId) => {

    let event = {
        standard: standard,
        nftAddress: nftAddress,
        tokenId: tokenId,
        itemId: itemId,
        amount: amount,
        price: price,
        owner: owner,
        txHash: txHash,
        chainId: chainId
    }
    
    let channel = await buyEventChannel();
    if(!channel){
        logger.info(`Can not get buy event channel`)   
    }

    let message = JSON.stringify(event)
    channel.sendToQueue(CONFIG.boughtQueueName, Buffer.from(message))
    console.log('[x] Bought event sent to queue with message %s', message)
}
