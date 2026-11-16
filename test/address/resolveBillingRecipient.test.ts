import {describe, expect, it} from 'vitest';
import recipientAddressLines from '@/address/recipientAddressLines';
import resolveBillingRecipient from '@/address/resolveBillingRecipient';

const customer = {
    billingCity:       'Petershausen',
    billingCountry:    'DE',
    billingPostalCode: '85238',
    billingStreet:     'Moosfeldstr.',
    contactName:       'Peter Franke',
    email:             'info@example.com',
    name:              'Sportverein Petershausen',
};

describe('resolveBillingRecipient', () => {
    it('falls back to name, contact person and e-mail of the record', () => {
        const recipient = resolveBillingRecipient(customer);
        expect(recipient).toMatchObject({contact: 'Peter Franke', email: 'info@example.com', name: 'Sportverein Petershausen'});
        expect(recipientAddressLines(recipient, {homeCountry: 'DE', language: 'de'})).toEqual(['Peter Franke', 'Moosfeldstr.', '85238 Petershausen']);
    });

    it('uses the billing fields when they are set', () => {
        const recipient = resolveBillingRecipient({...customer, billingContactName: 'Kassenwart', billingEmail: 'kasse@example.com', billingName: 'Förderverein'});
        expect(recipient).toMatchObject({contact: 'Kassenwart', email: 'kasse@example.com', name: 'Förderverein'});
    });

    it('does not take the contact person of the record for a different recipient', () => {
        expect(resolveBillingRecipient({...customer, billingName: 'Förderverein'}).contact).toBeNull();
    });

    it('drops a contact person that only repeats the name', () => {
        expect(resolveBillingRecipient({contactName: 'Michaela Hanisch', name: 'Michaela Hanisch'}).contact).toBeNull();
    });
});
