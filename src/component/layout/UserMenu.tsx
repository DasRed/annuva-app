'use client';

import {IconApi, IconBrandGithub, IconChevronUp, IconLogout, IconUserCircle} from '@tabler/icons-react';
import Link from 'next/link';
import {useEffect, useRef, useState} from 'react';
import apiFetch from '@/client/apiFetch';
import Avatar from '@/component/layout/Avatar';
import useI18n from '@/i18n/useI18n';

/**
 * User block at the bottom of the sidebar: avatar, name, menu and – discreetly – the app version.
 */
export default function UserMenu({avatarUrl, email, name, version}: { avatarUrl: string | null; email: string; name: string; version: string }) {
    const {t} = useI18n();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const close = (event: MouseEvent) => {
            if (ref.current !== null && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    return (
        <div ref={ref} className="relative">
            {open ? (
                <div className="animate-pop absolute right-0 bottom-full left-0 mb-2 overflow-hidden rounded-xl border border-line bg-surface shadow-card">
                    <Link href="/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-surface-2">
                        <IconUserCircle size={18} stroke={1.75}/>{t('nav.profile')}
                    </Link>
                    <Link href="/api-docs" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-surface-2">
                        <IconApi size={18} stroke={1.75}/>{t('nav.apiDocs')}
                    </Link>
                    <a href="https://github.com/DasRed/annuva-app" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-surface-2">
                        <IconBrandGithub size={18} stroke={1.75}/>{t('nav.source')}
                    </a>
                    <button
                        type="button"
                        className="flex w-full items-center gap-2 border-t border-line px-3 py-2.5 text-left text-sm text-negative hover:bg-negative-soft"
                        onClick={async () => {
                            await apiFetch('/api/auth/logout', {method: 'POST'});
                            window.location.href = '/login';
                        }}
                    >
                        <IconLogout size={18} stroke={1.75}/>{t('nav.logout')}
                    </button>
                </div>
            ) : null}
            <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-surface-2">
                <Avatar name={name} url={avatarUrl}/>
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{name}</span>
                    <span className="block truncate text-xs text-text-muted">{email}</span>
                </span>
                <IconChevronUp size={16} className={`text-text-muted transition ${open ? '' : 'rotate-180'}`}/>
            </button>
            <p className="mt-1 px-2 text-[0.7rem] text-text-muted/80" title={t('common.version')}>v{version}</p>
        </div>
    );
}
