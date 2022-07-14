const {ethers} = require('ethers')
const {v4: uuidv4} = require('uuid');
const validator = require('validator')
const HttpStatus = require('http-status')
const CONFIG = require("../configs/global.configs");

const {isAddress} = ethers.utils
const {isEmail, isStrongPassword} = validator
const ObjectId = require('mongoose').Types.ObjectId

const {isEmpty, isNull, ReE, ReS, ReF, to} = require('../services/utils.service');