import axios from 'axios';
import { Client, Intents } from 'discord.js';
import cron from 'node-cron';
import { Logger } from 'tslog';
import logger from './logger';

class StatusBot {
    private token: string;
    private serverIp: string;
    private serverPort: string;
    private ignoreBots: boolean;
    private updateUsername: boolean;

    private client: Client;
    private updateTask: cron.ScheduledTask;
    private logger: Logger;
    private currentActivityName = '';
    private currentAvatarUrl = '';

    constructor(token: string, serverIp: string, serverPort: string, ignoreBots = true, updateUsername = false) {
        this.token = token;
        this.serverIp = serverIp;
        this.serverPort = serverPort;
        this.ignoreBots = ignoreBots;
        this.updateUsername = updateUsername;

        this.logger = logger.getChildLogger({ name: 'BotLogger'});
        this.client = new Client({ intents: [Intents.FLAGS.GUILDS] });

        this.client.once('ready', () => {
            this.logger.debug('Client is ready, starting update task');
            this.updateTask.start();
        });

        logger.info('Logging into Discord using token');
        this.client.login(this.token);

        this.updateTask = cron.schedule('*/2 * * * *', async () => {
            this.logger.debug('Updating game server status');
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
        this.logger.debug('Fetching server status from bflist');
        const resp = await axios.get(`https://api.bflist.io/bf2/v1/servers/${this.serverIp}:${this.serverPort}`);
        const server = resp.data;
        const { name, mapName, maxPlayers } = server;
        let { numPlayers } = server;

        if (this.ignoreBots) {
            this.logger.debug('Filtering out bots to determine player count');
            // Only count players who: are not flagged as a bot and have a valid ping, score, kill total of death total
            const playerFilter = (player: any) => !player.aibot && (player.ping > 0 || player.score != 0 || player.kills != 0 || player.deaths != 0);
            numPlayers = server?.players?.filter(playerFilter)?.length;
        }

        const activityName = `${numPlayers}/${maxPlayers}`;
        if (activityName != this.currentActivityName) {
            this.logger.debug('Updating user activity');
            try {
                this.client.user?.setActivity(activityName, { type: 'PLAYING' });
                this.currentActivityName = activityName;
            }
            catch (e: any) {
                this.logger.error('Failed to update user activity', e.message);
            }
        }
        else {
            this.logger.debug('Activity name is unchanged, no update required');
        }

        if (name != this.client.user?.username && this.updateUsername) {
            this.logger.debug('Updating username to match server name');
            try {
                await this.client.user?.setUsername(name);
            }
            catch (e: any) {
                this.logger.error('Failed to update username', e.message);
            }
        }
        else {
            this.logger.debug('Username matches server name, no update required');
        }
        
        const mapImgSlug = 'map_' + String(mapName).toLowerCase().replace(/ /g, '_');
        const mapImgUrl = `https://www.bf2hub.com/home/images/favorite/${mapImgSlug}`;
        if (mapImgUrl != this.currentAvatarUrl) {
            this.logger.debug('Updating user avatar', mapImgUrl);
            try {
                await this.client.user?.setAvatar('https://www.bf2hub.com/home/images/favorite/map_strike_at_karkand.jpg');
                this.currentAvatarUrl = mapImgUrl;
            }
            catch (e: any) {
                this.logger.error('Failed to update user avatar', e.message);
            }
        }
    }
}

export default StatusBot;
