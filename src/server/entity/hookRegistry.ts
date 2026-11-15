import type EntityName from '@/entity/EntityName';
import type EntityHooks from '@/server/entity/EntityHooks';
import customerHooks from '@/server/entity/hooks/customerHooks';
import invoiceTemplateHooks from '@/server/entity/hooks/invoiceTemplateHooks';
import partnerHooks from '@/server/entity/hooks/partnerHooks';
import recurringChargeHooks from '@/server/entity/hooks/recurringChargeHooks';
import taxYearHooks from '@/server/entity/hooks/taxYearHooks';

const hookRegistry: Partial<Record<EntityName, EntityHooks>> = {
    customers:        customerHooks,
    invoiceTemplates: invoiceTemplateHooks,
    partners:         partnerHooks,
    recurringCharges: recurringChargeHooks,
    taxYears:         taxYearHooks,
};

export default hookRegistry;
