'use client';

import {useState} from 'react';
import EmptyState from '@/component/ui/EmptyState';
import type DashboardResult from '@/calculation/DashboardResult';
import useI18n from '@/i18n/useI18n';

/**
 * Resource counts per customer and the detail list; clicking a customer filters the details.
 */
export default function ResourceSection({resources}: { resources: DashboardResult['resources'] }) {
    const {t, td} = useI18n();
    const [selected, setSelected] = useState<string | null>(null);
    if (resources.items.length === 0) {
        return <EmptyState>{t('dashboard.noResources')}</EmptyState>;
    }
    const items = resources.items.filter((item) => selected === null || item.customerId === selected);
    const number = 'px-2 py-2 text-right tabular';
    return (
        <div className="grid gap-6 2xl:grid-cols-2">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-line text-xs tracking-wide text-text-muted uppercase">
                            <th className="px-2 py-2 text-left font-semibold">{t('dashboard.customer')}</th>
                            <th className="px-2 py-2 text-right font-semibold">{t('resource.domains')}</th>
                            <th className="px-2 py-2 text-right font-semibold">{t('resource.containers')}</th>
                            <th className="px-2 py-2 text-right font-semibold">{t('resource.proxyHosts')}</th>
                            <th className="px-2 py-2 text-right font-semibold">{t('resource.packagesServers')}</th>
                            <th className="px-2 py-2 text-right font-semibold">{t('resource.other')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {resources.counts.map((row) => (
                            <tr key={row.customerId} className={`cursor-pointer border-b border-line/60 transition hover:bg-surface-2/60 ${selected === row.customerId ? 'bg-accent-soft' : ''}`} onClick={() => setSelected(selected === row.customerId ? null : row.customerId)}>
                                <td className="px-2 py-2 font-medium">{row.name}</td>
                                <td className={number}>{row.domain || '–'}</td>
                                <td className={number}>{row.container || '–'}</td>
                                <td className={number}>{row.proxyHost || '–'}</td>
                                <td className={number}>{row.packageServer || '–'}</td>
                                <td className={number}>{row.other || '–'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="max-h-[28rem] overflow-auto">
                <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-surface">
                        <tr className="border-b border-line text-xs tracking-wide text-text-muted uppercase">
                            <th className="px-2 py-2 text-left font-semibold">{t('dashboard.customer')}</th>
                            <th className="px-2 py-2 text-left font-semibold">{t('field.resources.kind')}</th>
                            <th className="px-2 py-2 text-left font-semibold">{t('field.resources.name')}</th>
                            <th className="px-2 py-2 text-left font-semibold">{t('field.resources.location')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                            <tr key={item.id} className="border-b border-line/60">
                                <td className="px-2 py-1.5 text-text-soft">{item.customerName}</td>
                                <td className="px-2 py-1.5">{td(`enum.resources.kind.${item.kind}`, item.kind)}</td>
                                <td className="px-2 py-1.5 font-medium break-all">{item.name}</td>
                                <td className="px-2 py-1.5 text-text-soft">{item.location ?? '–'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
