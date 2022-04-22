const moment = require('moment')
const CONFIG = require('../configs/global.configs')
const { ethers } = require('ethers')

const Market721Json = require('../json/Market721.json')
const Market1155Json = require('../json/Market1155.json')
const { createToken } = require('../controller/token.controller')

const {
    ToadScheduler,
    SimpleIntervalJob,
    AsyncTask
} = require('toad-scheduler')
const {
    getLastUpdatedBlock,
    getBlockIntervals,
    updateSyncedBlock
} = require('../controller/block.controller')
const { tokenMinted, saleCreated } = require('../controller/contract.controller')

const provider = new ethers.providers.InfuraProvider(CONFIG.network,
    CONFIG.infura_key)

provider.getBlockNumber().then((result) => {
    console.log('Current block number: ' + result)
})

const marketContract721 = new ethers.Contract(
    CONFIG.market_contract_721, Market721Json.abi,
    provider)

const startListener721 = async function () {
    marketContract721.on('TokenCreated', (tokenId, owner, event) => {
        tokenCreated(tokenId, owner, event)
    });
    marketContract721.on('TokenOnSale', (tokenId, owner, price, event) => {
        tokenOnSale(tokenId, owner, price, event)
    });
    marketContract721.on('TokenBought', (tokenId, buyer, seller, price, event) => {
        tokenBought(tokenId, buyer, seller, price, event)
    });
    marketContract721.on('TokenPriceUpdated', (tokenId, owner, price, event) => {
        tokenPriceUpdated(tokenId, owner, price, event)
    });
    marketContract721.on('TokenBurnt', (tokenId, owner, event) => {
        tokenBurnt(tokenId, owner, event)
    });
}

const tokenCreated = async function (tokenId, owner, event) {

    createToken(tokenId).catch(e => {
        if (e.message.includes("E11000")) {
            console.log(`Token ${tokenId} already created`)
            return
        }
        console.error('Error updating create event:', e.message)
    })
    tokenMinted(tokenId.toNumber(), owner, event.transactionHash);
}
const tokenOnSale = async function (tokenId, owner, price, event) {
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
const tokenPriceUpdated = async function (tokenId, owner, price, event) {

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

const filterEvents721 = async function () {

    let currentDate = moment.utc();
    console.log(`ERC-721 Event Sync run at ${currentDate.format()} ${currentDate.unix()}`)

    let processInfo = await getLastUpdatedBlock('market_sync_events_721')
    let currentBlock = await provider.getBlockNumber()
    let intervals = getBlockIntervals(processInfo.block, currentBlock, 10000)

    intervals.map(async interval => {

        let fromBlock = interval.fromBlock;
        let toBlock = interval.toBlock;

        let createEvents;
        let saleEvents;
        let buyEvents;
        let priceEvents;
        let burnEvents;
        try {
            createEvents = await marketContract721.queryFilter(
                'TokenCreated', fromBlock, toBlock);
            saleEvents = await marketContract721.queryFilter(
                'TokenOnSale', fromBlock, toBlock);
            buyEvents = await marketContract721.queryFilter(
                'TokenBought', fromBlock, toBlock);
            priceEvents = await marketContract721.queryFilter(
                'TokenPriceUpdated', fromBlock, toBlock);
            burnEvents = await marketContract721.queryFilter(
                'TokenBurnt', fromBlock, toBlock);
        } catch (e) {
            console.error('ERC-721 Error filtering:', e)
        }

        console.log(`ERC-721: From: ${fromBlock}, To: ${toBlock}`);
        console.log(`Create events: ${createEvents.length}`)
        console.log(`Sale events: ${saleEvents.length}`)
        console.log(`Buy events: ${buyEvents.length}`)
        console.log(`Price events: ${priceEvents.length}`)
        console.log(`Burn events: ${burnEvents.length}`)

        createEvents.map(event => {
            const { tokenId, owner } = event.args
            tokenCreated(tokenId, owner, event)
        })
        saleEvents.map(event => {
            const { tokenId, owner, price } = event.args
            tokenOnSale(tokenId, owner, price, event)
        })
        buyEvents.map(event => {
            const { tokenId, buyer, seller, price } = event.args
            tokenBought(tokenId, buyer, seller, price, event)
        })
        priceEvents.map(event => {
            const { tokenId, owner, price } = event.args
            tokenPriceUpdated(tokenId, owner, price, event)
        })
        burnEvents.map(event => {
            const { tokenId, owner } = event.args
            tokenBurnt(tokenId, owner, event)
        })
    })

    console.log('Saving last block number:', currentBlock)
    updateSyncedBlock('market_sync_events_721', currentBlock)
}

const scheduler = new ToadScheduler()
jobOptions = {
    minutes: CONFIG.sync_interval_mins,
    runImmediately: true
}

const task721 = new AsyncTask(
    'market_events_721',
    filterEvents721,
    (err) => {
        console.error(err)
    }
)

const job721 = new SimpleIntervalJob(jobOptions,
    task721, "sync_market_event_721")

if (CONFIG.start_event_listener_721 === 'true') {
    console.log("ERC-721 Event listener started...");
    startListener721().catch(e => {
        console.log(`ERC-721 Listener error: ${e}`)
    })
}

if (CONFIG.start_sync_service_721 === 'true') {
    scheduler.addSimpleIntervalJob(job721)
}

