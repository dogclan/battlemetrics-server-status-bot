import axios from 'axios';
import { ActivityType, Client, GatewayIntentBits } from 'discord.js';
import cron from 'node-cron';
import { Logger } from 'tslog';
import logger from './logger';
import Config from './config';
import { ensureStringMaxLength } from './utility';

class StatusBot {
    private readonly token: string;
    private readonly serverId: string;
    private readonly updateUsername: boolean;

    private client: Client;
    private updateTask: cron.ScheduledTask;
    private logger: Logger;
    private currentActivityName = '';

    constructor(token: string, serverId: string, updateUsername = false) {
        this.token = token;
        this.serverId = serverId;
        this.updateUsername = updateUsername;

        this.logger = logger.getChildLogger({ name: 'BotLogger'});
        this.client = new Client({ intents: [GatewayIntentBits.Guilds] });

        this.client.once('ready', () => {
            this.logger.info('Client is ready, starting update task');
            this.updateTask.start();
        });

        logger.info('Logging into Discord using token');
        this.client.login(this.token);

        this.updateTask = cron.schedule('*/2 * * * *', async () => {
            this.logger.info('Updating game server status');
            try {
                await this.updateServerStatus();
                this.logger.debug('Game server status update complete');
            }
            catch(e: any) {
                this.logger.error('Failed to update game server status', e.message);
            }
        }, {
            scheduled: false
        });
    }

    private async updateServerStatus(): Promise<void> {
        this.logger.debug('Fetching server status from battlemetrics');
        const resp = await axios.get(`https://api.battlemetrics.com/servers/${this.serverId}`, {
            headers: {
                'Authorization': `Bearer ${Config.BATTLEMETRICS_TOKEN}`
            }
        });
        const server = resp.data;
        const { name, players } = server.data.attributes;

        const activityName = `${players} ${players == 1 ? 'player' : 'players'} online`;
        if (activityName != this.currentActivityName) {
            this.logger.debug('Updating user activity', activityName);
            try {
                this.client.user?.setActivity(activityName, { type: ActivityType.Watching });
                this.currentActivityName = activityName;
            }
            catch (e: any) {
                this.logger.error('Failed to update user activity', e.message);
            }
        }
        else {
            this.logger.debug('Activity name is unchanged, no update required');
        }

        const username = ensureStringMaxLength(name, 32);
        if (username != this.client.user?.username && this.updateUsername) {
            this.logger.debug('Updating username to match server name');
            try {
                await this.client.user?.setUsername(username);
            }
            catch (e: any) {
                this.logger.error('Failed to update username', e.message);
            }
        }
        else {
            this.logger.debug('Username matches server name, no update required');
        }
    }
}

export default StatusBot;
