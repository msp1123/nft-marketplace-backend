const {ethers} = require('ethers')
const {isNull, isEmpty} = require('../utils/validations')
const {to, ReE, ReS, ReF} = require('../utils/response')
const Nft = require('../models/nft.model')
const Token = require('../models/token.model')
const HttpStatus = require('http-status')
const {ObjectId} = require('mongoose').Types

const createToken = async function (tokenId) {
    
    var query = {
        active: true,
        tokenId: tokenId
    }
    
    let err, nft;
    [err, nft] = await to(Nft.findOne(query));
    if (err) {
        throw err
    }
    
    if(!nft){
        throw new Error(`Unable to find nft with that Id: ${tokenId}`)
    }
    
    let videoEntry = nft.attachments.find(a=>a.fileType === "VIDEO")
    
    let newToken = {
        name: `${nft.title}: #${tokenId}`,
        tokenId: tokenId,
        nft: nft._id,
        description:nft.description,
        image: nft.previewImage
    }
    
    if(!isNull(videoEntry)){
        newToken.animation_url = videoEntry.url
    }
    
    let token;
    [err, token] = await to(Token.create(newToken))
    
    if (err) {
        throw err
    }
    
    console.log(`Token created Id: ${newToken.tokenId}, Nft Id: ${nft._id}`,)
    return token
}
module.exports.createToken = createToken

// createToken("4776093255")

const getDecimalTokenId = function (id) {
    let padded = '0x' + id
    let result = ethers.BigNumber.from(padded)
    return result.toNumber()
}
module.exports.getDecimalTokenId = getDecimalTokenId

const get = async function (req, res) {
    
    let id = req.params.id;
    let tokenId;

    try {
        tokenId = getDecimalTokenId(id)
    }catch (err) {
        console.log(err.message)
        return ReE(res, err, HttpStatus.INTERNAL_SERVER_ERROR)
    }
    
    var query = {
        active: true,
        tokenId: tokenId,
    }
    console.log('Token query:', query);
    
    let err, token;
    [err, token] = await to(getToken(tokenId))
    
    if (err) {
        console.log(err)
        return ReE(res, err, HttpStatus.INTERNAL_SERVER_ERROR)
    }
    
    if (!token) {
        
        console.log(`No token with that id: ${tokenId}`)
        return ReE(res, {
            message: 'Unable to find token with that Id',
        }, HttpStatus.NOT_FOUND)
    }
    
    return ReS(res, token)
}
module.exports.get = get

const getToken = async function (tokenId) {
    
    var query = {
        active: true,
        tokenId: tokenId,
    }
    
    let err, token;
    [err, token] = await to(Token.findOne(query))
    
    if (err) {
        throw err
    }
    
    return token
}