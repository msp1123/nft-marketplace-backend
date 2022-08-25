require('dotenv').config();

let CONFIG = {}

CONFIG.app = process.env.APP || 'dev';
CONFIG.api_port = process.env.API_PORT || '3200'
CONFIG.service_port = process.env.SERVICE_PORT || '3400'

CONFIG.access_key = process.env.AWS_ACCESSKEY || 'access_key'
CONFIG.secret_key = process.env.AWS_SECRETKEY || 'secret_key'
CONFIG.bucket_name = process.env.AWS_BUCKET_NAME || 'nft-market'

CONFIG.rabbitmq_url = process.env.QUEUE_URL || 'http://localhost'
CONFIG.db_uri = process.env.MONGODB_URI || 'mongodb://username:password@mlab.com:27017/db'

CONFIG.start_listener = process.env.START_LISTENER || 'false'
CONFIG.sync_interval_mins = process.env.SYNC_INTERVAL_MINS || '30'
CONFIG.sync_market_events = process.env.SYNC_MARKET_EVENTS || 'false'

CONFIG.event_sync_for = [4, 80001]
CONFIG.event_listeners_for = [4, 80001]

CONFIG.jwt_expiration = process.env.JWT_EXPIRATION || '86400';
CONFIG.jwt_encryption = process.env.JWT_ENCRYPTION || 'jwt_encryption'

CONFIG.mail_email_id = process.env.MAIL_EMAIL_ID
CONFIG.mail_password = process.env.MAIL_PASSWORD
CONFIG.report_receiver = process.env.REPORT_RECEIVER
CONFIG.verify_email = process.env.VERIFY_EMAIL || 'false'
CONFIG.mail_service_provider = process.env.MAIL_SERVICE_PROVIDER

CONFIG.mintedQueueName = 'incoming-minted-events'
CONFIG.listedQueueName = 'incoming-listed-events'
CONFIG.boughtQueueName = 'incoming-bought-events'

CONFIG.userPopulatable = '_id address imageUrl name bio followers followings popularity social'
CONFIG.nftCategories = ['Art', 'Collectibles', 'Photography', 'Music', 'Video']
CONFIG.tokenStatus = ['Listed', 'Sold', 'Minted', 'Burned']
CONFIG.editableUserFields = ['name', 'imageUrl', 'bio', 'social']
CONFIG.editableCollectionFields = ['name', 'description', 'image', 'category', 'external_url']
CONFIG.defaultImage = "https://nft-market.s3.us-west-1.amazonaws.com/contract/nft-main.png"

CONFIG.supportedNetworks = [
    {
        chainId: 4,
        network: 'rinkeby',
        displayName: "Rinkeby",
        explorerUrl: "https://rinkeby.etherscan.io",
        nftContractAddress: "0x14367A449dEf50911166E47E312C898fe3Cc625d",
        marketContractAddress: "0xE839c3faE3e9c5F1713A5B1d7ed1E208ff050448",
        storageContractAddress: "0xA4f57C27a329A0cf16184B99aDaDFebA2aa87f30",
        rpcUrl: "https://rinkeby.infura.io/v3/d548afae3db6401695198727c33730d0",
    },
    {
        chainId: 80001,
        network: 'mumbai',
        displayName: "Mumbai",
        explorerUrl: "https://mumbai.polygonscan.com",
        nftContractAddress: "0x7f422216Fd0cccC03E8e38b606A50a2c5770D0d4",
        marketContractAddress: "0xc015f83c9998773Ba9D52Fb87507636d0F14e1C3",
        storageContractAddress: "0x945C8bbC099326f4C9646980e6614715E86b6729",
        rpcUrl: "https://polygon-mumbai.g.alchemy.com/v2/ddaaukW4Z0rD4IDbZvaaDEgRcL2xvaUp",
    }
]

module.exports = CONFIG;