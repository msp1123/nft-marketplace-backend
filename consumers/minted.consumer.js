const {getChannel} = require('../services/queue.service')
const {logger} = require('../config/winston.config')
const CONFIG = require('../configs/global.configs')

getChannel(CONFIG.mintedQueueName, 'dlx-' + CONFIG.mintedQueueName)
    .then(ch => {
        startMintedEventConsum(ch)
    })
    .catch(e => {
        logger.info(`Token Minted Event Consumer AMQP connection error: ${e}`)
    })

function startMintedEventConsum (channel) {
    
    channel.prefetch(1)
    
    channel.consume(queueName, async function (msg) {
        
        console.log('Transfer Event Message:', msg.content.toString())
        console.log('.....')
        
        let transferEvent = JSON.parse(msg.content)
        
        const {
            operator,
            from,
            to,
            tokenId,
            amount,
            blockNumber,
            timestamp,
            chainId,
            txHash,
        } = transferEvent
        
        try {
            await createTransferEvent(operator, from, to, tokenId, amount,
                blockNumber, timestamp, chainId, txHash)
        } catch (e) {
            logger.info(
                `Transfer Consumer: Error creating transfer event, message rejected. ${msg.content.toString()} ${e}`)
            channel.nack(msg, false, false) //false false to send to DLX
            return
        }
        
        channel.ack(msg)
    }, {noAck: false})
}
