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
const minimumChars = 4;
const regexp = /^[a-zA-Z0-9-_ ]+$/;

exports.create = async function (req, res) {

    let user = req.user;
    let name = req.body.name.trim();
    let owner = user.address;
    let image = req.body.image;
    let chainId = req.body.chainId;
    let address = req.body.address;
    let description = req.body.description;

    if (isNull(name)) return ReF(res, "Name")
    if (isNull(image)) return ReF(res, "Image")
    if (isNull(chainId)) return ReF(res, "Chain Id")
    if (isNull(address)) return ReF(res, "Address")
    if (!isAddress(address)) return ReF(res, "Valid Address")

    let find = CONFIG.supportedNetworks.find(id => id.chainId == chainId)
    if (!find) return ReE(res, {
        message: "Network not supported"
    })

    if (name.search(regexp) === -1) {
        return ReE(res, {
            message: "Invalid name format"
        })
    }

    if (name.length < minimumChars) return ReE(res, {
        message: "Name is too short"
    })

    let err, collection;
    [err, collection] = await to(Collection.findOne({name: name})
        .collation({locale: 'en', strength: 2}));
    if (err) return ReE(res)

    if (collection) return ReE(res, {
        message: "Collection name already taken"
    })

    let collectionInput = {
        name: name,
        image: image,
        address: address,
        chainId: chainId,
        owner: owner,
        description: description,
        category: req.body.category
    };

    [err, collection] = await to(Collection.create(collectionInput));
    if (err) return ReE(res)

    return ReS(res, {
        message: "Collection created successfully",
        collection: collection
    })
}

exports.get = async function (req, res) {

    let name = req.params.name;

    let query = {
        active: true,
        name: name
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

    if (isNull(body.name)) return ReF(res, "Collection name")

    let query = {
        active: true,
        name: body.name
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

    if (name.search(regexp) === -1) {
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
