const Block = require('../models/block.model')
const {isNull, isEmpty} = require('../utils/validations')
const {to} = require('../utils/response')

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
            
            [err, count] = await to(
                Block.create({processName: name, block: blockNumber}))
            
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
    
    console.log('IntervalsCount:', intervalsCount)
    
    let startBlock = fromBlock
    
    console.log('startBlock:', startBlock)
    console.log('toBlock:', toBlock)
    
    while (startBlock < toBlock) {
        
        let endBlock = startBlock + 10000
        
        let currentDiff = toBlock - startBlock
        // console.log('currentDiff: ', currentDiff)
        // console.log('intervalSize: ', intervalSize)
        
        if (currentDiff < intervalSize) {
            // console.log('set remaining')
            
            results.push({
                fromBlock: startBlock,
                toBlock: toBlock,
            })
            
            startBlock = currentDiff
            break
        } else {
            // console.log('set next')
            
            results.push({
                fromBlock: startBlock,
                toBlock: endBlock,
            })
            startBlock = endBlock + 1
        }
        
    }
    
    return results
    
}
