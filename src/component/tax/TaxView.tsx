'use client';

import {useRouter} from 'next/navigation';
import TaxTable from '@/component/dashboard/TaxTable';
import EntityManager from '@/component/entity/EntityManager';
import Card from '@/component/ui/Card';
import PageHeader from '@/component/ui/PageHeader';
import type DashboardResult from '@/calculation/DashboardResult';
import useI18n from '@/i18n/useI18n';

export default function TaxView({rows}: { rows: DashboardResult['tax'] }) {
    const {t} = useI18n();
    const router = useRouter();
    return (
        <>
            <PageHeader eyebrow={t('nav.group.costs')} title={t('nav.tax')} description={t('tax.description')}/>
            <div className="flex flex-col gap-6">
                <Card title={t('tax.estimate')}><TaxTable rows={rows}/></Card>
                <div className="grid gap-6 2xl:grid-cols-2">
                    <Card title={t('entity.taxYears.plural')} description={t('entity.taxYears.description')}>
                        <EntityManager entity="taxYears" onChanged={() => router.refresh()}/>
                    </Card>
                    <Card title={t('entity.taxAdjustments.plural')} description={t('entity.taxAdjustments.description')}>
                        <EntityManager entity="taxAdjustments" onChanged={() => router.refresh()}/>
                    </Card>
                </div>
            </div>
        </>
    );
}
