import fs from 'node:fs';
import path from 'node:path';

const state: { version: string | null } = {version: null};

/**
 * Version from package.json, read at runtime. Semantic Release bumps the version after the build,
 * so it must not be inlined at build time.
 */
export default function getAppVersion(): string {
    if (state.version === null) {
        try {
            const content = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')) as { version?: string };
            state.version = content.version ?? 'unknown';
        }
        catch {
            state.version = 'unknown';
        }
    }
    return state.version;
}
