import {z} from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a date in the format YYYY-MM-DD');

const line = z.object({
    customerId:  z.uuid().nullable().optional(),
    description: z.string().trim().min(1).max(255),
    quantity:    z.number().positive().multipleOf(0.01).default(1),
    taxRate:     z.number().min(0).max(100).multipleOf(0.01).nullable().optional(),
    unitPrice:   z.number().multipleOf(0.01).min(-100_000_000).max(100_000_000),
}).strict();

/**
 * Input of a draft invoice. Amounts are decimals; the service stores cents.
 */
const invoiceInputSchema = z.object({
    customerId:      z.uuid(),
    description:     z.string().trim().min(1).max(255),
    dueDate:         isoDate.nullable().optional(),
    language:        z.enum(['de', 'en']).optional(),
    lines:           z.array(line).min(1).max(200),
    notes:           z.string().max(65_535).nullable().optional(),
    partnerId:       z.uuid().nullable().optional(),
    recipientType:   z.enum(['customer', 'partner']).optional(),
    serviceDateFrom: isoDate.nullable().optional(),
    serviceDateTo:   isoDate.nullable().optional(),
    templateId:      z.uuid().nullable().optional(),
}).strict();

export default invoiceInputSchema;
