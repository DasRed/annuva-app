/**
 * Raw business data of one tenant for the dashboard calculations. All amounts are integer cents,
 * percentages are integer hundredths (1900 = 19 %), dates are YYYY-MM-DD.
 */
export default interface DashboardInput {
    customers: { archived: boolean; channel: string; id: string; name: string; partnerId: string | null; status: string }[];
    expenses: { assignedTo: string; category: string; date: string; grossAmount: number; id: string; item: string; status: string; vendor: string }[];
    invoices: {
        customerId: string;
        date: string | null;
        description: string;
        dueDate: string | null;
        id: string;
        /** Net amount per position and the customer the position belongs to. */
        lines: { amount: number; customerId: string }[];
        number: string | null;
        partnerId: string | null;
        recipientType: string;
        status: string;
    }[];
    partners: { id: string; name: string }[];
    recurringCharges: { amountPerYear: number; customerId: string; description: string | null; id: string; interval: string; nextInvoiceDate: string; service: string }[];
    recurringCosts: { assignedTo: string; costPerYear: number; id: string; name: string; nextRenewal: string | null; provider: string; rebilledPerYear: number; type: string }[];
    resources: { customerId: string; id: string; kind: string; location: string | null; name: string }[];
    settings: { serverCostAllocation: string; taxPaymentMonth: number };
    tasks: { customerId: string | null; dueDate: string | null; id: string; note: string | null; status: string; title: string }[];
    taxAdjustments: { description: string; profitAdjustment: number; year: number }[];
    taxYears: { marginalRatePercent: number | null; profitPerAssessment: number | null; year: number }[];
    /** Today in the tenant time zone. */
    today: string;
}
