const {getChannel} = require('../services/queue.service')
const {logger} = require('../configs/winston.config')
const CONFIG = require('../configs/global.configs')
const {listed} = require('../controller/token.controller')

getChannel(CONFIG.listedQueueName, 'dlx-' + CONFIG.listedQueueName)
    .then(ch => {
        startListedEventConsumer(ch)
    })
    .catch(e => {
        logger.error(`#List Queue Consumer: AMQP connection error: ${e}`)
    })

function startListedEventConsumer(channel) {
    
    channel.prefetch(1)
    
    channel.consume(CONFIG.listedQueueName, async function (msg) {
        
        console.log('#List Event Message:', msg.content.toString())
        let listEvent = JSON.parse(msg.content)
        
        const {
            standard,
            nftAddress,
            tokenId,
            itemId,
            amount,
            price,
            owner,
            txHash,
            chainId
        } = listEvent
        
        try {
            await listed(
                standard,
                nftAddress,
                tokenId,
                itemId,
                amount,
                price,
                owner,
                txHash,
                chainId
            );
        } catch (e) {
            logger.error(
                `#List Queue Consumer: Message rejected. ${msg.content.toString()} ${e}`)
            channel.nack(msg, false, false) //false false to send to DLX
            return
        }
        
        channel.ack(msg)
    }, {noAck: false})
}
