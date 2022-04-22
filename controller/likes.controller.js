const {v4: uuidv4} = require('uuid');
const Nft = require('../models/nft.model');
const Users = require('../models/user.model');
const Likes = require('../models/likes.model');
const CONFIG = require('../configs/global.configs');
const ObjectId = require('mongoose').Types.ObjectId
const HttpStatus = require('http-status')
const appConfigs = require('../configs/app.config')
const {isNull, isEmpty} = require('../utils/validations')
const {to, ReE, ReS, ReF} = require('../utils/response')

const likeNft = async function (req, res) {
    
    let nftId = req.params.id;
    let userId = req.user._id;

    if (isNull(nftId)) return ReF(res, 'NFT Id')
    
    let query = {
        active: true,
        _id: nftId
    }
    
    let err, nft;
    [err, nft] = await to(Nft.findOne(query));
    if (err) {
        return ReE(res, {
            message: "Unknown error occured. Please contact support.",
            error: err
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }
    if (!nft) {
        return ReE({
            message: 'Nft not found'
        }, HttpStatus.BAD_REQUEST)
    }
    
    let options = {
        active: true,
        userId: userId,
        nftId: nftId,
    };

    let like;
    [err, like] = await to(Likes.findOne(options));
    if (err) {
        return ReE(res, {
            message: "Unknown error occured. Please contact support.",
            error: err
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }
    
    if (!like) {
        [err, like] = await to(Likes.create(options));
        if(err){
            return ReE(res, {
                message: "Unknown error occured. Please contact support.",
                error: err
            }, HttpStatus.INTERNAL_SERVER_ERROR)
        }

        [err, nft] = await to(Nft.updateOne(
            {_id: nftId},
            {$inc: {likes: 1}}
        ));
        if (err) {
            return ReE(res, {
                message: "Unknown error occured. Please contact support.",
                error: err
            }, HttpStatus.INTERNAL_SERVER_ERROR)
        }

        return ReS(res,{
            message: "Liked successfully"
        }, HttpStatus.OK)
    }

    return ReE(res, {
        message: 'You already liked this nft'
    }, HttpStatus.BAD_REQUEST)
}
module.exports.likeNft = likeNft

const getNftLikes = async function (req, res) {

    let nftId = req.params.id;
    if (isNull(nftId)) return ReF(res, 'NFT Id')
    let page = req.query.page || 1
    let limit = req.query.limit || 10
    
    let query = {
        active: true,
        nftId: nftId
    };
    
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

    let err, likes;
    [err, likes] = await to(Likes.paginate(query, options));
    if (err) {
        return ReE(res, {
            message: "Unknown error occured. Please contact support.",
            error: err
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }
    if(isEmpty(likes.docs)){
        return ReE(res, {
            message: "No likes found for this Nft"
        }, HttpStatus.BAD_REQUEST)
    }

    return ReS(res,{
        message: "Likes Found",
        likes: likes
    }, HttpStatus.OK)
}
module.exports.getNftLikes = getNftLikes

const getUserLikes = async function (req, res) {

    let userId = req.user._id;
    let page = req.query.page || 1
    let limit = req.query.limit || 10
    
    let query = {
        active: true,
        userId: userId
    };
    
    let options = {
        page: page,
        limit: limit,
        populate: {
            path: 'nftId'
        },
        sort: {
            createdAt: 'asc'
        },
    }

    let err, likes;
    [err, likes] = await to(Likes.paginate(query, options));
    if (err) {
        return ReE(res, {
            message: "Unknown error occured. Please contact support.",
            error: err
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }
    if(isEmpty(likes.docs)){
        return ReE(res, {
            message: "You haven't liked any nft yet"
        }, HttpStatus.BAD_REQUEST)
    }

    return ReS(res, {
        message: "Your likes found",
        likes: likes
    }, HttpStatus.OK)
}
module.exports.getUserLikes = getUserLikes