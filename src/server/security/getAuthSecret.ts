import fs from 'node:fs';
import path from 'node:path';
import getConfig from '@/server/config/getConfig';
import randomToken from '@/server/util/randomToken';

const state: { secret: string | null } = {secret: null};

/**
 * Secret used to pepper token hashes. Taken from AUTH_SECRET, otherwise generated once and kept in
 * the data directory so it survives restarts.
 */
export default function getAuthSecret(): string {
    if (state.secret !== null) {
        return state.secret;
    }
    const config = getConfig();
    if (config.authSecret !== null) {
        state.secret = config.authSecret;
        return state.secret;
    }
    const file = path.join(config.dataDir, '.auth-secret');
    if (fs.existsSync(file)) {
        state.secret = fs.readFileSync(file, 'utf8').trim();
        return state.secret;
    }
    fs.mkdirSync(config.dataDir, {recursive: true});
    state.secret = randomToken(48);
    fs.writeFileSync(file, state.secret, {mode: 0o600});
    return state.secret;
}
