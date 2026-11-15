import customers from '@/entity/definitions/customers';
import expenses from '@/entity/definitions/expenses';
import invoices from '@/entity/definitions/invoices';
import invoiceTemplates from '@/entity/definitions/invoiceTemplates';
import offers from '@/entity/definitions/offers';
import partners from '@/entity/definitions/partners';
import recurringCharges from '@/entity/definitions/recurringCharges';
import recurringCosts from '@/entity/definitions/recurringCosts';
import resources from '@/entity/definitions/resources';
import tasks from '@/entity/definitions/tasks';
import taxAdjustments from '@/entity/definitions/taxAdjustments';
import taxYears from '@/entity/definitions/taxYears';
import type EntityDefinition from '@/entity/EntityDefinition';
import type EntityName from '@/entity/EntityName';

const entities: Readonly<Record<EntityName, EntityDefinition>> = {
    customers,
    expenses,
    invoiceTemplates,
    invoices,
    offers,
    partners,
    recurringCharges,
    recurringCosts,
    resources,
    tasks,
    taxAdjustments,
    taxYears,
};

export default entities;
