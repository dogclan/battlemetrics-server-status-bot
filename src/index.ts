import StatusBot from './bot';
import Config from './config';
import logger from './logger';

logger.info('Starting status bot');
const bot = new StatusBot(Config.DISCORD_TOKEN, Config.SERVER_ID, Config.UPDATE_USERNAME);
