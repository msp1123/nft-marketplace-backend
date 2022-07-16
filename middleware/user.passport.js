const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const {User, Admin} = require('../models');
const {to} = require('../services/utils.service');
const CONFIG = require('../configs/global.configs');

// This function is used to verify the authenticated user using jwt
module.exports = function (passport) {
    var opts = {};
    opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
    opts.secretOrKey = CONFIG.jwt_encryption;
    
    passport.use(new JwtStrategy(opts, async function (jwt_payload, done) {
        let err, user;
        [err, user] = await to(User.findOne(jwt_payload));
        if (err) return done(err, false);
        if (user) {
            return done(null, user);
        } else {
            return done(null, false);
        }
    }));
};