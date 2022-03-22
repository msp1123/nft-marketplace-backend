const validator = require('validator')
const {v4: uuidv4} = require('uuid');
const {ethers} = require('ethers')
const ObjectId = require('mongoose').Types.ObjectId
const HttpStatus = require('http-status')

const {signJWT} = require('../utils/jwt.auth')
const {isNull, isEmpty} = require('../utils/validations')
const {to, ReE, ReS, ReF} = require('../services/response.services')
const {sendVerificationEmail} = require('../services/nodemailer')
const {getPasswordHash, comparePassword} = require('../utils/validations')

const User = require('../models/user.model');
const CONFIG = require("../configs/global.configs");
const appConfigs = require('../configs/app.config')
const {isEmail, isStrongPassword} = validator
const {isAddress} = ethers.utils

const registerUser = async function (req, res) {

    let body = req.body;

    if (isNull(body.email)) return ReF(res, "Email")
    if (isNull(body.password)) return ReF(res, "Password")
    if (isNull(body.address)) return ReF(res, "Wallet address")

    if (!isEmail(body.email)) return ReE(res, {
        message: "Email id is not valid"
    }, HttpStatus.BAD_GATEWAY)

    if (!isAddress(body.address)) return ReE(res, {
        message: "Wallet address is not valid"
    }, HttpStatus.BAD_GATEWAY)

    if (!isStrongPassword(body.password)) return ReE(res, {
        message: "Password is not strong enough"
    }, HttpStatus.BAD_GATEWAY)

    let verificationCode = Math.floor(100000 + Math.random() * 900000);
    let passwordHash = await getPasswordHash(body.password);
    body.verificationCode = verificationCode;
    body.password = passwordHash;

    let emailQuery = {
        email: body.email
    }
    let walletQuery = {
        email: body.email
    }

    let returnRes = {
        email: body.email,
        address: body.address
    }

    let err, user;
    [err, user] = await to(User.findOne(emailQuery))
    if (err) {
        return ReE(res, {
            message: "Unknown error occured. Please contact support.",
            error: err
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    if (user) {
        return ReE(res, {
            message: "Email id is already taken"
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    [err, user] = await to(User.findOne(walletQuery))
    if (err) {
        return ReE(res, {
            message: "Unknown error occured. Please contact support.",
            error: err
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    if (user) {
        return ReE(res, {
            message: "Wallet address already exists"
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    if (CONFIG.verify_email === 'true') {

        let mailInfo = await sendVerificationEmail(body.email, verificationCode);
        if (!mailInfo) {
            return ReE(res, {
                message: "Can not send email. Please contact support"
            }, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    [err, user] = await to(User.create(body))
    if (err) {
        return ReE(res, {
            message: "Unknown error occured. Please contact support.",
            error: err
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }
    if (CONFIG.verify_email !== 'true') {
        let authToken = await signJWT(user._id);
        returnRes.token = authToken;
        returnRes.code = verificationCode;
    }

    return ReS(res, {
        message: "Registered successfully",
        user: returnRes
    });
}

const verifyEmail = async function (req, res) {

    const email = req.body.email;
    const code = req.body.verificationCode;

    if (isNull(email)) return ReF(res, "Email")
    if (isNull(code)) return ReF(res, "Verification code")

    if (!isEmail(email)) return ReE(res, {
        message: "Email id is not valid"
    }, HttpStatus.BAD_GATEWAY)

    if (code.toString().length != 6) return ReE(res, {
        message: "Invalid verification code format"
    }, HttpStatus.BAD_GATEWAY)

    let insertData = {
        active: true,
        emailVerified: true,
        verificationCode: 0
    }

    let err, user;
    [err, user] = await to(User.findOne({email: email}))
    if (err) {
        return ReE(res, {
            message: "Unknown error occured. Please contact support.",
            error: err
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    if (!user) {
        return ReE(res, {
            message: "No user found. Please register and continue."
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }
    if (user.emailVerified) {
        return ReE(res, {
            message: "Email already verified"
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }
    if (user.verificationCode === 0 || user.verificationCode.toString().length !== 6) {
        return ReE(res, {
            message: "Verification code has been expired. Request new one"
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    if (code === user.verificationCode) {

        [err, user] = await to(User.updateOne({_id: user._id},
            insertData, {upsert: true}));
        if (err) {
            return ReE(res, {
                message: "Unknown error occured. Please contact support.",
                error: err
            }, HttpStatus.INTERNAL_SERVER_ERROR)
        }

        let authToken = await signJWT(user._id);
        return ReS(res, {
            message: "Email verified successfully",
            email: user.email,
            token: authToken
        });
    }
    return ReE(res, {
        message: "Code doesn't match, please try again."
    }, HttpStatus.INTERNAL_SERVER_ERROR)
}

const sendCode = async function (req, res) {

    const email = req.body.email;
    let verificationCode = Math.floor(100000 + Math.random() * 900000);

    if (isNull(email)) return ReF(res, "Email")

    if (!isEmail(email)) return ReE(res, {
        message: "Email id is not valid"
    }, HttpStatus.BAD_GATEWAY)

    let query = {
        email: email
    }

    let err, user;
    [err, user] = await to(User.findOne(query))
    if (err) {
        return ReE(res, {
            message: "Unknown error occured. Please contact support.",
            error: err
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    if (!user) {
        return ReE(res, {
            message: "No user found. Please register and continue."
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    let mailInfo = await sendVerificationEmail(email, verificationCode);
    if (!mailInfo) {
        return ReE(res, {
            message: "Can not send email. Please contact support"
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    [err, user] = await to(User.updateOne({_id: user._id},
        {verificationCode: verificationCode}, {upsert: true}));
    if (err) {
        return ReE(res, {
            message: "Unknown error occured. Please contact support.",
            error: err
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    return ReS(res, {message: "Code sent successfully"});
}

const login = async function (req, res) {

    const email = req.body.email
    const password = req.body.password

    if (isNull(email)) return ReF(res, "Email")
    if (isNull(password)) return ReF(res, "Password")

    if (!isEmail(email)) return ReE(res, {
        message: "Email id is not valid"
    }, HttpStatus.BAD_GATEWAY)

    let query = {
        email: email
    }

    let err, user;
    [err, user] = await to(User.findOne(query))
    if (err) {
        return ReE(res, {
            message: "Unknown error occured. Please contact support.",
            error: err
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    if (!user) {
        return ReE(res, {
            message: "No user found. Please register and continue."
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    let verification = await comparePassword(password, user.password);
    if (!verification) {
        return ReE(res, {
            message: "Incorrect password. please try again"
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    if (CONFIG.verify_email === 'true' && !user.emailVerified) {
        return ReE(res, {
            message: "User not verified. please verify your email and try again."
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    let authToken = await signJWT(user._id);
    return ReS(res, {
        message: "Logged in successfully",
        email: user.email,
        address: user.address,
        token: authToken
    })
}

const updateUser = async function (req, res) {

    let user = req.user;
    let body = req.body;

    if (isNull(user) || isEmpty(user)) {
        return ReE(res, {
            message: 'User not found'
        }, HttpStatus.BAD_GATEWAY)
    }
    if (!user.active) {
        return ReE(res, {
            message: 'User is deleted'
        }, HttpStatus.BAD_GATEWAY)
    }
    if (CONFIG.verify_email === 'true' && !user.emailVerified) {
        return ReE(res, {
            message: "User not verified. please verify your email and try again."
        }, HttpStatus.BAD_GATEWAY)
    }

    if (isNull(body) || isEmpty(body)) {
        return ReE(res, {
            message: 'Nothing to update. please add some info.'
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    appConfigs.userEditable.forEach(function (field) {
        if (typeof field === "string" && body[field] !== undefined) {
            if (isEmpty(body[field])) {
                var newFields = Object.keys(body[field]);
                var ObjName = body[field].name;
                newFields.map((field2) => {
                    user[field][field2] = body[field][field2];
                });
                return;
            }
            user[field] = body[field];
        }
    });

    let err, newUser;
    [err, newUser] = await to(user.save());
    if (err) {
        return ReE(res, {
            message: "Unknown error occured. Please contact support.",
            error: err
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    return ReS(res, {
        message: "User updated successfully",
        user: user
    });
}

const resetPassword = async function (req, res) {

    const email = req.body.email
    const password = req.body.password
    const code = req.body.verificationCode

    if (isNull(email)) return ReF(res, "Email")
    if (isNull(password)) return ReF(res, "Password")
    if (isNull(code)) return ReF(res, "VerificationCode")

    if (!isEmail(body.email)) return ReE(res, {
        message: "Email id is not valid"
    }, HttpStatus.BAD_GATEWAY)

    if (!isStrongPassword(body.password)) return ReE(res, {
        message: "Password is not strong enough"
    }, HttpStatus.BAD_GATEWAY)

    if (code.toString().length != 6) return ReE(res, {
        message: "Invalid verification code format"
    }, HttpStatus.BAD_GATEWAY)

    let passwordHash = await getPasswordHash(password);

    let query = {
        active: true,
        email: email
    }

    let insertData = {
        password: passwordHash,
        verificationCode: 0
    }

    let err, user;
    [err, user] = await to(User.findOne(query))
    if (err) {
        return ReE(res, {
            message: "Unknown error occured. Please contact support.",
            error: err
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    if (!user) {
        return ReE(res, {
            message: "No user found. Please register and continue."
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    if (user.verificationCode === 0 || user.verificationCode.toString().length !== 6) {
        return ReE(res, {
            message: "Verification code has been expired. Request new one"
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    if (code === user.verificationCode) {

        [err, user] = await to(User.updateOne({_id: user._id},
            insertData, {upsert: true}));
        if (err) {
            return ReE(res, {
                message: "Unknown error occured. Please contact support.",
                error: err
            }, HttpStatus.INTERNAL_SERVER_ERROR)
        }
        return ReS(res, {
            message: "Password reset completed.",
            email: user.email
        });
    }

    return ReE(res, {
        message: "Code doesn't match, please try again."
    }, HttpStatus.INTERNAL_SERVER_ERROR)
}

const getUser = async function (req, res) {

    let authUser = req.user;
    let userId = req.params.id;

    if (isNull(userId) || isEmpty(userId)) return ReF(res, "User Id")
    if (!ObjectId.isValid(userId)) return ReE(res, {
        message: "Enter a valid User Id"
    }, HttpStatus.BAD_GATEWAY)
    
    userId = new ObjectId(userId);

    if (userId.toString() === authUser._id.toString()) {
        return ReS(res, {
            message: "Auth user found",
            user: authUser
        });
    }

    let query = {
        _id: userId
    }

    let err, user;
    [err, user] = await to(User.findOne(query))
    if (err) {
        return ReE(res, {
            message: "Unknown error occured. Please contact support.",
            error: err
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    if (!user) {
        return ReE(res, {
            message: "No user found."
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    if (!user.active) {
        return ReE(res, {
            message: "This account has been deleted."
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    return ReS(res, {
        message: "User found",
        user: user
    });
}

module.exports = {
    registerUser,
    verifyEmail,
    sendCode,
    login,
    updateUser,
    resetPassword,
    getUser
}