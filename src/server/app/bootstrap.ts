import fs from 'node:fs';
import type {Kysely} from 'kysely';
import getAppVersion from '@/server/app/getAppVersion';
import getConfig from '@/server/config/getConfig';
import getDb from '@/server/db/getDb';
import migrate from '@/server/db/migrate';
import logger from '@/server/log/logger';
import getAuthSecret from '@/server/security/getAuthSecret';
import getSetupToken from '@/server/setup/getSetupToken';
import isSetupRequired from '@/server/setup/isSetupRequired';

/**
 * Runs once when the server starts: prepares the data directory, migrates the database and prints
 * the setup token while the setup wizard is pending.
 */
export default async function bootstrap(): Promise<void> {
    const config = getConfig();
    fs.mkdirSync(config.dataDir, {recursive: true});
    getAuthSecret();
    logger.info(`${config.appName} ${getAppVersion()} starting (mode ${config.appMode}, database ${config.database.driver})`);

    const db = await getDb();
    const applied = await migrate(db as unknown as Kysely<unknown>);
    if (applied.length > 0) {
        logger.info(`Applied migrations: ${applied.join(', ')}`);
    }
    if (await isSetupRequired()) {
        logger.info('Setup required. Open the app in your browser and use this setup token:');
        logger.info(`    ${getSetupToken()}`);
    }
}
