import type EntityDefinition from '@/entity/EntityDefinition';

const taxYears: EntityDefinition = {
    defaultSort: {direction: 'desc', field: 'year'},
    fields:      [
        {list: true, name: 'year', required: true, type: 'year'},
        {list: true, name: 'marginalRatePercent', type: 'percent'},
        {list: true, name: 'profitPerAssessment', type: 'money'},
    ],
    name:        'taxYears',
    singular:    'tax_year',
    table:       'taxYears',
    titleField:  'year',
};

export default taxYears;
