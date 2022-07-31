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

CONFIG.chain_id = process.env.CHAINID || 4
CONFIG.network = process.env.NETWORK_NAME || 'rinkeby'
CONFIG.infura_key = process.env.INFURA_KEY || 'infura_key'
CONFIG.alchemy_key = process.env.ALCHEMY_KEY || 'alchemy_key'

CONFIG.nft_contract_address = process.env.NFT_CONTRACT_ADDRESS || '0x0'
CONFIG.market_contract_address = process.env.MARKET_CONTRACT_ADDRESS || '0x0'
CONFIG.storage_contract_address = process.env.STORAGE_CONTRACT_ADDRESS || '0x0'

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

CONFIG.editableUserFields = ['name', 'imageUrl', 'bio', 'social']
CONFIG.editableCollectionFields = ['name', 'description', 'image', 'category', 'external_url']
CONFIG.defaultImage = "https://marketplace-nft.s3.us-west-1.amazonaws.com/contract/default.png"

CONFIG.mintedQueueName = 'incoming-minted-events'
CONFIG.listedQueueName = 'incoming-listed-events'
CONFIG.boughtQueueName = 'incoming-bought-events'

CONFIG.supportedNetworks = [
    { chainId: 4, network: 'rinkeby', currency: 'ETH' },
    { chainId: 80001, network: 'maticmum', currency: 'MATIC' }
]

module.exports = CONFIG;