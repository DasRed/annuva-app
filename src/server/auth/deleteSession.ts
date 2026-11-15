import getDb from '@/server/db/getDb';
import hashToken from '@/server/security/hashToken';

export default async function deleteSession(token: string | undefined): Promise<void> {
    if (token === undefined || token === '') {
        return;
    }
    const db = await getDb();
    await db.deleteFrom('sessions').where('id', '=', hashToken(token)).execute();
}
