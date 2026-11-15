import fs from 'node:fs';
import path from 'node:path';
import getConfig from '@/server/config/getConfig';
import randomToken from '@/server/util/randomToken';

/**
 * Token that protects the setup wizard. Taken from SETUP_TOKEN, otherwise generated once, stored in
 * the data directory and printed to the log on start.
 */
export default function getSetupToken(): string {
    const config = getConfig();
    if (config.setupToken !== null) {
        return config.setupToken;
    }
    const file = path.join(config.dataDir, '.setup-token');
    if (fs.existsSync(file)) {
        return fs.readFileSync(file, 'utf8').trim();
    }
    fs.mkdirSync(config.dataDir, {recursive: true});
    const token = randomToken(12);
    fs.writeFileSync(file, token, {mode: 0o600});
    return token;
}
