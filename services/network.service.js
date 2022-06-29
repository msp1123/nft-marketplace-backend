const moment = require('moment')
const { ethers } = require('ethers')
const CONFIG = require('../configs/global.configs')

const MarketContractJson = require('../json/TokenMarket.json')
const { createToken } = require('../controller/token.controller')

const {
    getLastUpdatedBlock,
    getBlockIntervals,
    updateSyncedBlock
} = require('../controller/block.controller')
const {
    saleCreated
} = require('../controller/contract.controller')

const provider = new ethers.providers.InfuraProvider(
    CONFIG.network,
    CONFIG.infura_key
);

provider.getBlockNumber().then((result) => {
    console.log('Current block number: ' + result)
})

const marketContract = new ethers.Contract(
    CONFIG.market_contract_address,
    MarketContractJson.abi,
    provider
);

const startMarketListener = async function () {
    marketContract.on('TokenMinted', (tokenId, owner, event) => {
        tokenMinted(tokenId, owner, event)
    });
    marketContract.on('TokenListed', (tokenId, owner, price, event) => {
        tokenListed(tokenId, owner, price, event)
    });
    marketContract.on('TokenBought', (tokenId, buyer, seller, price, event) => {
        tokenBought(tokenId, buyer, seller, price, event)
    });
    marketContract.on('TokenUpdated', (tokenId, owner, price, event) => {
        tokenUpdated(tokenId, owner, price, event)
    });
    marketContract.on('TokenBurned', (tokenId, owner, event) => {
        tokenBurnt(tokenId, owner, event)
    });
}

const tokenMinted = async function (tokenId, owner, event) {

    createToken(tokenId).catch(e => {
        if (e.message.includes("E11000")) {
            console.log(`Token ${tokenId} already created`)
            return
        }
        console.error('Error updating create event:', e.message)
    })
}
const tokenListed = async function (tokenId, owner, price, event) {
    saleCreated(tokenId, owner, price, 1, event.transactionHash )
}
const tokenBought = async function (tokenId, buyer, seller, price, event) {

    tokenPurchased(tokenId, buyer, seller, price, event.transactionHash).catch(e => {
        if (e.message.includes("E11000")) {
            console.log(`Token ${tokenId} already purchased`)
            return
        }
        console.error('Error updating purchase event:', e.message)
    })
}
const tokenUpdated = async function (tokenId, owner, price, event) {

    priceUpdated(tokenId, owner, price, event.transactionHash).catch(e => {
        if (e.message.includes("E11000")) {
            console.log(`Token ${tokenId} already price updated`)
            return
        }
        console.error('Error updating price update event:', e.message)
    })
}
const tokenBurnt = async function (tokenId, owner, event) {

    burnToken(tokenId, owner, event.transactionHash).catch(e => {
        if (e.message.includes("E11000")) {
            console.log(`Token ${tokenId} already burned`)
            return
        }
        console.error('Error updating burn event:', e.message)
    })
}

const filterMarketEvents = async function () {

    let currentDate = moment.utc();
    console.log(`Market Event Sync run at ${currentDate.format()} ${currentDate.unix()}`)

    let processInfo = await getLastUpdatedBlock('market_sync_event_block')
    let currentBlock = await provider.getBlockNumber()
    let intervals = getBlockIntervals(processInfo.block, currentBlock, 10000)

    intervals.map(async interval => {

        let fromBlock = interval.fromBlock;
        let toBlock = interval.toBlock;

        let mintEvents;
        let listingEvents;
        let boughtEvents;
        let updateEvents;
        let burnEvents;
        try {
            mintEvents = await marketContract.queryFilter(
                'TokenMinted', fromBlock, toBlock);
            listingEvents = await marketContract.queryFilter(
                'TokenListed', fromBlock, toBlock);
            boughtEvents = await marketContract.queryFilter(
                'TokenBought', fromBlock, toBlock);
            updateEvents = await marketContract.queryFilter(
                'TokenUpdated', fromBlock, toBlock);
            burnEvents = await marketContract.queryFilter(
                'TokenBurned', fromBlock, toBlock);
        } catch (e) {
            console.error('Error filtering:', e)
        }

        console.log(`From: ${fromBlock}, To: ${toBlock}`);
        console.log(`Mint events: ${mintEvents.length}`)
        console.log(`Listing events: ${listingEvents.length}`)
        console.log(`Bought events: ${boughtEvents.length}`)
        console.log(`Update events: ${updateEvents.length}`)
        console.log(`Burn events: ${burnEvents.length}`)

        mintEvents.map(event => {
            const { tokenId, owner } = event.args
            tokenMinted(tokenId, owner, event)
        })
        listingEvents.map(event => {
            const { tokenId, owner, price } = event.args
            tokenListed(tokenId, owner, price, event)
        })
        boughtEvents.map(event => {
            const { tokenId, buyer, seller, price } = event.args
            tokenBought(tokenId, buyer, seller, price, event)
        })
        updateEvents.map(event => {
            const { tokenId, owner, price } = event.args
            tokenUpdated(tokenId, owner, price, event)
        })
        burnEvents.map(event => {
            const { tokenId, owner } = event.args
            tokenBurnt(tokenId, owner, event)
        })
    })

    console.log('Saving last block number:', currentBlock)
    updateSyncedBlock('market_sync_event_block', currentBlock)
}
