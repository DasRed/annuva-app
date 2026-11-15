import apiRoute from '@/server/api/apiRoute';
import parseListQuery from '@/server/api/parseListQuery';
import readJson from '@/server/api/readJson';
import getRequestContext from '@/server/auth/getRequestContext';
import EntityService from '@/server/entity/EntityService';
import resolveEntityName from '@/server/entity/resolveEntityName';

export const GET = apiRoute<{ entity: string }>(async (request, {entity}) => {
    const context = await getRequestContext(request);
    return new EntityService(resolveEntityName(entity)).list(context, parseListQuery(new URL(request.url)));
});

export const POST = apiRoute<{ entity: string }>(async (request, {entity}) => {
    const context = await getRequestContext(request);
    const record = await new EntityService(resolveEntityName(entity)).create(context, await readJson(request));
    return Response.json(record, {status: 201});
});
