const express = require('express');

const router = express.Router();

const passport = require('passport')
const needsAuth = passport.authenticate('jwt', {session: false})
require('../middleware/user.passport')(passport)
const UserController = require('../controller/user.controller')

//user routes
router.post('/user/login', UserController.login )
router.get('/user/fetch/:id', UserController.getUser)
router.put('/user/update', needsAuth, UserController.updateUser)
router.get('/user/verifyName/:id', needsAuth, UserController.verifyName)

router.use('/', (req, res, next) => {
    return res.json({
        message: 'Hello! Welcome to NFT Marketplace API.',
    })
});

module.exports = router;
