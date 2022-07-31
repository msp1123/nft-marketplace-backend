const {ethers} = require('ethers')
const CONFIG = require('../configs/global.configs')
const {logger} = require('../configs/winston.config')
const TokenAssetJson = require('../json/TokenAsset.json')
const TokenMarketJson = require('../json/TokenMarket.json')
const TokenStorageJson = require('../json/TokenStorage.json')

let networkSigners = {};

for (let i = 0; i < CONFIG.supportedNetworks.length; i++) {
    const network = CONFIG.supportedNetworks[i];

    const provider = new ethers.providers.JsonRpcProvider(network.rpcUrl)

    const assetContract = new ethers.Contract(
        network.nftContractAddress,
        TokenAssetJson.abi,
        provider
    )
    
    const storageContract = new ethers.Contract(
        network.storageContractAddress,
        TokenStorageJson.abi,
        provider
    )
    
    const marketContract = new ethers.Contract(
        network.marketContractAddress,
        TokenMarketJson.abi,
        provider
    )
    
    const marketWalletSigner = function (privatekey) {
        const wallet = new ethers.Wallet(privatekey, provider);
        return new ethers.Contract(
            network.marketContractAddress,
            TokenMarketJson.abi,
            wallet
        )
    }
    
    networkSigners[`${network.chainId}`] = {
        network: network.network,
        provider: provider,
        asset: assetContract,
        market: marketContract,
        storage: storageContract,
        wallet: marketWalletSigner
    }
}

exports.getSigner = function (chainId) {
    return networkSigners[`${chainId}`]
}

exports.getSigners = networkSigners