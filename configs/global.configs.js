require('dotenv').config();

let CONFIG = {}

CONFIG.app = process.env.APP || 'dev';
CONFIG.api_port = process.env.API_PORT || '3200'
CONFIG.service_port = process.env.SERVICE_PORT || '3400'

CONFIG.access_key = process.env.AWS_ACCESSKEY || 'access_key'
CONFIG.secret_key = process.env.AWS_SECRETKEY || 'secret_key'
CONFIG.bucket_name = process.env.AWS_BUCKET_NAME || 'marketplace-nft'

CONFIG.rabbitmq_url = process.env.QUEUE_URL || 'http://localhost'
CONFIG.db_uri = process.env.MONGODB_URI || 'mongodb://username:password@mlab.com:27017/db'

CONFIG.start_listener = process.env.START_LISTENER || 'false'
CONFIG.sync_interval_mins = process.env.SYNC_INTERVAL_MINS || '30'
CONFIG.sync_market_events = process.env.SYNC_MARKET_EVENTS || 'false'

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

CONFIG.editableUserFields = ['name', 'imageUrl', 'bio', 'social']
CONFIG.editableCollectionFields = ['name', 'description', 'image', 'category', 'external_url']
CONFIG.defaultImage = "https://marketplace-nft.s3.us-west-1.amazonaws.com/contract/default.png"

CONFIG.supportedNetworks = [
    { 
        chainId: 4,
        network: 'rinkeby',
        nftContractAddress: "0x5b969CD05Ab5bDcA3D810E84626403b79676f69e",
        marketContractAddress: "0xB94f3B3e9E45502dF4B7FCAcF18f64D39C10B5b0",
        storageContractAddress: "0xc17a9bb9836097abFC97d80bf208E539AB9fe33A",
        rpcUrl: "https://rinkeby.infura.io/v3/d548afae3db6401695198727c33730d0",
    },
    {
        chainId: 80001,
        network: 'mumbai',
        nftContractAddress: "0x7f422216Fd0cccC03E8e38b606A50a2c5770D0d4",
        marketContractAddress: "0xc015f83c9998773Ba9D52Fb87507636d0F14e1C3",
        storageContractAddress: "0x945C8bbC099326f4C9646980e6614715E86b6729",
        rpcUrl: "https://polygon-mumbai.g.alchemy.com/v2/ddaaukW4Z0rD4IDbZvaaDEgRcL2xvaUp",
    }
]

module.exports = CONFIG;