'use client';

import {IconAlertTriangle, IconCircleCheck, IconPlayerPause, IconTrendingDown} from '@tabler/icons-react';
import Pill from '@/component/ui/Pill';
import type PillTone from '@/component/ui/PillTone';
import type DashboardResult from '@/calculation/DashboardResult';
import useI18n from '@/i18n/useI18n';

type Rating = DashboardResult['customers'][number]['rating'];

const tones: Record<Rating, PillTone> = {
    closed:        'neutral',
    minus:         'negative',
    minus_covered: 'warning',
    one_time:      'neutral',
    open:          'neutral',
    own_project:   'info',
    paused:        'warning',
    worth_it:      'positive',
};

const icons: Partial<Record<Rating, typeof IconCircleCheck>> = {
    minus:         IconTrendingDown,
    minus_covered: IconAlertTriangle,
    paused:        IconPlayerPause,
    worth_it:      IconCircleCheck,
};

/**
 * "Is the customer worth it?" verdict with colour, icon and text.
 */
export default function RatingPill({rating}: { rating: Rating }) {
    const {td} = useI18n();
    const Icon = icons[rating];
    return <Pill tone={tones[rating]} icon={Icon === undefined ? undefined : <Icon size={13} stroke={2}/>}>{td(`rating.${rating}`, rating)}</Pill>;
}
