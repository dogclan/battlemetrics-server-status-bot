import StatusBot, { BotTreatment } from './bot';
import Config from './config';
import logger from './logger';

logger.info('Starting status bot');
const bot = new StatusBot(Config.TOKEN, Config.SERVER_IP, Config.SERVER_PORT, Config.BOT_TREATMENT as BotTreatment, Config.UPDATE_USERNAME);
