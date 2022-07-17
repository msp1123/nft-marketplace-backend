const CONFIG = require('../configs/global.configs')
const {to} = require('./utils.service')
const amqp = require('amqplib')

// RabbitMq channel initializer
const getChannel = async (queueName, dlxName) => {
    
    let err, conn;
    [err, conn] = await to(amqp.connect(CONFIG.rabbitmq_url))
    
    if (err) {
        console.log(`[${queueName}] AMQP connection error`, err)
        throw err
    }
    
    console.log(`[${queueName}] AMQP Connected`)
    
    conn.on('error', function (err) {
        console.error(`[${queueName}] AMQP Connection error`, err)
    })
    
    conn.on('close', async function () {
        console.error(`[${queueName}] AMQP Connection Closed, reconnecting`);
        [err, conn] = await to(amqp.connect(CONFIG.rabbitmq_url))
    })
    
    let channel;
    [err, channel] = await to(conn.createChannel())
    if (err) {
        throw err
    }
    
    try {
        channel.assertQueue(queueName, {
            durable: true,
            deadLetterExchange: dlxName || undefined,
        })
    } catch (e) {
        throw e
    }
    
    process.on('exit', () => {
        conn.close()
        console.log(`[${queueName}] Closing AMQP connection`)
    })
    
    return channel
    
}
module.exports.getChannel = getChannel

let mintedTokenChannel
let listedTokenChannel
let boughtTokenChannel

const mintEventChannel = async function() {
    if(mintedTokenChannel) {
        console.log("1");
        return mintedTokenChannel
    }else{
        console.log("2");
        try {
            mintedTokenChannel = await getChannel(
                CONFIG.mintedQueueName, 'dlx-' + CONFIG.mintedQueueName);
            return mintedTokenChannel
        } catch (error) {
            logger.info(`Token Minted Event AMQP connection error: ${e}`)
            return
        }
    }
}
module.exports.mintEventChannel = mintEventChannel

const listEventChannel = async function() {
    if(listedTokenChannel) {
        console.log("1");
        return listedTokenChannel
    }else{
        console.log("2");
        try {
            listedTokenChannel = await getChannel(
                CONFIG.listedQueueName, 'dlx-' + CONFIG.listedQueueName);
            return listedTokenChannel
        } catch (error) {
            logger.info(`Token Minted Event AMQP connection error: ${e}`)
            return
        }
    }
}
module.exports.listEventChannel = listEventChannel

const buyEventChannel = async function() {
    if(boughtTokenChannel) {
        console.log("1");
        return boughtTokenChannel
    }else{
        console.log("2");
        try {
            boughtTokenChannel = await getChannel(
                CONFIG.boughtQueueName, 'dlx-' + CONFIG.boughtQueueName);
            return boughtTokenChannel
        } catch (error) {
            logger.info(`Token Minted Event AMQP connection error: ${e}`)
            return
        }
    }
}
module.exports.buyEventChannel = buyEventChannel