const AWS = require('aws-sdk');
const {ethers} = require("ethers");
const {v4: uuidv4} = require('uuid');
const ObjectId = require('mongoose').Types.ObjectId
const HttpStatus = require('http-status')
const {isNull, isEmpty} = require('../utils/validations')
const {to, ReE, ReS, ReF} = require('../services/response.services')
const Nft = require('../models/nft.model');
const Users = require('../models/user.model');
const Activity = require('../models/activity.model');
const CONFIG = require('../configs/global.configs');

const Nft721Json = require('../json/Nft721.json')
const Nft1155Json = require('../json/Nft1155.json')
const Market721Json = require('../json/Market721.json')
const Market1155Json = require('../json/Market1155.json')
const provider = new ethers.providers.InfuraProvider(CONFIG.network,
    CONFIG.infura_key)

const s3bucket = new AWS.S3({
    accessKeyId: CONFIG.access_key,
    secretAccessKey: CONFIG.secret_key
});

const mint = async (req, res) => {

    let err, nft, activity, contract, createTx, receipt;
    let body = req.body;
    let user = req.user;
    let tokenId = Math.floor(1000000000 + Math.random() * 9000000000);

    if (isNull(body.title)) return ReF(res, 'Title')
    if (isNull(body.tokenPrice)) return ReF(res, 'Token price')
    if (isNull(body.privateKey)) return ReF(res, 'Privatekey')
    if (isNull(body.totalSupply)) return ReF(res, 'Supply')
    if (isNull(body.attachments[0].url)) return ReF(res, 'Image')
    if (isNull(body.attachments) || isEmpty(body.attachments)) {
        return ReF(res, 'Attachments')
    }

    if (body.tokenPrice <= 0) {
        return ReE(res, {
            message: 'Please enter a valid token price'
        }, HttpStatus.BAD_REQUEST)
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
        royalty: body.royalty || 5,
        tokenPrice: body.tokenPrice,
        popularity: body.popularity,
        attachments: body.attachments,
        totalSupply: body.totalSupply,
        previewImage: body.attachments[0].url,
        chainName: body.chainName || 'Ethereum',
        description: body.description || 'None',
        assetType: body.totalSupply > 1 ? 'ERC-1155' : 'ERC-721',
        nftAddress: body.totalSupply > 1 ?
            CONFIG.nft_contract_1155 : CONFIG.nft_contract_721,
        marketAddress: body.totalSupply > 1 ?
            CONFIG.market_contract_1155 : CONFIG.market_contract_721
    };

    var s3data = {
        name: input.title,
        tokenId: tokenId,
        description: input.description,
        image: input.attachments[0].url
    };

    const s3params = {
        Bucket: CONFIG.bucket_name,
        Key: 'metadata/' + tokenId + ".json",
        Body: Buffer.from(JSON.stringify(s3data)),
        ContentType: "application/json"
    };

    let tokenPrice = ethers.utils.parseEther(input.tokenPrice.toString());
    const wallet = new ethers.Wallet(body.privateKey, provider);

    if (input.totalSupply === 1) {

        contract = new ethers.Contract(
            CONFIG.market_contract_721,
            Market721Json.abi,
            wallet
        );

        try {
            let estimateGas = await contract.estimateGas.safeMintAsset(
                tokenId, tokenPrice, input.royalty
            );
            console.log("EstimatedGas", estimateGas.toString());
        } catch (error) {
            return ReE(res, {
                message: 'Gas estimation failed!',
                error: error
            }, HttpStatus.INTERNAL_SERVER_ERROR)
        }

        createTx = await contract.safeMintAsset(tokenId, tokenPrice, input.royalty);
        input.txHash = createTx.hash;
    } else {

        contract = new ethers.Contract(
            CONFIG.market_contract_1155,
            Market1155Json.abi,
            wallet
        );

        try {
            let estimateGas = await contract.estimateGas.createToken(
                input.totalSupply, tokenId, input.royalty
            );
            console.log("EstimatedGas", estimateGas.toString());
        } catch (error) {
            return ReE(res, {
                message: 'Gas estimation failed!',
                error: error
            }, HttpStatus.INTERNAL_SERVER_ERROR)
        }

        createTx = await contract.createToken(input.totalSupply, tokenId, input.royalty);
        input.txHash = createTx.hash;
    }

    let s3Upload;
    [err, s3Upload] = await to(s3bucket.putObject(s3params).promise());

    if (err) {
        return ReE(res, {
            message: 'S3 upload error',
            error: err
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }
    input.metadata = "https://marketplace-nft.s3.amazonaws.com/metadata/" + tokenId + ".json";

    [err, nft] = await to(Nft.create(input));
    if (err) {
        return ReE(res, {
            message: 'Nft create error',
            error: err
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    let activityInput = {
        nftId: nft._id,
        userId: user._id,
        amount: input.totalSupply,
        assetType: input.totalSupply > 1 ? 'ERC-1155' : 'ERC-721',
        tokenId: tokenId,
        tokenPrice: input.tokenPrice,
        txHash: input.txHash
    };

    [err, activity] = await to(Activity.create(activityInput));
    if (err) {
        return ReE(res, {
            message: 'Activity create error'
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    res.status(200).send({
        message: "Mint submitted successfully",
        success: true,
        result: nft
    });

    let status;
    receipt = await createTx.wait();

    if (receipt.status === 1) {
        status = 'MINTED';
    } else {
        status = 'FAILED';
    }
    [err, nft] = await to(Nft.updateOne(
        {_id: nft._id},
        {status: status},
        {upsert: true}
    ));
    if (err) {
        return console.log("nftmint::update::error", err);
    }
    [err, activity] = await to(Activity.updateOne(
        {_id: activity._id},
        {status: status},
        {upsert: true}
    ));
    if (err) {
        return console.log("nftmint::update::error", err);
    }
    console.log(`Mint status updated for id: ${activityInput.tokenId}, at: ${Date()}`)
}
module.exports.mint = mint

const putOnSale = async (req, res) => {

    let err, nft, activity, newActivity, contract, nftContract, createTx, receipt;

    let body = req.body;
    let user = req.user;
    let itemId = Math.floor(1000000000 + Math.random() * 9000000000);

    if (isNull(body.actId)) return ReF(res, 'Activity Id')
    if (isNull(body.privateKey)) return ReF(res, 'PrivateKey')

    if (!ObjectId.isValid(body.actId)) return ReE(res, {
        message: "Enter a valid Activity Id"
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
        tokenPrice: activity.tokenPrice,
        itemId: itemId
    };

    if (activity.amount < tokenAmount) {
        return ReE(res, {
            message: 'Can not create sale more than minted amount'
        }, HttpStatus.INTERNAL_SERVER_ERROR)
    }

    let tokenPrice = ethers.utils.parseEther(activityInput.tokenPrice.toString());
    const wallet = new ethers.Wallet(body.privateKey, provider);

    if (activity.assetType === 'ERC-1155' && !isNull(body.tokenPrice) && body.tokenPrice > 0) {
        activityInput.tokenPrice = body.tokenPrice;
        tokenPrice = ethers.utils.parseEther(body.tokenPrice.toString());
    }

    if (activity.assetType === 'ERC-721') {

        contract = new ethers.Contract(
            CONFIG.nft_contract_721,
            Nft721Json.abi,
            wallet
        );

        try {
            let estimateGas = await contract.estimateGas.approve(
                CONFIG.market_contract_721, activity.tokenId
            );
            console.log("EstimatedGas", estimateGas.toString());
        } catch (error) {
            return ReE(res, {
                message: 'Gas estimation failed!',
                error: error
            }, HttpStatus.INTERNAL_SERVER_ERROR)
        }
        createTx = await contract.approve(CONFIG.market_contract_721, activity.tokenId);
        activityInput.txHash = createTx.hash;
    } else {

        nftContract = new ethers.Contract(
            CONFIG.nft_contract_1155,
            Nft1155Json.abi,
            wallet
        );
        contract = new ethers.Contract(
            CONFIG.market_contract_1155,
            Market1155Json.abi,
            wallet
        );

        try {
            let estimateGas = await contract.estimateGas.createSaleItem(
                CONFIG.nft_contract_1155, activity.tokenId,
                tokenPrice, tokenAmount, itemId
            );
            console.log("EstimatedGas", estimateGas.toString());
        } catch (error) {
            return ReE(res, {
                message: 'Gas estimation failed!',
                error: error
            }, HttpStatus.INTERNAL_SERVER_ERROR)
        }

        let approvalStatus = await nftContract.isApprovedForAll(wallet.address, CONFIG.market_contract_1155);

        if (!approvalStatus) {
            let approveContract = await nftContract.setApprovalForAll(CONFIG.market_contract_1155, true);
            let approveTx = await approveContract.wait();
            if (approveTx.status !== 1) {
                return ReE(res, {
                    message: 'Approval failed. Chain error!'
                }, HttpStatus.INTERNAL_SERVER_ERROR)
            }
        }

        createTx = await contract.createSaleItem(
            CONFIG.nft_contract_1155, activity.tokenId,
            tokenPrice, tokenAmount, itemId
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
    res.status(200).send({
        message: "Put on sale request submitted",
        success: true,
        result: newActivity
    });
    receipt = await createTx.wait();

    if (receipt.status === 1) {

        [err, nft] = await to(Nft.updateOne(
            {_id: nft._id},
            {status: "ONSALE", stockAvailable: nft.stockAvailable + tokenAmount},
            {upsert: true}
        ));
        if (err) {
            return console.log("putonsalenft::update::error", err);
        }
        [err, newActivity] = await to(Activity.updateOne(
            {_id: newActivity._id},
            {status: "ONSALE"},
            {upsert: true}
        ));
        if (err) {
            return console.log("putonsaleactivity::update::error", err);
        }
    } else {
        [err, newActivity] = await to(Activity.updateOne(
            {_id: newActivity._id},
            {status: "FAILED"},
            {upsert: true}
        ));
        if (err) {
            return console.log("putonsaleactivity::update::error", err);
        }
        [err, activity] = await to(Activity.updateOne(
            {_id: activity._id},
            {amount: activity.amount + tokenAmount},
            {upsert: true}
        ));
        if (err) {
            return console.log("putonsaleactivity::update::error", err);
        }
    }
    console.log(`Create Sale updated for id: ${activityInput.tokenId}, at: ${Date()}`)
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