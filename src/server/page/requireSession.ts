import {redirect} from 'next/navigation';
import getPageSession from '@/server/page/getPageSession';
import type PageSession from '@/server/page/PageSession';
import isSetupRequired from '@/server/setup/isSetupRequired';

/**
 * Session for protected pages. Redirects to the setup wizard or the login when needed.
 */
export default async function requireSession(options: { admin?: boolean } = {}): Promise<PageSession> {
    const session = await getPageSession();
    if (session === null) {
        redirect((await isSetupRequired()) ? '/setup' : '/login');
    }
    if (options.admin === true && session.user.role !== 'admin') {
        redirect('/');
    }
    return session;
}
