require('dotenv').config();

let CONFIG = {}

CONFIG.app = process.env.APP || 'dev';
CONFIG.port = process.env.PORT || '3200';

CONFIG.access_key = process.env.AWS_ACCESSKEY || 'access_key'
CONFIG.secret_key = process.env.AWS_SECRETKEY || 'secret_key'
CONFIG.bucket_name = process.env.AWS_BUCKET_NAME || 'marketplace-nft'

CONFIG.db_uri = process.env.MONGODB_URI || 'mongodb://username:password@mlab.com:27017/db';
CONFIG.rabbitmq_url = process.env.QUEUE_URL || 'http://localhost';

CONFIG.network = process.env.NETWORK_NAME || 'rinkeby'
CONFIG.infura_key = process.env.INFURA_KEY || 'infura_key'

CONFIG.nft_contract_721 = process.env.NFT_CONTRACT_721 || '0x0'
CONFIG.nft_contract_1155 = process.env.NFT_CONTRACT_1155 || '0x0'
CONFIG.market_contract_721 = process.env.MARKET_CONTRACT_721 || '0x0'
CONFIG.market_contract_1155 = process.env.MARKET_CONTRACT_1155 || '0x0'

CONFIG.sync_interval_mins = process.env.SYNC_INTERVAL_MINS || '60'
CONFIG.start_sync_service_721 = process.env.START_SYNC_SERVICE_721 || 'false'
CONFIG.start_sync_service_1155 = process.env.START_SYNC_SERVICE_1155 || 'false'
CONFIG.start_event_listener_721 = process.env.START_EVENT_LISTENER_721 || 'false'
CONFIG.start_event_listener_1155 = process.env.START_EVENT_LISTENER_1155 || 'false'

CONFIG.jwt_encryption = process.env.JWT_ENCRYPTION || 'jwt_encryption';
CONFIG.jwt_expiration = process.env.JWT_EXPIRATION || '86400';

CONFIG.mail_email_id = process.env.MAIL_EMAIL_ID;
CONFIG.report_receiver = process.env.REPORT_RECEIVER;
CONFIG.mail_password = process.env.MAIL_PASSWORD;
CONFIG.verify_email = process.env.VERIFY_EMAIL || 'false';
CONFIG.mail_service_provider = process.env.MAIL_SERVICE_PROVIDER;

module.exports = CONFIG;
