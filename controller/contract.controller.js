const AWS = require('aws-sdk');
const {ethers, utils} = require("ethers");
const { logger } = require('../configs/winston.config')
const ObjectId = require('mongoose').Types.ObjectId
const HttpStatus = require('http-status')
const {isNull, isEmpty} = require('../utils/validations')
const {to, ReE, ReS, ReF} = require('../utils/response')
const Nft = require('../models/nft.model');
const Activity = require('../models/activity.model');
const CONFIG = require('../configs/global.configs');

const Nft721Json = require('../json/Nft721.json')
const Nft1155Json = require('../json/Nft1155.json')
const Market721Json = require('../json/Market721.json')
const Market1155Json = require('../json/Market1155.json');
const { sendErrorReport } = require('../services/nodemailer');
const provider = new ethers.providers.InfuraProvider(CONFIG.network,
    CONFIG.infura_key)

const s3bucket = new AWS.S3({
    accessKeyId: CONFIG.access_key,
    secretAccessKey: CONFIG.secret_key
});

const createNft = async (req, res) => {

    let err, nft, activity;
    let body = req.body;
    let user = req.user;
    let tokenId = Math.floor(1000000000 + Math.random() * 9000000000);

    if (isNull(body.title)) return ReF(res, 'Title')
    if (isNull(body.description)) return ReF(res, 'Description')
    if (isNull(body.totalSupply)) return ReF(res, 'Supply')
    if (isNull(body.attachments[0].url)) return ReF(res, 'Image')
    if (isNull(body.txHash)){
        if(isNull(body.privateKey)) return ReF(res, 'Privatekey')
    }
    if (isNull(body.attachments) || isEmpty(body.attachments)) {
        return ReF(res, 'Attachments')
    }

    if (body.totalSupply <= 0) {
        return ReE(res, {
            message: 'Please enter a valid supply for token'
        }, HttpStatus.BAD_REQUEST)
    }
    if (body.royalty > 10) {
        return ReE(res, {
            message: 'Royalty can not be upto 10%'
        }, HttpStatus.BAD_REQUEST)
    }

    var input = {
        userId: user._id,
        tokenId: tokenId,
        title: body.title,
        tokenPrice: 0,
        txHash: body.txHash,
        royalty: body.royalty || 5,
        popularity: body.popularity,
        description: body.description,
        attachments: body.attachments,
        totalSupply: body.totalSupply,
        previewImage: body.attachments[0].url,
        chainName: body.chainName || 'Ethereum',
        assetType: body.totalSupply > 1 ? 'ERC-1155' : 'ERC-721',
        nftAddress: body.totalSupply > 1 ?
            CONFIG.nft_contract_1155 : CONFIG.nft_contract_721,
        marketAddress: body.totalSupply > 1 ?
            CONFIG.market_contract_1155 : CONFIG.market_contract_721
    };

    if(isNull(body.txHash)){

        let type = body.totalSupply = 1 ? 1 : 2;

        let txHash = await mint(
            type, body.privateKey, tokenId, 
            body.royalty, body.totalSupply
        );
        if(txHash){
            input.txHash = txHash;
        }else{
            return ReE(res, {
                message: 'Unexpected chain error. Please contact support'
            }, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    [err, nft] = await to(Nft.create(input));
    if (err) {
        return ReE(res, {
            message: 'Nft create failed',
            error: err
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    let activityInput = {
        nftId: nft._id,
        userId: user._id,
        amount: input.totalSupply,
        assetType: input.totalSupply > 1 ? 'ERC-1155' : 'ERC-721',
        tokenId: tokenId,
        txHash: input.txHash
    };

    [err, activity] = await to(Activity.create(activityInput));
    if (err) {
        return ReE(res, {
            message: 'Activity create failed',
            error: err
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    return ReS(res, {
        message: "Mint submitted successfully",
        result: nft
    })
}
module.exports.createNft = createNft

const putOnSale = async (req, res) => {

    let err, nft, activity, newActivity;

    let body = req.body;
    let user = req.user;
    let itemId = Math.floor(1000000000 + Math.random() * 9000000000);

    if (isNull(body.actId)) return ReF(res, 'Activity Id')
    if (isNull(body.txHash)){
        if(isNull(body.privateKey)) return ReF(res, 'Privatekey')
    }

    if (!ObjectId.isValid(body.actId)) return ReE(res, {
        message: "Enter a valid Activity Id"
    }, HttpStatus.BAD_REQUEST)

    if(isNull(body.price) || body.price <= 0) return ReE(res, {
        message: "Enter a valid token price"
    }, HttpStatus.BAD_REQUEST)

    let actQuery = {
        active: true,
        _id: body.actId
    };

    [err, activity] = await to(Activity.findOne(actQuery));
    if (err) {
        return ReE(res, {
            message: 'Activity fetch error'
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }
    if (!activity) {
        return ReE(res, {
            message: 'Activity not found'
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    let nftQuery = {
        active: true,
        _id: activity.nftId
    };

    [err, nft] = await to(Nft.findOne(nftQuery));
    if (err) {
        return ReE(res, {
            message: 'Nft fetch error'
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }
    if (!nft) {
        return ReE(res, {
            message: 'Nft not found'
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    if (activity.assetType === 'ERC-1155' && isNull(body.amount)) {
        return ReE(res, {
            message: 'Please enter amount to put on sale'
        }, HttpStatus.BAD_REQUEST)
    }

    let tokenAmount = activity.assetType === 'ERC-1155' ? parseInt(body.amount) : 1;
    if (tokenAmount <= 0) {
        return ReE(res, {
            message: 'Please enter a valid amount to put on sale'
        }, HttpStatus.BAD_REQUEST)
    }

    let activityInput = {
        nftId: nft._id,
        userId: user._id,
        amount: tokenAmount,
        assetType: activity.assetType,
        tokenId: activity.tokenId,
        tokenPrice: body.price,
        itemId: activity.assetType === 'ERC-1155' ? itemId : 0
    };

    if (activity.amount < tokenAmount) {
        return ReE(res, {
            message: 'Can not create sale more than minted amount'
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    if(isNull(body.txHash)){

        let type = activity.assetType === 'ERC-721' ? 1 : 2;

        let txHash = await sell(
            type, body.privateKey, activity.tokenId, 
            body.price, itemId, tokenAmount
        );
        if(txHash){
            activityInput.txHash = txHash;
        }else{
            return ReE(res, {
                message: 'Unexpected chain error. Please contact support'
            }, HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    [err, newActivity] = await to(Activity.create(activityInput));
    if (err) {
        return ReE(res, {
            message: 'Activity create error'
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    let saleCount = activity.amount - tokenAmount;
    let tempActivity;
    [err, tempActivity] = await to(Activity.updateOne(
        {_id: activity._id},
        {amount: saleCount},
        {upsert: true}
    ));
    if (err) {
        return ReE(res, {
            message: 'Activity update error'
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    return ReS(res, {
        message: "Put on sale request submitted",
        success: true,
        result: newActivity
    });
}
module.exports.putOnSale = putOnSale

const buyNft = async (req, res) => {

    let err, nft, activity, newActivity, contract, nftContract, createTx, receipt;

    let body = req.body;
    let user = req.user;

    if (isNull(body.actId)) return ReF(res, 'Activity Id')
    if (isNull(body.privateKey)) return ReF(res, 'PrivateKey')

    let actQuery = {
        active: true,
        _id: body.actId
    };

    [err, activity] = await to(Activity.findOne(actQuery));
    if (err) {
        return ReE(res, {
            message: 'Activity fetch error'
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }
    if (!activity) {
        return ReE(res, {
            message: 'Activity not found'
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    let nftQuery = {
        active: true,
        _id: activity.nftId
    };

    [err, nft] = await to(Nft.findOne(nftQuery));
    if (err) {
        return ReE(res, {
            message: 'Nft fetch error'
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }
    if (!nft) {
        return ReE(res, {
            message: 'Nft not found'
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    if (activity.assetType === 'ERC-1155' && isNull(body.amount)) {
        return ReE(res, {
            message: 'Please enter amount to purchase'
        }, HttpStatus.BAD_REQUEST)
    }

    let tokenAmount = activity.assetType === 'ERC-1155' ? parseInt(body.amount) : 1;
    if (tokenAmount <= 0) {
        return ReE(res, {
            message: 'Please enter a valid amount to purchase'
        }, HttpStatus.BAD_REQUEST)
    }

    let activityInput = {
        nftId: nft._id,
        userId: user._id,
        amount: tokenAmount,
        assetType: activity.assetType,
        tokenId: activity.tokenId,
        tokenPrice: activity.tokenPrice,
        itemId: activity.itemId
    };

    if (activity.amount < tokenAmount) {
        return ReE(res, {
            message: 'Can not buy more than stock amount'
        }, HttpStatus.BAD_REQUEST)
    }

    let tokenPrice;
    const wallet = new ethers.Wallet(body.privateKey, provider);

    if (activity.assetType === 'ERC-721') {

        contract = new ethers.Contract(
            CONFIG.market_contract_721,
            Market721Json.abi,
            wallet
        );

        tokenPrice = await contract.getTokenPrice(activity.tokenId);
        if (tokenPrice.toString() === "0") {
            return ReE(res, {
                message: `No token found with id: ${activity.tokenId}`
            }, HttpStatus.INTERNAL_SERVER_ERROR)
        }
        try {
            let estimateGas = await contract.estimateGas.buyNFT(
                activity.tokenId, {value: tokenPrice}
            );
            console.log("EstimatedGas", estimateGas.toString());
        } catch (error) {
            return ReE(res, {
                message: 'Gas estimation failed!',
                error: error
            }, HttpStatus.INTERNAL_SERVER_ERROR)
        }

        createTx = await contract.buyNFT(
            activity.tokenId, {value: tokenPrice}
        );
        activityInput.txHash = createTx.hash;
    } else {

        contract = new ethers.Contract(
            CONFIG.market_contract_1155,
            Market1155Json.abi,
            wallet
        );

        tokenPrice = await contract.getTokenPrice(
            CONFIG.nft_contract_1155, activity.tokenId, activity.itemId
        ) * tokenAmount;
        if (tokenPrice.toString() === "0") {
            return ReE(res, {
                message: `No token found with id: ${activity.tokenId}`
            }, HttpStatus.INTERNAL_SERVER_ERROR)
        }
        try {
            let estimateGas = await contract.estimateGas.buyToken(
                CONFIG.nft_contract_1155, activity.tokenId,
                activity.itemId, tokenAmount, {value: tokenPrice.toString()}
            );
            console.log("EstimatedGas", estimateGas.toString());
        } catch (error) {
            return ReE(res, {
                message: 'Gas estimation failed!',
                error: error
            }, HttpStatus.INTERNAL_SERVER_ERROR)
        }
        createTx = await contract.buyToken(
            CONFIG.nft_contract_1155, activity.tokenId,
            activity.itemId, tokenAmount, {value: tokenPrice.toString()}
        );
        activityInput.txHash = createTx.hash;
    }

    [err, newActivity] = await to(Activity.create(activityInput));
    if (err) {
        return ReE(res, {
            message: 'Activity create error'
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    let saleCount = activity.amount - tokenAmount;
    let activityStatus;
    if (saleCount <= 0) {
        activityStatus = 'SOLD';
    } else {
        activityStatus = activity.status;
    }
    let tempActivity;
    [err, tempActivity] = await to(Activity.updateOne(
        {_id: activity._id},
        {amount: saleCount, status: activityStatus},
        {upsert: true}
    ));
    if (err) {
        return ReE(res, {
            message: 'Activity update error'
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    res.status(200).send({
        message: "Purchase nft request submitted",
        success: true,
        result: newActivity
    });
    receipt = await createTx.wait();

    if (receipt.status === 1) {
        [err, nft] = await to(Nft.updateOne(
            {_id: nft._id},
            {stockAvailable: nft.stockAvailable - tokenAmount},
            {upsert: true}
        ));
        if (err) {
            return console.log("buynft::update::error", err);
        }
        [err, newActivity] = await to(Activity.updateOne(
            {_id: newActivity._id},
            {status: "BOUGHT"},
            {upsert: true}
        ));
        if (err) {
            return console.log("buyactivity::update::error", err);
        }
    } else {
        [err, newActivity] = await to(Activity.updateOne(
            {_id: newActivity._id},
            {status: "FAILED"},
            {upsert: true}
        ));
        if (err) {
            return console.log("buyactivity::update::error", err);
        }
        [err, activity] = await to(Activity.updateOne(
            {_id: activity._id},
            {amount: activity.amount + tokenAmount, status: "ONSALE"},
            {upsert: true}
        ));
        if (err) {
            return console.log("buyactivity::update::error", err);
        }
    }
    console.log(`Buy nft updated for id: ${activityInput.tokenId}, at: ${Date()}`)
}
module.exports.buyNft = buyNft

const updatePrice = async (req, res) => {

    let err, nft, activity, newActivity, contract, nftContract, createTx, receipt;

    let body = req.body;
    let user = req.user;

    if (isNull(body.actId)) return ReF(res, 'Activity Id')
    if (isNull(body.privateKey)) return ReF(res, 'PrivateKey')
    if (isNull(body.tokenPrice)) return ReF(res, 'Token Price')

    let actQuery = {
        active: true,
        _id: body.actId
    };

    [err, activity] = await to(Activity.findOne(actQuery));
    if (err) {
        return ReE(res, {
            message: 'Activity fetch error'
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }
    if (!activity) {
        return ReE(res, {
            message: 'Activity not found'
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    if (activity.status !== 'ONSALE' && activity.assetType === 'ERC-1155') {
        return ReE(res, {
            message: 'Item is not in sale. Put on sale to change price'
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    let nftQuery = {
        active: true,
        _id: activity.nftId
    };

    [err, nft] = await to(Nft.findOne(nftQuery));
    if (err) {
        return ReE(res, {
            message: 'Nft fetch error'
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }
    if (!nft) {
        return ReE(res, {
            message: 'Nft not found'
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    let activityInput = {
        nftId: nft._id,
        userId: user._id,
        amount: activity.amount,
        assetType: activity.assetType,
        tokenId: activity.tokenId,
        tokenPrice: body.tokenPrice
    };

    let tokenPrice = ethers.utils.parseEther(body.tokenPrice.toString());
    const wallet = new ethers.Wallet(body.privateKey, provider);

    if (activity.assetType === 'ERC-721') {

        contract = new ethers.Contract(
            CONFIG.market_contract_721,
            Market721Json.abi,
            wallet
        );

        try {
            let estimateGas = await contract.estimateGas.updatePrice(
                activity.tokenId, tokenPrice
            );
            console.log("EstimatedGas", estimateGas.toString());
        } catch (error) {
            return ReE(res, {
                message: 'Gas estimation failed!',
                error: error
            }, HttpStatus.INTERNAL_SERVER_ERROR)
        }

        createTx = await contract.updatePrice(
            activity.tokenId, tokenPrice
        );
        activityInput.txHash = createTx.hash;
    } else {

        contract = new ethers.Contract(
            CONFIG.market_contract_1155,
            Market1155Json.abi,
            wallet
        );

        try {
            let estimateGas = await contract.estimateGas.updateSalePrice(
                CONFIG.nft_contract_1155, activity.tokenId,
                activity.itemId, tokenPrice
            );
            console.log("EstimatedGas", estimateGas.toString());
        } catch (error) {
            return ReE(res, {
                message: 'Gas estimation failed!',
                error: error
            }, HttpStatus.INTERNAL_SERVER_ERROR)
        }
        createTx = await contract.updateSalePrice(
            CONFIG.nft_contract_1155, activity.tokenId,
            activity.itemId, tokenPrice
        );
        activityInput.txHash = createTx.hash;
    }

    [err, newActivity] = await to(Activity.create(activityInput));
    if (err) {
        return ReE(res, {
            message: 'Activity create error'
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    let oldPrice = activity.tokenPrice;
    let tempActivity;
    [err, tempActivity] = await to(Activity.updateOne(
        {_id: activity._id},
        {tokenPrice: body.tokenPrice},
        {upsert: true}
    ));
    if (err) {
        return ReE(res, {
            message: 'Activity update error'
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }
    res.status(200).send({
        message: "Price update request submitted",
        success: true,
        result: newActivity
    });
    receipt = await createTx.wait();

    if (receipt.status === 1) {
        [err, nft] = await to(Nft.updateOne(
            {_id: nft._id},
            {tokenPrice: body.tokenPrice},
            {upsert: true}
        ));
        if (err) {
            return console.log("updatepricenft::update::error", err);
        }
        [err, newActivity] = await to(Activity.updateOne(
            {_id: newActivity._id},
            {status: "PRICEUPDATED"},
            {upsert: true}
        ));
        if (err) {
            return console.log("updatepriceactivity::update::error", err);
        }
    } else {
        [err, newActivity] = await to(Activity.updateOne(
            {_id: newActivity._id},
            {status: "FAILED"},
            {upsert: true}
        ));
        if (err) {
            return console.log("updatepriceactivity::update::error", err);
        }
        [err, activity] = await to(Activity.updateOne(
            {_id: activity._id},
            {tokenPrice: oldPrice},
            {upsert: true}
        ));
        if (err) {
            return console.log("updatepriceactivity::update::error", err);
        }
    }
    console.log(`Price updated for id: ${activityInput.tokenId}, at: ${Date()}`)
}
module.exports.updatePrice = updatePrice

const burnNft = async (req, res) => {

    let err, nft, activity, newActivity, contract, nftContract, createTx, receipt;

    let body = req.body;
    let user = req.user;

    if (isNull(body.actId)) return ReF(res, 'Activity Id')
    if (isNull(body.privateKey)) return ReF(res, 'PrivateKey')

    let actQuery = {
        active: true,
        _id: body.actId
    };

    [err, activity] = await to(Activity.findOne(actQuery));
    if (err) {
        return ReE(res, {
            message: 'Activity fetch error'
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }
    if (!activity) {
        return ReE(res, {
            message: 'Activity not found'
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    let nftQuery = {
        active: true,
        _id: activity.nftId
    };

    [err, nft] = await to(Nft.findOne(nftQuery));
    if (err) {
        return ReE(res, {
            message: 'Nft fetch error'
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }
    if (!nft) {
        return ReE(res, {
            message: 'Nft not found'
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    if (activity.assetType === 'ERC-1155' && isNull(body.amount)) {
        return ReE(res, {
            message: 'Please enter amount to burn'
        }, HttpStatus.BAD_REQUEST)
    }

    let burnAmount = activity.assetType === 'ERC-1155' ? parseInt(body.amount) : 1;

    if (burnAmount <= 0) {
        return ReE(res, {
            message: 'Please enter a valid amount to burn'
        }, HttpStatus.BAD_REQUEST)
    }
    if (activity.amount < burnAmount) {
        return ReE(res, {
            message: 'Can not burn more than you own'
        }, HttpStatus.BAD_REQUEST)
    }

    let activityInput = {
        nftId: nft._id,
        userId: user._id,
        amount: burnAmount,
        assetType: activity.assetType,
        tokenId: activity.tokenId,
        tokenPrice: activity.tokenPrice
    };

    const wallet = new ethers.Wallet(body.privateKey, provider);
    if (activity.assetType === 'ERC-721') {

        contract = new ethers.Contract(
            CONFIG.nft_contract_721,
            Nft721Json.abi,
            wallet
        );

        try {
            let estimateGas = await contract.estimateGas.burn(activity.tokenId);
            console.log("EstimatedGas", estimateGas.toString());
        } catch (error) {
            return ReE(res, {
                message: 'Gas estimation failed!',
                error: error
            }, HttpStatus.INTERNAL_SERVER_ERROR)
        }
        createTx = await contract.burn(activity.tokenId);
        activityInput.txHash = createTx.hash;
    } else {

        contract = new ethers.Contract(
            CONFIG.nft_contract_1155,
            Nft1155Json.abi,
            wallet
        );

        try {
            let estimateGas = await contract.estimateGas.burn(
                wallet.address, activity.tokenId, burnAmount);
            console.log("EstimatedGas", estimateGas.toString());
        } catch (error) {
            return ReE(res, {
                message: 'Gas estimation failed!',
                error: error
            }, HttpStatus.INTERNAL_SERVER_ERROR)
        }
        createTx = await contract.burn(
            wallet.address, activity.tokenId, burnAmount);
        activityInput.txHash = createTx.hash;
    }

    [err, newActivity] = await to(Activity.create(activityInput));
    if (err) {
        return ReE(res, {
            message: 'Activity create error'
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }
    
    let burnCount = activity.amount - burnAmount;
    let tempActivity;
    [err, tempActivity] = await to(Activity.updateOne(
        {_id: activity._id},
        {amount: burnCount},
        {upsert: true}
    ));
    if (err) {
        return ReE(res, {
            message: 'Activity update error'
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    res.status(200).send({
        message: "Burn nft submitted successfully",
        success: true,
        result: newActivity
    });
    receipt = await createTx.wait();

    if (receipt.status === 1) {
        [err, nft] = await to(Nft.updateOne(
            {_id: nft._id},
            {stockAvailable: burnCount},
            {upsert: true}
        ));
        if (err) {
            return console.log("burnnft::update::error", err);
        }
        [err, newActivity] = await to(Activity.updateOne(
            {_id: newActivity._id},
            {status: "BURNT"},
            {upsert: true}
        ));
        if (err) {
            return console.log("burnactivity::update::error", err);
        }
    } else {
        [err, newActivity] = await to(Activity.updateOne(
            {_id: newActivity._id},
            {status: "FAILED"},
            {upsert: true}
        ));
        if (err) {
            return console.log("burnactivity::update::error", err);
        }
        [err, activity] = await to(Activity.updateOne(
            {_id: activity._id},
            {amount: activity.amount + burnAmount},
            {upsert: true}
        ));
        if (err) {
            return console.log("burnactivity::update::error", err);
        }
    }
    console.log(`Burn event updated for id: ${activityInput.tokenId}, at: ${Date()}`)
}

module.exports.burnNft = burnNft

// The mint() function provides minting nft from the backend if the user send privatekey
// that means the user is not using website to mint nft.
const mint = async function (type, privateKey, tokenId, royalty, supply){
    const wallet = new ethers.Wallet(privateKey, provider);
    
    const marketContract721 = new ethers.Contract(
        CONFIG.market_contract_721, Market721Json.abi,
        wallet
    )

    if(type === 1){
        try {
            let estimateGas = await marketContract721.estimateGas
                .mintToken(tokenId, royalty);
            console.log("EstimatedGas", estimateGas.toString());
        } catch (error) {
            console.error("Gas estimation failed:", error);
            return
        }
        let createTx = await marketContract721.mintToken(tokenId, royalty);
        return createTx.hash;
    }else{
        return
    }
}

// The sell() function helps to create a sale item for the token
// which means if the user have to buy the token he needs to spend price of the token
const sell = async function (type, privateKey, tokenId, tokenPrice, itemId, amount){
    const wallet = new ethers.Wallet(privateKey, provider);
    
    let price = ethers.utils.parseEther(tokenPrice.toString());
    const marketContract721 = new ethers.Contract(
        CONFIG.market_contract_721, Market721Json.abi,
        wallet
    )

    if(type === 1){
        try {
            let estimateGas = await marketContract721.estimateGas
                .createSale(tokenId, price);
            console.log("EstimatedGas", estimateGas.toString());
        } catch (error) {
            console.error("Gas estimation failed:", error);
            return
        }
        let createTx = await marketContract721.createSale(tokenId, price);
        return createTx.hash;
    }else{
        return
    }
}

// tokenMinted() function is used to update the master nft and activity metadata of token
// This function will be triggered from the token event listener
const tokenMinted = async function (tokenId, owner, txHash) {

    let nftQuery = {
        active: true,
        tokenId: tokenId
    }

    let err, nft;
    [err, nft] = await to(Nft.findOne(nftQuery));
    if (err) {
        logger.info(`Minted token update failed with error: ${err}
        for tokenId: ${tokenId}, txHash: ${txHash}, address: ${owner}`);
        return
    }
    if (!nft) {
        logger.info(`Minted token update failed: No Nft found with Id: ${tokenId}, 
        txHash: ${txHash}, address: ${owner}`);
        return
    }

    nft.status = "MINTED";
    await nft.save();

    let activityQuery = {
        txHash: txHash,
        status: "SUBMITTED"
    }

    let activity;
    [err, activity] = await to(Activity.findOne(activityQuery));
    if (err) {
        logger.info(`Minted token update failed with error: ${err}
        for tokenId: ${tokenId}, txHash: ${txHash}, address: ${owner}`);
        return
    }
    if (!activity) {
        logger.info(`Minted token update failed: No Activity found with Id: ${tokenId}, 
        txHash: ${txHash}, address: ${owner}`);
        return
    }
    activity.status = "MINTED";
    await activity.save();
    console.log("Minted token for Id:", tokenId.toString());
}
module.exports.tokenMinted = tokenMinted

// saleCreated() function helps to fix a price to the token
// This function will be triggered from the token event listener
const saleCreated = async function (tokenId, owner, price, amount, txHash) {

    let nftQuery = {
        active: true,
        tokenId: tokenId
    }
    
    let err, nft;
    [err, nft] = await to(Nft.findOne(nftQuery));
    if (err) {
        logger.info(`Create sale update failed with error: ${err}
        for tokenId: ${tokenId}, txHash: ${txHash}, address: ${owner}`);
        return
    }
    if (!nft) {
        logger.info(`Create sale update failed: No Nft found with Id: ${tokenId}, 
        txHash: ${txHash}, address: ${owner}`);
        return
    }

    nft.status = "ONSALE";
    nft.tokenPrice = parseInt(utils.parseEther(price));
    nft.stockAvailable = nft.stockAvailable + amount;
    await nft.save();

    let activityQuery = {
        txHash: txHash,
        status: "SUBMITTED"
    }

    let activity;
    [err, activity] = await to(Activity.findOne(activityQuery));
    if (err) {
        logger.info(`Create sale update failed with error: ${err}
        for tokenId: ${tokenId}, txHash: ${txHash}, address: ${owner}`);
        return
    }
    if (!activity) {
        logger.info(`Create sale update failed: No Activity found with Id: ${tokenId}, 
        txHash: ${txHash}, address: ${owner}`);
        return
    }

    activity.status = "ONSALE";
    nft.tokenPrice = parseInt(utils.parseEther(price));
    await activity.save();

    console.log("Created sale for Id:", tokenId.toString());
}
module.exports.saleCreated = saleCreated