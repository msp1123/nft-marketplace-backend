const CONFIG = require('../configs/global.configs');
const {User, Token, Block} = require('../models')
const {isEmpty, isNull, ReE, ReS, ReF, to, signJWT} = require('../services/utils.service')

module.exports.getLastUpdatedBlock = function (name) {
    return new Promise(async (resolve, reject) => {
        
        let count;
        [err, count] = await to(Block.findOne(
            {processName: name},
        ))

        if (err) {
            reject(err)
            return
        }
        if (!count) {
            count = {
                processName: name,
                block: 0,
            }
        }
        resolve(count)
    })
}
module.exports.updateSyncedBlock = function (name, blockNumber) {
    return new Promise(async (resolve, reject) => {

        let count;
        [err, count] = await to(Block.findOneAndUpdate(
            {processName: name},
            {block: blockNumber},
            {new: true}),
        )

        if (err) {
            reject(err)
            return
        }

        if (!count) {
            console.log('Creating new Collection counter');
            [err, count] = await to(Block.create({
                processName: name,
                block: blockNumber
            }))
            if (err) {
                reject(err)
                return
            }

            resolve(count)
            return
        }

        resolve(count)
    })
}

module.exports.getBlockIntervals = function (fromBlock, toBlock, intervalSize) {

    if (toBlock <= fromBlock) {
        throw ('toBlock number should be more than fromBlock')
    }

    let diff = toBlock - fromBlock
    let results = []

    console.log('Block difference:', diff)
    if ((diff) <= intervalSize) {

        results = [
            {
                fromBlock: fromBlock,
                toBlock: toBlock,
            }]

        return results
    }

    let intervalsCount = Math.round(diff / intervalSize)
    let startBlock = fromBlock

    console.log('IntervalsCount:', intervalsCount)
    console.log('FromBlock:', startBlock)
    console.log('ToBlock:', toBlock)

    while (startBlock < toBlock) {

        let endBlock = startBlock + 10000
        let currentDiff = toBlock - startBlock

        if (currentDiff < intervalSize) {

            results.push({
                fromBlock: startBlock,
                toBlock: toBlock,
            })
            startBlock = currentDiff
            break
        } else {
            results.push({
                fromBlock: startBlock,
                toBlock: endBlock,
            })
            startBlock = endBlock + 1
        }
    }
    return results
}

exports.supportedNetworks = function (req, res) {
    return ReS(res, CONFIG.supportedNetworks)
}
