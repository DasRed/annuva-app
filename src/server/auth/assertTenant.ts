import type AuthContext from '@/server/auth/AuthContext';
import ApiError from '@/server/error/ApiError';

/**
 * Returns the tenant of the context. Instance admins have no tenant and no access to business data.
 */
export default function assertTenant(context: AuthContext): string {
    if (context.tenantId === null) {
        throw ApiError.forbidden('This action requires a tenant user.');
    }
    return context.tenantId;
}
