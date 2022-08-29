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
const {assetContract, marketContract} = require('../services/ethers.provider')

//global constants
const minimumChars = 3;
const regexpUrl = /^[a-z0-9-]+$/;
const regexpName = /^[a-zA-Z0-9- ]+$/;

exports.create = async function (req, res) {

    let user = req.user;
    let owner = user.address;
    let chainId = req.body.chainId;
    let address = req.body.address;
    let url = req.body.url.trim();
    let name = req.body.name.trim();
    let description = req.body.description;
    let profileImage = req.body.profileImage;

    if (isNull(url)) return ReF(res, "Url")
    if (isNull(name)) return ReF(res, "Name")
    if (isNull(address)) return ReF(res, "Address")
    if (isNull(chainId)) return ReF(res, "Chain Id")
    if (!isAddress(address)) return ReF(res, "Valid Address")
    if (isNull(profileImage)) return ReF(res, "Profile Image")

    let find = CONFIG.supportedNetworks.find(id => id.chainId == chainId)
    if (!find) return ReE(res, {
        message: "Network not supported"
    })

    if (name.search(regexpName) === -1) {
        return ReE(res, {
            message: "Invalid name format"
        })
    }
    
    if (url.search(regexpUrl) === -1) {
        return ReE(res, {
            message: "Invalid url format"
        })
    }

    if (name.length < minimumChars) return ReE(res, {
        message: "Name is too short"
    })
    
    if (url.length < minimumChars) return ReE(res, {
        message: "Url is too short"
    })

    let err, collection;
    [err, collection] = await to(Collection.findOne({name: name})
        .collation({locale: 'en', strength: 2}));
    if (err) return ReE(res)

    if (collection) return ReE(res, {
        message: "Collection name already taken"
    })
    
    [err, collection] = await to(Collection.findOne({url: url})
        .collation({locale: 'en', strength: 2}));
    if (err) return ReE(res)

    if (collection) return ReE(res, {
        message: "Collection url already taken"
    })

    let collectionInput = {
        url: url,
        name: name,
        owner: owner,
        address: address,
        chainId: chainId,
        links: req.body.links,
        description: description,
        profileImage: profileImage,
        category: req.body.category,
        bannerImage: req.body.bannerImage
    };

    [err, collection] = await to(Collection.create(collectionInput));
    if (err) return ReE(res)

    return ReS(res, {
        message: "Collection created successfully",
        collection: collection
    })
}

exports.get = async function (req, res) {

    let url = req.params.url;

    let query = {
        active: true,
        url: url
    }

    let err, collection;
    [err, collection] = await to(Collection.findOne(query));
    if (err) return ReE(res)

    if (!collection) return ReE(res, {
        message: "Collection not found"
    })

    let tokensQuery = {
        active: true,
        nftAddress: collection.address,
        chainId: collection.chainId
    }

    let tokens;
    [err, tokens] = await to(Token.find(tokensQuery))
    if (err) return ReE(res)

    if (isEmpty(tokens)) return ReS(res, {
        collection: collection,
        message: "No Tokens available"
    })

    return ReS(res, {
        collection: collection,
        tokens: tokens
    })
}

exports.update = async function (req, res) {

    let body = req.body;
    let user = req.user;

    if (isEmpty(body)) return ReE(res, {
        message: "No input found to update"
    })

    if (isNull(body.url)) return ReF(res, "Collection url")

    let query = {
        active: true,
        url: body.url
    }

    let err, collection;
    [err, collection] = await to(Collection.findOne(query))
    if (err) return ReE(res)

    if (!collection) return ReE(res, {
        message: "Collection not found"
    })

    if (collection.owner !== user.address) return ReE(res, {
        message: "Caller is not owner"
    })

    CONFIG.editableCollectionFields.forEach(function (field) {
        if (typeof field === "string" && body[field] !== undefined) {
            if (isEmpty(body[field])) {
                var newFields = Object.keys(body[field]);
                var ObjName = body[field].name;
                newFields.map((field2) => {
                    collection[field][field2] = body[field][field2];
                });
                return;
            }
            collection[field] = body[field];
        }
    });

    [err, collection] = await to(collection.save())
    if (err) {
        return ReE(res)
    }

    return ReS(res, {
        message: "Collection updated.",
        collection: collection
    })
}

exports.getAll = async function (req, res) {

    let page = req.query.page || 1;
    let limit = req.query.limit || 10;

    let query = {
        active: true
    }

    let options = {
        limit: limit,
        page: page
    }

    let err, collections;
    [err, collections] = await to(Collection.paginate(query, options));
    if (err) return ReE(res)

    if (isEmpty(collections)) return ReS(res, {
        message: "No Collections available"
    })

    Object.defineProperty(collections, 'collections',
        Object.getOwnPropertyDescriptor(collections, 'docs'));
    delete collections['docs'];
    return ReS(res, collections)
}

exports.getUserCollections = async function (req, res) {

    let address = req.params.address;
    let page = req.query.page || 1;
    let trim = req.query.trim || false;
    let limit = req.query.limit || 10;

    if (isNull(address)) return ReF(res, "Address")

    let userQuery = {
        active: true,
        address: address
    }

    let err, user;
    [err, user] = await to(User.findOne(userQuery))
    if (err) return ReE(res)

    if (!user) return ReE(res, {
        message: "User not found"
    })

    let query = {
        active: true,
        owner: user.address
    }

    let options = {
        limit: limit,
        page: page
    }

    let collections;

    if (trim) {
        [err, collections] = await to(Collection.find(query));
        if (err) return ReE(res)

        if (isEmpty(collections)) return ReE(res, {
            message: "No Collections available"
        })
        
        collections = {
            collections: collections
        }
    } else {
        [err, collections] = await to(Collection.paginate(query, options));
        if (err) return ReE(res)

        if (isEmpty(collections.docs)) return ReE(res, {
            message: "No Collections available"
        })

        Object.defineProperty(collections, 'collections',
            Object.getOwnPropertyDescriptor(collections, 'docs'));
        delete collections['docs'];
    }
    return ReS(res, collections)
}

exports.verifyName = async function (req, res) {
    let name = req.query.name.trim();

    if (isNull(name)) return ReF(res, "Name")

    if (name.length < minimumChars) return ReE(res, {
        message: "Name is too short"
    }, 200)

    if (name.search(regexpName) === -1) {
        return ReE(res, {
            message: "Invalid name format"
        })
    }

    let err, collection;
    [err, collection] = await to(Collection.findOne({name: name})
        .collation({locale: 'en', strength: 2}));
    if (err) return ReE(res)

    if (collection) return ReE(res, {
        message: "Collection name already taken"
    }, 200)

    return ReS(res, {
        message: "Name is available",
        name: name
    })
}

exports.verifyUrl = async function (req, res) {
    let url = req.query.url.trim();

    if (isNull(url)) return ReF(res, "Url")

    if (url.length < minimumChars) return ReE(res, {
        message: "Url is too short"
    }, 200)

    if (url.search(regexpUrl) === -1) {
        return ReE(res, {
            message: "Invalid url format"
        })
    }

    let err, collection;
    [err, collection] = await to(Collection.findOne({url: url})
        .collation({locale: 'en', strength: 2}));
    if (err) return ReE(res)

    if (collection) return ReE(res, {
        message: "Collection url already taken"
    }, 200)

    return ReS(res, {
        message: "Url is available",
        url: url
    })
}
