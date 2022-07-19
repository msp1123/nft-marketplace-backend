const {getChannel} = require('../services/queue.service')
const {logger} = require('../configs/winston.config')
const CONFIG = require('../configs/global.configs')
const {bought} = require('../controller/token.controller')

getChannel(CONFIG.boughtQueueName, 'dlx-' + CONFIG.boughtQueueName)
    .then(ch => {
        startVoughtEventConsumer(ch)
    })
    .catch(e => {
        logger.error(`#Buy Queue Consumer: AMQP connection error: ${e}`)
    })

function startVoughtEventConsumer(channel) {
    
    channel.prefetch(1)
    
    channel.consume(CONFIG.boughtQueueName, async function (msg) {
        
        console.log('#Buy Event Message:', msg.content.toString())
        let buyEvent = JSON.parse(msg.content)
        
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
        } = buyEvent
        
        try {
            await bought(
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
                `#Buy Queue Consumer: Message rejected. ${msg.content.toString()} ${e}`)
            channel.nack(msg, false, false) //false false to send to DLX
            return
        }
        
        channel.ack(msg)
    }, {noAck: false})
}
