const months: Record<string, number> = {monthly: 1, quarterly: 3, yearly: 12};

/**
 * Amount of one invoice of a recurring charge (the yearly amount split by the interval).
 */
export default function chargeAmountPerInvoice(amountPerYear: number, interval: string): number {
    return Math.round((amountPerYear * (months[interval] ?? 12)) / 12);
}
