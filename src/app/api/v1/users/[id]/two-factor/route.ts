import apiRoute from '@/server/api/apiRoute';
import getRequestContext from '@/server/auth/getRequestContext';
import TwoFactorService from '@/server/auth/TwoFactorService';

/** Admins switch two-factor authentication off for a user who lost the device. */
export const DELETE = apiRoute<{ id: string }>(async (request, {id}) => {
    await new TwoFactorService().reset(await getRequestContext(request), id);
    return new Response(null, {status: 204});
});
