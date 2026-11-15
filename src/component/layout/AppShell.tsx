'use client';

import {IconMenu2, IconX} from '@tabler/icons-react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {type ReactNode, useState} from 'react';
import BrandMark from '@/component/layout/BrandMark';
import NavLinks from '@/component/layout/NavLinks';
import UserMenu from '@/component/layout/UserMenu';
import useI18n from '@/i18n/useI18n';

/**
 * Application frame: fixed sidebar from the lg breakpoint, top bar with slide-in drawer on smaller
 * screens. The content always uses the full width – no fixed max width with empty margins.
 */
export default function AppShell({appName, children, isAdmin, user, version}: {
    appName: string;
    children: ReactNode;
    isAdmin: boolean;
    user: { avatarUrl: string | null; email: string; name: string };
    version: string;
}) {
    const {t} = useI18n();
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    const [lastPathname, setLastPathname] = useState(pathname);
    if (pathname !== lastPathname) {
        setLastPathname(pathname);
        setOpen(false);
    }

    const sidebar = (
        <div className="flex h-full flex-col gap-6 px-3 py-5">
            <Link href="/" className="px-3"><BrandMark name={appName}/></Link>
            <div className="flex-1 overflow-y-auto">
                <NavLinks isAdmin={isAdmin} onNavigate={() => setOpen(false)}/>
            </div>
            <UserMenu avatarUrl={user.avatarUrl} email={user.email} name={user.name} version={version}/>
        </div>
    );

    return (
        <div className="min-h-dvh">
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-surface/70 backdrop-blur lg:block">{sidebar}</aside>

            <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-bg/90 px-4 py-2.5 backdrop-blur lg:hidden">
                <Link href="/"><BrandMark name={appName}/></Link>
                <button type="button" onClick={() => setOpen(true)} className="rounded-lg p-2 text-text-soft hover:bg-surface-2" aria-label={t('nav.open')} aria-expanded={open}>
                    <IconMenu2 size={24} stroke={1.75}/>
                </button>
            </header>

            {open ? (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <button type="button" className="animate-fade absolute inset-0 bg-black/40" aria-label={t('nav.close')} onClick={() => setOpen(false)}/>
                    <aside className="animate-slide-in absolute inset-y-0 left-0 w-[min(20rem,85vw)] border-r border-line bg-surface shadow-2xl">
                        <button type="button" onClick={() => setOpen(false)} className="absolute top-4 right-3 rounded-lg p-2 text-text-muted hover:bg-surface-2" aria-label={t('nav.close')}>
                            <IconX size={22} stroke={1.75}/>
                        </button>
                        {sidebar}
                    </aside>
                </div>
            ) : null}

            <main className="px-4 py-6 sm:px-6 lg:ml-64 lg:px-8 lg:py-8 2xl:px-12">{children}</main>
        </div>
    );
}
