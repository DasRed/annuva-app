import getConfig from '@/server/config/getConfig';
import getDb from '@/server/db/getDb';

/**
 * In single-tenant mode the setup wizard runs as long as no user exists.
 */
export default async function isSetupRequired(): Promise<boolean> {
    if (getConfig().appMode !== 'single') {
        return false;
    }
    const db = await getDb();
    const user = await db.selectFrom('users').select('id').limit(1).executeTakeFirst();
    return user === undefined;
}
