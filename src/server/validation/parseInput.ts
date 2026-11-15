import type {z} from 'zod';
import ApiError from '@/server/error/ApiError';

/**
 * Validates request data and turns validation issues into a 400 error with per-field details.
 */
export default function parseInput<T>(schema: z.ZodType<T>, input: unknown): T {
    const result = schema.safeParse(input ?? {});
    if (!result.success) {
        throw ApiError.badRequest('validation_failed', 'The data is invalid.', result.error.issues.map((issue) => ({
            field:   issue.path.join('.'),
            message: issue.message,
        })));
    }
    return result.data;
}
