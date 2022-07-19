const {ethers} = require('ethers')
const CONFIG = require('../configs/global.configs')
const {logger} = require('../configs/winston.config')
const TokenAssetJson = require('../json/TokenAsset.json')
const TokenMarketJson = require('../json/TokenMarket.json')

const provider = new ethers.providers.InfuraProvider(
    CONFIG.network,
    CONFIG.infura_key
)

const marketContract = new ethers.Contract(
    CONFIG.market_contract_address,
    TokenMarketJson.abi,
    provider
)

const assetContract = new ethers.Contract(
    CONFIG.nft_contract_address,
    TokenAssetJson.abi,
    provider
)

const marketWalletSigner = function(privatekey) {
    const wallet = new ethers.Wallet(privatekey, provider);
    return new ethers.Contract(
        CONFIG.market_contract_address,
        TokenMarketJson.abi,
        wallet
    )
}

module.exports = {
    marketWalletSigner,
    marketContract,
    assetContract,
    provider
}
