'use client';

import {useRouter} from 'next/navigation';
import type {ReactNode} from 'react';
import EntityManager from '@/component/entity/EntityManager';
import Card from '@/component/ui/Card';
import PageHeader from '@/component/ui/PageHeader';
import type EntityName from '@/entity/EntityName';
import useI18n from '@/i18n/useI18n';

/**
 * Standard page for an entity: header with description and the generic list/editor. Optionally
 * "new" opens a dedicated page (wizard) and rows open a detail page.
 */
export default function EntityPageView({createHref, detailHref, entity, extraActions}: {
    createHref?: string;
    detailHref?: string;
    entity: EntityName;
    extraActions?: ReactNode;
}) {
    const {td} = useI18n();
    const router = useRouter();
    return (
        <>
            <PageHeader
                eyebrow={td(`entity.${entity}.eyebrow`, '')}
                title={td(`entity.${entity}.plural`, entity)}
                description={td(`entity.${entity}.description`, '')}
            />
            <Card>
                <EntityManager
                    entity={entity}
                    extraActions={extraActions}
                    onCreate={createHref === undefined ? undefined : () => router.push(createHref)}
                    onOpen={detailHref === undefined ? undefined : (record) => router.push(`${detailHref}/${record.id}`)}
                />
            </Card>
        </>
    );
}
