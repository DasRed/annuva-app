import type AuthContext from '@/server/auth/AuthContext';
import type PublicUser from '@/server/user/PublicUser';

export default interface PageSession {
    context: AuthContext;
    settings: Record<string, unknown> | null;
    user: PublicUser;
}
