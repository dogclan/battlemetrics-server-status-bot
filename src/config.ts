import path from 'path';

export default abstract class Config {
    static readonly ROOT_DIR: string = path.join(__dirname, '..', '..');
    static readonly LOG_LEVEL: string = process.env.LOG_LEVEL || 'info';
    static readonly DISCORD_TOKEN: string = process.env.DISCORD_TOKEN || '';
    static readonly BATTLEMETRICS_TOKEN: string = process.env.BATTLEMETRICS_TOKEN || '';
    static readonly SERVER_ID: string = process.env.SERVER_ID || '';
    static readonly UPDATE_USERNAME: boolean = !!Number(process.env.UPDATE_USERNAME || 0);
}
