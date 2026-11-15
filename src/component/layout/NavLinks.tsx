'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import navigation from '@/component/layout/navigation';
import useI18n from '@/i18n/useI18n';

export default function NavLinks({isAdmin, onNavigate}: { isAdmin: boolean; onNavigate?: () => void }) {
    const {t} = useI18n();
    const pathname = usePathname();
    const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname === href || (pathname.startsWith(`${href}/`) && !(href === '/settings' && pathname !== href)));

    return (
        <nav className="flex flex-col gap-5" aria-label={t('nav.main')}>
            {navigation.filter((group) => group.admin !== true || isAdmin).map((group) => (
                <div key={group.label}>
                    <p className="mb-1.5 px-3 text-[0.7rem] font-semibold tracking-[0.14em] text-gold-ink uppercase">{t(group.label)}</p>
                    <ul className="flex flex-col gap-0.5">
                        {group.items.map(({href, icon: Icon, label}) => {
                            const active = isActive(href);
                            return (
                                <li key={href}>
                                    <Link
                                        href={href}
                                        onClick={onNavigate}
                                        aria-current={active ? 'page' : undefined}
                                        className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-[0.95rem] transition ${active ? 'bg-accent text-accent-ink shadow-sm' : 'text-text-soft hover:bg-surface-2 hover:text-text'}`}
                                    >
                                        <Icon size={20} stroke={1.75} className={`shrink-0 transition ${active ? '' : 'group-hover:translate-x-0.5'}`}/>
                                        {t(label)}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ))}
        </nav>
    );
}
