import {cookies} from 'next/headers';
import {cache} from 'react';
import contextFromUser from '@/server/auth/contextFromUser';
import findSessionUser from '@/server/auth/findSessionUser';
import sessionCookie from '@/server/auth/sessionCookie';
import type PageSession from '@/server/page/PageSession';
import TenantService from '@/server/tenant/TenantService';
import toPublicUser from '@/server/user/toPublicUser';

/**
 * Session of the current page request (deduplicated per request).
 */
const getPageSession = cache(async (): Promise<PageSession | null> => {
    const user = await findSessionUser((await cookies()).get(sessionCookie.name)?.value);
    if (user === null) {
        return null;
    }
    const context = contextFromUser(user, 'read_write', 'ui');
    const settings = context.tenantId === null ? null : await new TenantService().getSettings(context);
    return {context, settings, user: toPublicUser(user)};
});

export default getPageSession;
