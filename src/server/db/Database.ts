import type ApiTokenTable from '@/server/db/table/ApiTokenTable';
import type AuditLogTable from '@/server/db/table/AuditLogTable';
import type EntityTable from '@/server/db/table/EntityTable';
import type FileTable from '@/server/db/table/FileTable';
import type InvoiceLineTable from '@/server/db/table/InvoiceLineTable';
import type InvoiceSequenceTable from '@/server/db/table/InvoiceSequenceTable';
import type PasswordResetTable from '@/server/db/table/PasswordResetTable';
import type SessionTable from '@/server/db/table/SessionTable';
import type TenantTable from '@/server/db/table/TenantTable';
import type UserTable from '@/server/db/table/UserTable';

export default interface Database {
    apiTokens: ApiTokenTable;
    auditLog: AuditLogTable;
    customers: EntityTable;
    expenses: EntityTable;
    files: FileTable;
    invoiceLines: InvoiceLineTable;
    invoiceSequences: InvoiceSequenceTable;
    invoiceTemplates: EntityTable;
    invoices: EntityTable;
    offers: EntityTable;
    partners: EntityTable;
    passwordResets: PasswordResetTable;
    recurringCharges: EntityTable;
    recurringCosts: EntityTable;
    resources: EntityTable;
    sessions: SessionTable;
    tasks: EntityTable;
    taxAdjustments: EntityTable;
    taxYears: EntityTable;
    tenants: TenantTable;
    users: UserTable;
}
