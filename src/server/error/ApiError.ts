/**
 * Error with an HTTP status and a stable machine-readable code. Thrown by services and translated
 * into JSON responses by the API layer and into tool errors by the MCP server.
 */
export default class ApiError extends Error {
    constructor(
        readonly status: number,
        readonly code: string,
        message: string,
        readonly details?: unknown,
    ) {
        super(message);
        this.name = 'ApiError';
    }

    static badRequest(code: string, message: string, details?: unknown): ApiError {
        return new ApiError(400, code, message, details);
    }

    static conflict(code: string, message: string, details?: unknown): ApiError {
        return new ApiError(409, code, message, details);
    }

    static forbidden(message = 'You are not allowed to do this.'): ApiError {
        return new ApiError(403, 'forbidden', message);
    }

    static notFound(message = 'Not found.'): ApiError {
        return new ApiError(404, 'not_found', message);
    }

    static unauthorized(message = 'Authentication required.'): ApiError {
        return new ApiError(401, 'unauthorized', message);
    }
}
