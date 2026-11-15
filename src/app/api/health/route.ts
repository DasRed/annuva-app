import {sql} from 'kysely';
import getAppVersion from '@/server/app/getAppVersion';
import getDb from '@/server/db/getDb';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
    let database = 'ok';
    try {
        await sql`select 1`.execute(await getDb());
    }
    catch {
        database = 'error';
    }
    return Response.json({database, status: database === 'ok' ? 'ok' : 'degraded', version: getAppVersion()}, {status: database === 'ok' ? 200 : 503});
}
