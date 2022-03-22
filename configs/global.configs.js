require('dotenv').config();

let CONFIG = {}

CONFIG.app = process.env.APP || 'dev';
CONFIG.port = process.env.PORT || '3200';

CONFIG.db_uri = process.env.MONGODB_URI || 'mongodb://username:password@mlab.com:27017/db';
CONFIG.rabbitmq_url = process.env.QUEUE_URL || 'http://localhost';

CONFIG.network = process.env.NETWORK_NAME || 'rinkeby'
CONFIG.infura_key = process.env.INFURA_KEY || 'infura_key'

CONFIG.jwt_encryption = process.env.JWT_ENCRYPTION || 'jwt_encryption';
CONFIG.jwt_expiration = process.env.JWT_EXPIRATION || '86400';

CONFIG.mail_email_id = process.env.MAIL_EMAIL_ID;
CONFIG.mail_password = process.env.MAIL_PASSWORD;
CONFIG.verify_email = process.env.VERIFY_EMAIL || 'false';
CONFIG.mail_service_provider = process.env.MAIL_SERVICE_PROVIDER;

module.exports = CONFIG;
