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

const {getDecimalTokenId, isEmpty, isNull, 
    ReE, ReS, ReF, to} = require('../services/utils.service')
    const {User, Token, Activity, Collection} = require('../models')
const {assetContract, marketContract} = require('../services/ethers.provider')

exports.create = async function (req, res) {
    
    let user = req.user;
    let name = req.body.name;
    let creator = user.address;
    let image = req.body.image;
    let amount = req.body.amount;
    let txHash = req.body.txHash;
    let tokenId = req.body.tokenId;
    let royalty = req.body.royalty || 0;
    let animation = req.body.animation_url;
    let description = req.body.description;
    let collectionName = req.body.collectionName;
    
    if(isNull(name)) return ReF(res, "Name")
    if(isNull(image)) return ReF(res, "Image")
    if(isNull(amount)) return ReF(res, "Quantity")
    if(isNull(tokenId)) return ReF(res, "Token Id")
    if(isNull(txHash)) return ReF(res, "Transaction Hash")
    if(isNull(collectionName)) return ReF(res, "Collection Name")
    
    let collectionQuery = {
        active: true,
        name: collectionName
    }

    let err, collection;
    [err, collection] = await to(Collection.findOne(collectionQuery));
    if(err) return ReE(res)
    
    if(!collection) return ReE(res, {
        message: "Collection not found"
    })

    if(collection.owner !== user.address) return ReE(res, {
        message: "You are not owner of this collection"
    })
    
    let tokenQuery = {
        tokenId: tokenId,
        chainId: collection.chainId,
        nftAddress: collection.address
    }

    let token;
    [err, token] = await to(Token.findOne(tokenQuery));
    if(err) return ReE(res)
    
    if(token) return ReE(res, {
        message: "Token already available in market"
    })
    
    let tokenInput = {
        collectionName: collectionName,
        nftAddress: collection.address,
        chainId: collection.chainId,
        description: description,
        animation_url: animation,
        tokenId: tokenId,
        creator: creator,
        royalty: royalty,
        txHash: txHash,
        amount: amount,
        image: image,
        name: name,
    };
    
    [err, token] = await to(Token.create(tokenInput));
    if(err) return ReE(res)
    
    return ReS(res, {
        message: "Token created successfully"
    })
}

exports.getTokenMetadata = async function (req, res) {
    
    let chainId = req.params.chainId;
    let tokenId = req.params.tokenId;
    let nftAddress = req.params.nftAddress;
    
    if(isNull(chainId)) return ReF(res, "Chain Id")
    if(isNull(tokenId)) return ReF(res, "Token Id")
    if(isNull(nftAddress)) return ReF(res, "NFT Address")
    if(!isAddress(nftAddress)) return ReF(res, "Valid NFT Address")
    
    if(tokenId.length >= 30){
        tokenId = getDecimalTokenId(tokenId)
    }
    
    let query = {
        nftAddress: {
            '$regex': `^${nftAddress}$`,
            $options: 'i'
        },
        chainId: chainId,
        tokenId: tokenId
    }
    
    let err, token;
    [err, token] = await to(Token.findOne(query));
    if(err) return ReE(res)
    
    if(!token){
        return ReE(res, {
            message: "Token not found"
        }, HttpStatus.NOT_FOUND)
    }
    
    let tokenModel = {
        name: token.name,
        image: token.image,
        tokenId: token.tokenId,
        attributes: token.attributes,
        description: token.description,
        external_url: token.external_url,
        animation_url: token.animation_url,
    };
    
    return ReS(res, tokenModel)
}

exports.getTokenId = async function (req, res) {
    
    let chainId = req.params.chainId;
    let nftAddress = req.params.nftAddress;
    
    if(isNull(chainId)) return ReF(res, "Chain Id")
    if(isNull(nftAddress)) return ReF(res, "NFT Address")
    if(!isAddress(nftAddress)) return ReF(res, "Valid NFT Address")
    
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
        status: 'Minted',
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
        status: 'Listed',
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
        status: 'Bought',
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
        status: 'Listed'
    };

    [err, activity] = await to(Activity.findOne(activityQuery));
    if (err) throw err
    
    if(!activity) throw new Error(`#Buy consumer: Activity not found ${JSON.stringify(activityQuery)}`)
    
    activity.status = 'Sold';
    [err, activity] = await to(activity.save())
    if (err) throw err

    logger.info(`Token Bought by: ${owner}, tokenId: ${tokenId}, price: ${price}, tx: ${txHash}`);
}
