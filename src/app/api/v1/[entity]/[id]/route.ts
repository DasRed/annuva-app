import apiRoute from '@/server/api/apiRoute';
import readJson from '@/server/api/readJson';
import getRequestContext from '@/server/auth/getRequestContext';
import EntityService from '@/server/entity/EntityService';
import resolveEntityName from '@/server/entity/resolveEntityName';

export const GET = apiRoute<{ entity: string; id: string }>(async (request, {entity, id}) => {
    const context = await getRequestContext(request);
    return new EntityService(resolveEntityName(entity)).get(context, id);
});

export const PATCH = apiRoute<{ entity: string; id: string }>(async (request, {entity, id}) => {
    const context = await getRequestContext(request);
    return new EntityService(resolveEntityName(entity)).update(context, id, await readJson(request));
});

export const DELETE = apiRoute<{ entity: string; id: string }>(async (request, {entity, id}) => {
    const context = await getRequestContext(request);
    await new EntityService(resolveEntityName(entity)).remove(context, id);
    return new Response(null, {status: 204});
});
