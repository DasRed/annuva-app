import type EntityDefinition from '@/entity/EntityDefinition';

const invoiceTemplates: EntityDefinition = {
    adminOnly:   true,
    defaultSort: {direction: 'asc', field: 'name'},
    fields:      [
        {list: true, max: 255, name: 'name', required: true, type: 'string'},
        {default: false, list: true, name: 'isDefault', type: 'boolean'},
        {accept: 'image/*', name: 'logoFileId', type: 'file'},
        {max: 255, name: 'senderLine', type: 'string'},
        {name: 'introText', type: 'text'},
        {name: 'closingText', type: 'text'},
        {accept: 'image/*', name: 'signatureFileId', type: 'file'},
        {max: 255, name: 'signatureName', type: 'string'},
        {name: 'footerLeft', type: 'text'},
        {name: 'footerCenter', type: 'text'},
        {name: 'footerRight', type: 'text'},
        {default: '#0f6b5c', name: 'accentColor', type: 'color'},
        {default: 14, name: 'paymentTermDays', required: true, type: 'integer'},
    ],
    name:        'invoiceTemplates',
    singular:    'invoice_template',
    table:       'invoiceTemplates',
    titleField:  'name',
};

export default invoiceTemplates;
