const mongoose = require('mongoose')
const Schema = mongoose.Schema
const mongoosePaginate = require('mongoose-paginate-v2')

const NftSchema = new mongoose.Schema({
    active: {
        type: String,
        default: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'MINTED', 'ONSALE', 'FAILED', 'BLOCKED'],
        default: "PENDING"
    },
    popularity: {
        type: String,
        enum: ['COMMON', 'RARE', 'LEGENDARY_RARE', 'ULTRA_RARE'],
        default: "COMMON"
    },
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    previewImage: {
        type: String,
        required: true
    },
    attachments: [
        {
            url: {
                type: String,
                required: true
            },
            fileType: {
                type: String,
                enum: ['IMAGE', 'VIDEO'],
                default: "IMAGE",
                required: true
            },
        },
    ],
    tokenId: {
        type: Number,
        required: true
    },
    totalSupply: {
        type: Number,
        required: true
    },
    likes: {
        type: Number,
        default: 0
    },
    comments: {
        type: Number,
        default: 0
    },
    tokenPrice: {
        type: Number,
        default: 0
    },
    stockAvailable: {
        type: Number,
        default: 0
    },
    chainName: {
        type: String,
        default: "Ethereum"
    },
    assetType: {
        type: String,
        required: true
    },
    marketAddress: {
        type: String,
        required: true
    },
    nftAddress: {
        type: String,
        required: true
    },
    txHash: {
        type: String,
    },
    metadata: {
        type: String,
    },
    royalty: {
        type: Number,
        default: 5
    },
}, {
    timestamps: true
});

NftSchema.plugin(mongoosePaginate)

const Nft = module.exports = mongoose.model('Nft', NftSchema);