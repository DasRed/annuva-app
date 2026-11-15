import getBaseUrl from '@/server/http/getBaseUrl';
import buildOpenApi from '@/server/openapi/buildOpenApi';

export const dynamic = 'force-dynamic';

export function GET(request: Request): Response {
    return Response.json(buildOpenApi(getBaseUrl(request.headers)));
}
