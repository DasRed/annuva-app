import type AuthContext from '@/server/auth/AuthContext';
import ApiError from '@/server/error/ApiError';

export default function assertWrite(context: AuthContext): void {
    if (context.scope !== 'read_write') {
        throw ApiError.forbidden('This token only has read access.');
    }
}
