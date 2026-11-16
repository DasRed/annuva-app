'use client';

import type EntityName from '@/entity/EntityName';
import humanize from '@/entity/humanize';
import useI18n from '@/i18n/useI18n';

/**
 * Full-width heading in a form grid in front of the first field of a group (see
 * `FieldDefinition.group`), with an optional hint below.
 */
export default function FieldGroupHeading({entity, group}: { entity: EntityName | 'settings'; group: string }) {
    const {td} = useI18n();
    const hint = td(`groupHint.${entity}.${group}`, '');
    return (
        <div className="mt-2 border-t border-line pt-4 sm:col-span-full">
            <h3 className="font-semibold">{td(`group.${entity}.${group}`, humanize(group))}</h3>
            {hint !== '' ? <p className="mt-0.5 text-sm text-text-muted">{hint}</p> : null}
        </div>
    );
}
