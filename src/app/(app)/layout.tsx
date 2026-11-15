import type {ReactNode} from 'react';
import AppShell from '@/component/layout/AppShell';
import getAppVersion from '@/server/app/getAppVersion';
import getConfig from '@/server/config/getConfig';
import requireSession from '@/server/page/requireSession';

export const dynamic = 'force-dynamic';

export default async function AppLayout({children}: { children: ReactNode }) {
    const session = await requireSession();
    return (
        <AppShell
            appName={getConfig().appName}
            isAdmin={session.user.role === 'admin'}
            user={{avatarUrl: session.user.avatarUrl, email: session.user.email, name: session.user.name}}
            version={getAppVersion()}
        >
            {children}
        </AppShell>
    );
}
