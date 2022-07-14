const express = require('express');
const passport = require('passport');

const router = express.Router();
const {verifyUser} = require('../middleware/passport');
verifyUser(passport)

const needsUserAuth = passport.authenticate('jwt', {session: false})

router.use('/', (req, res, next) => {
    return res.json({
        message: 'Hello! Welcome to NFT Marketplace API.',
    })
});

module.exports = router;
