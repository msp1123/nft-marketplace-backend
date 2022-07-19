const express = require('express');

const router = express.Router();

const passport = require('passport')
const needsAuth = passport.authenticate('jwt', {session: false})
require('../middleware/user.passport')(passport)
const UserController = require('../controller/user.controller')
const TokenController = require('../controller/token.controller')

//user routes
router.post('/user/login', UserController.login )
router.get('/user/fetch/:id', UserController.getUser)
router.put('/user/update', needsAuth, UserController.updateUser)
router.get('/user/verifyName/:id', needsAuth, UserController.verifyName)

//token routes
router.get('/token/getTokenId/:chainId/:nftAddress', TokenController.getTokenId)
router.post('/token/create', needsAuth, TokenController.create)

router.use('/', (req, res, next) => {
    return res.json({
        message: 'Hello! Welcome to NFT Marketplace API.',
    })
});

module.exports = router;
