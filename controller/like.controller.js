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

const {User, Token, Activity, Collection, TokenLikes} = require('../models')
const {isEmpty, isNull, ReE, ReS, ReF, to} = require('../services/utils.service')

exports.likeToken = async function (req, res) {

    let user = req.user;
    let tokenId = req.body.tokenId;

    if (isNull(tokenId)) return ReF(res, 'Token Id')

    let query = {
        active: true,
        _id: tokenId
    }

    let err, token;
    [err, token] = await to(Token.findOne(query));
    if (err) return ReE(res)

    if (!token) return ReE({
        message: 'Token not found'
    })

    let options = {
        active: true,
        user: user._id,
        token: token._id,
    };

    let like;
    [err, like] = await to(TokenLikes.findOne(options));
    if (err) return ReE(res)

    if (like) ReE(res, {
        message: 'You already liked this token'
    })

    [err, like] = await to(TokenLikes.create(options));
    if (err) return ReE(res)

    token.likes += 1;
    [err, token] = await to(token.save());
    if (err) return ReE(res)

    return ReS(res, {
        message: "Liked successfully"
    })
}

exports.dislikeToken = async function (req, res) {

    let user = req.user;
    let tokenId = req.body.tokenId;

    if (isNull(tokenId)) return ReF(res, 'Token Id')

    let query = {
        active: true,
        _id: tokenId
    }

    let err, token;
    [err, token] = await to(Token.findOne(query));
    if (err) return ReE(res)

    if (!token) return ReE({
        message: 'Token not found'
    })

    let options = {
        active: true,
        user: user._id,
        token: token._id,
    };

    let like;
    [err, like] = await to(TokenLikes.findOne(options));
    if (err) return ReE(res)

    if (!like) ReE(res, {
        message: "You haven't liked this token."
    })

    like.active = false;
    [err, like] = await to(like.save());
    if (err) return ReE(res)

    token.likes -= 1;
    [err, token] = await to(token.save());
    if (err) return ReE(res)

    return ReS(res, {
        message: "Disliked successfully"
    })
}

exports.getTokenLikes = async function (req, res) {

    let tokenId = req.params.id;
    let page = req.query.page || 1
    let sort = req.query.sort || 'asc'
    let limit = req.query.limit || 10

    if (isNull(tokenId)) return ReF(res, 'Token Id')

    let query = {
        active: true,
        token: tokenId
    };

    let options = {
        page: page,
        limit: limit,
        populate: [
            {
                path: 'user',
                select: CONFIG.userPopulatable
            },
        ],
        sort: {
            createdAt: sort
        },
    }

    let err, likes;
    [err, likes] = await to(TokenLikes.paginate(query, options));
    if (err) return ReE(res)
    if (isEmpty(likes.docs)) return ReE(res, {
        message: "No likes found for this token"
    })

    Object.defineProperty(likes, 'likes',
        Object.getOwnPropertyDescriptor(likes, 'docs'));
    delete likes['docs'];
    return ReS(res, likes)
}

exports.getUserLikes = async function (req, res) {

    let user = req.user;
    let page = req.query.page || 1
    let sort = req.query.sort || 'asc'
    let limit = req.query.limit || 10

    let query = {
        active: true,
        userId: userId
    };

    let options = {
        page: page,
        limit: limit,
        populate: {
            path: 'token'
        },
        sort: {
            createdAt: sort
        },
    }

    let err, likes;
    [err, likes] = await to(Likes.paginate(query, options));
    if (err) return ReE(res)
    if (isEmpty(likes.docs)) return ReE(res, {
        message: "You haven't liked any token yet"
    })

    Object.defineProperty(likes, 'likes',
        Object.getOwnPropertyDescriptor(likes, 'docs'));
    delete likes['docs'];
    return ReS(res, likes)
}
