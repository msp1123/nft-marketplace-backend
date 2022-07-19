const moment = require('moment')
const {ethers} = require('ethers')
const CONFIG = require('../configs/global.configs')
const {logger} = require('../configs/winston.config')
const TokenMarketJson = require('../json/TokenMarket.json')
const {
    pushMintEvent,
    pushListedEvent,
    pushBoughtEvent
} = require('../controller/queue.controller')
const {
    updateSyncedBlock,
    getBlockIntervals,
    getLastUpdatedBlock
} = require('../controller/block.controller')
const {waitFor} = require('./utils.service')
const {provider, marketContract} = require('./ethers.provider')

const startListener = async function () {
    marketContract.on('TokenMinted',
        (nftAddress, tokenId, amount, owner, event) => {
            pushMintEvent(
                nftAddress,
                tokenId,
                amount,
                owner,
                event.transactionHash,
                CONFIG.chain_id
            )
        }
    );
    marketContract.on('TokenListed',
        (standard, nftAddress, tokenId, itemId, amount, price, owner, event) => {
            pushListedEvent(
                standard,
                nftAddress,
                tokenId,
                itemId,
                amount,
                price,
                owner,
                event.transactionHash,
                CONFIG.chain_id
            )
        }
    );
    marketContract.on('TokenBought',
        (standard, nftAddress, tokenId, itemId, amount, price, owner, event) => {
            pushBoughtEvent(
                standard,
                nftAddress,
                tokenId,
                itemId,
                amount,
                price,
                owner,
                event.transactionHash,
                CONFIG.chain_id
            )
        }
    );
}

const filterEvents = async function () {
   
    let currentDate = moment.utc()
    let currentBlock = await provider.getBlockNumber()
    let processInfo = await getLastUpdatedBlock('filter_market_events')
    
    let fromBlock = processInfo.block
    let intervals = getBlockIntervals(processInfo.block, currentBlock, 10000)
    
    let totalEvents
    await Promise.all(intervals.map(async interval => {
        
        let fromBlock = interval.fromBlock
        let toBlock = interval.toBlock
        
        let mintEvents
        let listedEvents
        let boughtEvents
        try {
            mintEvents = await marketContract.queryFilter(
                'TokenMinted', fromBlock, toBlock)
            listedEvents = await marketContract.queryFilter(
                'TokenListed', fromBlock, toBlock)
            boughtEvents = await marketContract.queryFilter(
                'TokenBought', fromBlock, toBlock)
        } catch (e) {
            logger.error(`#Filter event: Filter Market Events failed with error: ${e}`)
        }
        
        mintEvents.map(event => {
            const {nftAddress, tokenId, amount, owner} = event.args
            pushMintEvent(
                nftAddress,
                tokenId,
                amount,
                owner,
                event.transactionHash,
                CONFIG.chain_id
            )
        })
        listedEvents.map(event => {
            const {standard, nftAddress, tokenId, itemId, amount, owner, price} = event.args
            pushListedEvent(
                standard,
                nftAddress,
                tokenId,
                itemId,
                amount,
                price,
                owner,
                event.transactionHash,
                CONFIG.chain_id
            )
        })
        boughtEvents.map(event => {
            const {standard, nftAddress, tokenId, itemId, amount, price, owner} = event.args
            pushBoughtEvent(
                standard,
                nftAddress,
                tokenId,
                itemId,
                amount,
                price,
                owner,
                event.transactionHash,
                CONFIG.chain_id
            )
        })
        totalEvents = mintEvents.length +  listedEvents.length + boughtEvents.length
    }))
    
    updateSyncedBlock('filter_market_events', currentBlock)
    logger.info(`#Filter event: Total events: ${totalEvents}, from: ${fromBlock}, to: ${currentBlock})`)
}

if(CONFIG.start_listener === 'true'){
    console.log(`Events listener started`);
    startListener()
}
if(CONFIG.sync_market_events === 'true'){
    filterEvents()
}
