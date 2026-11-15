import type AuthContext from '@/server/auth/AuthContext';
import ApiError from '@/server/error/ApiError';

/**
 * Tenant admins manage users and system settings. Plain users may do everything else.
 */
export default function assertAdmin(context: AuthContext): void {
    if (context.role !== 'admin') {
        throw ApiError.forbidden('Only administrators can do this.');
    }
}
