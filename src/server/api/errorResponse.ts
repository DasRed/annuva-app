import ApiError from '@/server/error/ApiError';
import logger from '@/server/log/logger';

export default function errorResponse(error: unknown): Response {
    if (error instanceof ApiError) {
        return Response.json({error: {code: error.code, details: error.details ?? null, message: error.message}}, {status: error.status});
    }
    if (error instanceof SyntaxError) {
        return Response.json({error: {code: 'invalid_json', details: null, message: 'The request body is not valid JSON.'}}, {status: 400});
    }
    logger.error('Unhandled API error', error);
    return Response.json({error: {code: 'internal_error', details: null, message: 'An unexpected error occurred.'}}, {status: 500});
}
