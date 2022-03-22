const express = require('express');
const passport = require('passport');
const router = express.Router();
const UserController = require('../controller/user.controller')

const needsAuth = passport.authenticate('jwt', { session: false })
require('../middleware/passport')(passport)

router.post('/user/login', UserController.login)
router.post('/user/register', UserController.registerUser)
router.get('/user/:id', needsAuth, UserController.getUser)
router.post('/user/verify/email', UserController.verifyEmail)
router.post('/user/verify/resendcode', UserController.sendCode)
router.post('/user/resetpassword', UserController.resetPassword)
router.post('/user/update', needsAuth, UserController.updateUser)

router.use('/', (req, res, next) => {
    return res.json({
        message: 'Welcome to NFT Marketplace API',
    })
});

module.exports = router;
