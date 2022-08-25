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

const {User, Token, Queue} = require('../models')
const QueueService = require('../services/queue.service')
const {isEmpty, isNull, ReE, ReS, ReF, to, signJWT, waitFor} = require('../services/utils.service')

const insertToQueue = async function (txHash){
    
    if(isNull(txHash)) return false
    
    let query = {
        active: true,
        txHash: txHash
    }
    
    let err, queueTx;
    [err, queueTx] = await to(Queue.findOne(query));
    if (err) return false
    if(queueTx) return false
    
    let newQueueTx;
    [err, newQueueTx] = await to(Queue.create({txHash: txHash}));
    if (err) return false
    return true
}

exports.pushMintEvent = async (
    nftAddress, tokenId, amount, owner, txHash, chainId, timestamp) => {

    let event = {
        nftAddress: nftAddress,
        tokenId: parseInt(tokenId),
        amount: parseInt(amount),
        owner: owner,
        txHash: txHash,
        chainId: chainId,
        timestamp: timestamp
    }
    
    let channel = await QueueService.mintEventChannel;
    if(!channel){
        logger.error(`#Mint event: Send to queue failed with: ${JSON.stringify(event)}`)
        return
    }
    
    let status = await insertToQueue(txHash)
    if(!status) return

    let message = JSON.stringify(event)
    channel.sendToQueue(CONFIG.mintedQueueName, Buffer.from(message))
    logger.info('[x] Mint event sent to queue with message %s', message)
}

exports.pushListedEvent = async (
    standard, nftAddress, tokenId, itemId, amount, price, owner, txHash, chainId, timestamp) => {

    let event = {
        standard: parseInt(standard),
        nftAddress: nftAddress,
        tokenId: parseInt(tokenId),
        itemId: parseInt(itemId),
        amount: parseInt(amount),
        price: parseFloat(price),
        owner: owner,
        txHash: txHash,
        chainId: chainId,
        timestamp: timestamp
    }
    
    let channel = await QueueService.listEventChannel;
    if(!channel){
        logger.error(`#List event: Send to queue failed with: ${JSON.stringify(event)}`)
        return
    }
    let status = await insertToQueue(txHash)
    if(!status) return
    
    let message = JSON.stringify(event)
    channel.sendToQueue(CONFIG.listedQueueName, Buffer.from(message))
    logger.info('[x] Listed event sent to queue with message %s', message)
}

exports.pushBoughtEvent = async (
    standard, nftAddress, tokenId, itemId, amount, price, owner, txHash, chainId, timestamp) => {

    let event = {
        standard: parseInt(standard),
        nftAddress: nftAddress,
        tokenId: parseInt(tokenId),
        itemId: parseInt(itemId),
        amount: parseInt(amount),
        price: parseFloat(price),
        owner: owner,
        txHash: txHash,
        chainId: chainId,
        timestamp: timestamp
    }
    
    let channel = await QueueService.buyEventChannel;
    if(!channel){
        logger.error(`#Buy event: Send to queue failed with: ${JSON.stringify(event)}`)
        return
    }

    let status = await insertToQueue(txHash)
    if(!status) return
    
    let message = JSON.stringify(event)
    channel.sendToQueue(CONFIG.boughtQueueName, Buffer.from(message))
    logger.info('[x] Bought event sent to queue with message %s', message)
}
