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

const {User, Token, Activity} = require('../models')
const {isEmpty, isNull, ReE, ReS, ReF, to} = require('../services/utils.service')
const {assetContract, marketContract} = require('../services/ethers.provider')

exports.create = async function (req, res) {
    
    let user = req.user;
    let name = req.body.name;
    let creator = user.address;
    let image = req.body.image;
    let amount = req.body.amount;
    let txHash = req.body.txHash;
    let chainId = req.body.chainId;
    let tokenId = req.body.tokenId;
    let royalty = req.body.royalty || 0;
    let attributes = req.body.attributes;
    let nftAddress = req.body.nftAddress;
    let animation = req.body.animation_url;
    let description = req.body.description;
    
    if(isNull(name)) return ReF(res, "Name")
    if(isNull(image)) return ReF(res, "Image")
    if(isNull(amount)) return ReF(res, "Quantity")
    if(isNull(chainId)) return ReF(res, "Chain Id")
    if(isNull(tokenId)) return ReF(res, "Token Id")
    if(isNull(nftAddress)) return ReF(res, "NFT Address")
    if(isNull(txHash)) return ReF(res, "Transaction Hash")
    
    let tokenQuery = {
        chainId: chainId,
        tokenId: tokenId,
        nftAddress: nftAddress
    }
    
    let err, token;
    [err, token] = await to(Token.findOne(tokenQuery));
    if(err) return ReE(res)
    
    if(token) return ReE(res, {
        message: "Token already available in market"
    })
    
    let tokenInput = {
        nftAddress: nftAddress,
        chainId: chainId,
        tokenId: tokenId,
        amount: amount,
        creator: creator,
        royalty: royalty,
        name: name,
        description: description,
        image: image,
        animation_url: animation,
        txHash: txHash,
    };
    
    [err, token] = await to(Token.create(tokenInput));
    if(err) return ReE(res)
    
    return ReS(res, {
        message: "Token created successfully"
    })
}

exports.getTokenId = async function (req, res) {
    
    let chainId = req.params.chainId;
    let nftAddress = req.params.nftAddress;
    
    if(isNull(chainId)) return ReF(res, "Chain Id")
    if(isNull(nftAddress)) return ReF(res, "NFT Address")
    
    let tokenId = Math.floor(Math.random() * 99999999999999999999);
    while(tokenId.toString().length != 20){
        tokenId = Math.floor(Math.random() * 99999999999999999999);
    }
    
    let query = {
        nftAddress: nftAddress,
        chainId: chainId,
        tokenId: tokenId
    }
    
    let err, token;
    [err, token] = await to(Token.findOne(query));
    if(err) return ReE(res)
    
    while(token){
        tokenId = Math.floor(Math.random() * 99999999999999999999);
        query.tokenId = tokenId;
        while(tokenId.toString().length != 20){
            tokenId = Math.floor(Math.random() * 99999999999999999999);
            query.tokenId = tokenId;
        }
        [err, token] = await to(Token.findOne(query));
        if(err) return ReE(res)
    }
    
    return ReS(res, {
        tokenId: tokenId
    })
}

exports.minted = async function (
    nftAddress, tokenId, amount, owner, txHash, chainId) {

    if (!isAddress(nftAddress)) throw new Error("Invalid nftAddress")
    if (isNull(tokenId)) throw new Error("No tokenId found")
    if (isNull(amount)) throw new Error("No amount found")
    if (isNull(owner)) throw new Error("No owner found")
    if (isNull(txHash)) throw new Error("No txHash found")
    if (isNull(chainId)) throw new Error("No chainId found")

    let query = {
        nftAddress: nftAddress,
        tokenId: tokenId,
        chainId: chainId
    };

    let err, token;
    [err, token] = await to(Token.findOne(query));
    if (err) throw err

    if (!token) throw new Error(`#Mint consumer: Token not found: ${JSON.stringify(query)}`)

    let input = {
        status: 'MINTED',
        address: owner,
        nftAddress: nftAddress,
        chainId: chainId,
        tokenId: tokenId,
        token: ObjectId(token._id),
        amount: amount,
        standard: 1155,
        txHash: txHash
    }

    let activity;
    [err, activity] = await to(Activity.create(input))
    if (err) throw err

    logger.info(`Token minted on: ${nftAddress}, tokenId: ${tokenId}, by: ${owner}, tx: ${txHash}`);
}

exports.listed = async function (
    standard, nftAddress, tokenId, itemId, amount, price, owner, txHash, chainId) {

    if (!isAddress(nftAddress)) throw new Error("Invalid nftAddress")
    if (isNull(standard)) throw new Error("No standard found")
    if (isNull(tokenId)) throw new Error("No tokenId found")
    if (isNull(amount)) throw new Error("No amount found")
    if (isNull(owner)) throw new Error("No owner found")
    if (isNull(txHash)) throw new Error("No txHash found")
    if (isNull(chainId)) throw new Error("No chainId found")
    if (isNull(itemId)) throw new Error("No itemId found")
    if (isNull(price)) throw new Error("No price found")

    let query = {
        nftAddress: nftAddress,
        tokenId: tokenId,
        chainId: chainId
    };

    let err, token;
    [err, token] = await to(Token.findOne(query));
    if (err) throw err

    if (!token) throw new Error(`#List consumer: Token not found: ${JSON.stringify(query)}`)

    let input = {
        status: 'LISTED',
        address: owner,
        standard: standard,
        nftAddress: nftAddress,
        chainId: chainId,
        tokenId: tokenId,
        itemId: itemId,
        token: ObjectId(token._id),
        amount: amount,
        price: price,
        txHash: txHash
    }

    let activity;
    [err, activity] = await to(Activity.create(input))
    if (err) throw err

    logger.info(`Token listed by: ${owner}, tokenId: ${tokenId}, price: ${price}, tx: ${txHash}`);
}

exports.bought = async function (
    standard, nftAddress, tokenId, itemId, amount, price, owner, txHash, chainId) {

    if (!isAddress(nftAddress)) throw new Error("Invalid nftAddress")
    if (isNull(standard)) throw new Error("No standard found")
    if (isNull(tokenId)) throw new Error("No tokenId found")
    if (isNull(amount)) throw new Error("No amount found")
    if (isNull(owner)) throw new Error("No owner found")
    if (isNull(txHash)) throw new Error("No txHash found")
    if (isNull(chainId)) throw new Error("No chainId found")
    if (isNull(itemId)) throw new Error("No itemId found")
    if (isNull(price)) throw new Error("No price found")

    let query = {
        nftAddress: nftAddress,
        tokenId: tokenId,
        chainId: chainId
    };

    let err, token;
    [err, token] = await to(Token.findOne(query));
    if (err) throw err

    if (!token) throw new Error(`#Buy consumer: Token not found: ${JSON.stringify(query)}`)

    let input = {
        status: 'BOUGHT',
        address: owner,
        standard: standard,
        nftAddress: nftAddress,
        chainId: chainId,
        tokenId: tokenId,
        itemId: itemId,
        token: ObjectId(token._id),
        amount: amount,
        price: price,
        txHash: txHash
    }

    let activity;
    [err, activity] = await to(Activity.create(input))
    if (err) throw err

    let activityQuery = {
        nftAddress: nftAddress,
        chainId: chainId,
        tokenId: tokenId,
        itemId: itemId,
        status: 'LISTED'
    };

    [err, activity] = await to(Activity.findOne(activityQuery));
    if (err) throw err
    
    if(!activity) throw new Error(`#Buy consumer: Activity not found ${JSON.stringify(activityQuery)}`)
    
    activity.status = 'SOLD';
    [err, activity] = await to(activity.save())
    if (err) throw err

    logger.info(`Token Bought by: ${owner}, tokenId: ${tokenId}, price: ${price}, tx: ${txHash}`);
}
