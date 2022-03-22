const CONFIG = require('../config/global.configs')
const {to} = require('./util.service')
const amqp = require('amqplib')

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
