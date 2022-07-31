const moment = require('moment')
const {ethers} = require('ethers')
const CONFIG = require('../configs/global.configs')
const {logger} = require('../configs/winston.config')
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
const Network = require('./ethers.provider')

for (const key in Network.getSigners) {
    if (Object.hasOwnProperty.call(Network.getSigners, key)) {
        const signer = Network.getSigners[key];
        
        const startListener = async function () {
            signer.market.on('TokenMinted',
                (nftAddress, tokenId, amount, owner, event) => {
                    pushMintEvent(
                        nftAddress,
                        tokenId,
                        amount,
                        owner,
                        event.transactionHash,
                        parseInt(key)
                    )
                }
            );
            signer.market.on('TokenListed',
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
                        parseInt(key)
                    )
                }
            );
            signer.market.on('TokenBought',
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
                        parseInt(key)
                    )
                }
            );
        }

        const filterEvents = async function () {

            let currentDate = moment.utc()
            let currentBlock = await signer.provider.getBlockNumber()
            let processInfo = await getLastUpdatedBlock('filter_market_events_' + signer.network)

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
                    mintEvents = await signer.market.queryFilter(
                        'TokenMinted', fromBlock, toBlock
                    )
                    mintEvents.map(event => {
                        const {nftAddress, tokenId, amount, owner} = event.args
                        pushMintEvent(
                            nftAddress,
                            tokenId,
                            amount,
                            owner,
                            event.transactionHash,
                            parseInt(key)
                        )
                    })
                    
                    listedEvents = await signer.market.queryFilter(
                        'TokenListed', fromBlock, toBlock
                    )
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
                            parseInt(key)
                        )
                    })
                    
                    boughtEvents = await signer.market.queryFilter(
                        'TokenBought', fromBlock, toBlock
                    )
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
                            parseInt(key)
                        )
                    })
                } catch (e) {
                    logger.error(`#Filter event ${signer.network}: Filter Market Events failed with error: ${e}`)
                    return
                }
                totalEvents = mintEvents.length + listedEvents.length + boughtEvents.length
            }))

            updateSyncedBlock('filter_market_events_' + signer.network, currentBlock)
            logger.info(`#Filter event ${signer.network}: Total events: ${totalEvents}, from: ${fromBlock}, to: ${currentBlock})`)
        }

        if (CONFIG.start_listener === 'true') {
            console.log(`Events listener started #${signer.network}`);
            startListener()
        }
        if (CONFIG.sync_market_events === 'true') {
            filterEvents()
        }
    }
}