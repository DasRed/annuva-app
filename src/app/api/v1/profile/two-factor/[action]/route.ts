import apiRoute from '@/server/api/apiRoute';
import readJson from '@/server/api/readJson';
import getRequestContext from '@/server/auth/getRequestContext';
import TwoFactorService from '@/server/auth/TwoFactorService';
import ApiError from '@/server/error/ApiError';

export const POST = apiRoute<{ action: string }>(async (request, {action}) => {
    const context = await getRequestContext(request);
    const service = new TwoFactorService();
    switch (action) {
        case 'setup':
            return service.setup(context);
        case 'enable':
            return service.enable(context, await readJson(request));
        case 'disable':
            await service.disable(context, await readJson(request));
            return {ok: true};
        case 'recovery-codes':
            return service.regenerateRecoveryCodes(context, await readJson(request));
        default:
            throw ApiError.notFound('Unknown action.');
    }
});
