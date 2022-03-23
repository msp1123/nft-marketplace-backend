const ObjectId = require('mongoose').Types.ObjectId
const HttpStatus = require('http-status')

const {isNull, isEmpty} = require('../utils/validations')
const {to, ReE, ReS, ReF} = require('../services/response.services')
const Nft = require('../models/nft.model')
const Users = require('../models/user.model');
const Likes = require('../models/likes.model')
const CONFIG = require('../configs/global.configs');
const appConfigs = require('../configs/app.config')

const getNft = async function (req, res) {

    let user = req.user;
    let nftId = req.params.id;
    let userId req.user._id;

    if (isNull(nftId)) return ReF(res, "Nft Id")

    if (!ObjectId.isValid(nftId)) return ReE(res, {
        message: "Enter a valid Nft Id"
    }, HttpStatus.BAD_GATEWAY)

    let nftQuery = {
        active: true,
        _id: nftId
    }
    let likesQuery = {
        active: true,
        nftId: nftId,
        userId: userId
    }

    let err, nft;
    [err, nft] = await to(Nft.findOne(nftQuery))
    if (err) {
        return ReE(res, {
            message: "Unknown error occured. Please contact support.",
            error: err
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    if (!nft) {
        return ReE(res, {
            message: "Nft not found."
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    let likes;
    [err, likes] = await to(Likes.findOne(likesQuery))
    if (err) {
        return ReE(res, {
            message: "Unknown error occured. Please contact support.",
            error: err
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    if (likes) {
        nft.isLiked = true;
    } else {
        nft.isLiked = false;
    }

    return ReS(res, {result: nft})
}
module.exports.getNft = getNft

const getAllNFT = async function (req, res) {

    let authUser = req.user;
    let userId = authUser._id;

    let page = req.query.page || 1
    let limit = req.query.limit || 10
    let status = req.query.status || 'ONSALE'
    let price = req.query.price
    let time = req.query.time

    let options = {
        page: page,
        limit: limit,
        populate: [
            {
                path: 'userId',
                select: appConfigs.userPopulatable
            },
        ],
        sort: {
            createdAt: 'asc'
        },
    }

    var query = {
        active: true,
        status: status
    }

    if (!isNull(time)) {
        options.sort.createdAt = time
        delete options.sort.tokenPrice
    }

    if (!isNull(price)) {
        options.sort.tokenPrice = price
        delete options.sort.createdAt
    }

    let err, nfts, promises;
    [err, nfts] = await to(Nft.paginate(query, options))
    if (err) {
        return ReE(res, {
            message: "Unknown error occured. Please contact support.",
            error: err
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    if (nfts.length > 0) {
        promises = await Promise.all(
            nfts.map(async (nft) => {
                let likes;
                
                let likesQuery = {
                    active: true,
                    nftId: nft._id,
                    userId: userId
                }
                
                [err, likes] = await to(Likes.findOne(likesQuery))
                if (err) {
                    return ReE(res, {
                        message: "Unknown error occured. Please contact support.",
                        error: err
                    }, HttpStatus.INTERNAL_SERVER_ERROR)
                }
            
                if (likes) {
                    nft.isLiked = true;
                } else {
                    nft.isLiked = false;
                }
            })
        );
    }
    return ReS(res, {nfts: nfts})
}

module.exports.getAllNFT = getAllNFT
