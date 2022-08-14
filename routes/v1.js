const express = require('express');

const router = express.Router();

const passport = require('passport')
const needsAuth = passport.authenticate('jwt', {session: false})
require('../middleware/user.passport')(passport)
const UserController = require('../controller/user.controller')
const TokenController = require('../controller/token.controller')
const CollectionController = require("../controller/collection.controller");
const {supportedNetworks, nftCategories} = require('../services/utils.service');

//user routes
router.post('/user/login', UserController.login )
router.get('/user/fetch/:id', UserController.getUser)
router.put('/user/update', needsAuth, UserController.updateUser)
router.get('/user/verifyName/:id', needsAuth, UserController.verifyName)

//token routes
router.post('/token/create', needsAuth, TokenController.create)
router.get('/token/getTokenId/:chainId/:nftAddress', TokenController.getTokenId)
router.get('/token/metadata/:chainId/:nftAddress/:tokenId', TokenController.getTokenMetadata)

//collection routes
router.get('/collection/fetch/:name', CollectionController.get)
router.get('/collection/fetchAll', CollectionController.getAll)
router.get('/collection/verifyName', CollectionController.verifyName)
router.put('/collection/update', needsAuth, CollectionController.update)
router.post('/collection/create', needsAuth, CollectionController.create)
router.get('/collection/fetchByUser/:address', CollectionController.getUserCollections)

//common routes
router.get('/nft/categories', nftCategories)
router.get('/network/supportedNetworks', supportedNetworks)

router.use('/', (req, res, next) => {
    return res.json({
        message: 'Hello! Welcome to NFT Marketplace API.',
    })
});

module.exports = router;
