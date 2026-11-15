import errorResponse from '@/server/api/errorResponse';

/**
 * Wraps a route handler: awaits the route params, serialises plain results as JSON and turns
 * errors into JSON error responses.
 */
export default function apiRoute<P extends Record<string, string> = Record<string, string>>(handler: (request: Request, params: P) => Promise<unknown>) {
    return async (request: Request, context: { params: Promise<P> }): Promise<Response> => {
        try {
            const result = await handler(request, await context.params);
            if (result instanceof Response) {
                return result;
            }
            return Response.json(result ?? {ok: true});
        }
        catch (error) {
            return errorResponse(error);
        }
    };
}
