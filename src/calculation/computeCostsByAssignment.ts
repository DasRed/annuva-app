import type DashboardFilter from '@/calculation/DashboardFilter';
import type DashboardInput from '@/calculation/DashboardInput';
import type DashboardResult from '@/calculation/DashboardResult';

/**
 * Fixed costs per assignment: cost per year, rebilled share and self-borne rest, largest first.
 */
export default function computeCostsByAssignment(input: DashboardInput, filter: DashboardFilter): DashboardResult['costsByAssignment'] {
    const names = new Map(input.customers.map((customer) => [customer.id, customer.name]));
    const rows = new Map<string, { cost: number; rebilled: number }>();
    for (const cost of input.recurringCosts) {
        if (filter.customerId !== null && cost.assignedTo !== filter.customerId) {
            continue;
        }
        const row = rows.get(cost.assignedTo) ?? {cost: 0, rebilled: 0};
        row.cost += cost.costPerYear;
        row.rebilled += cost.rebilledPerYear;
        rows.set(cost.assignedTo, row);
    }
    return [...rows.entries()]
        .filter(([, row]) => row.cost > 0)
        .map(([customerId, row]) => ({...row, customerId, name: names.get(customerId) ?? '?', selfBorne: Math.max(0, row.cost - row.rebilled)}))
        .toSorted((a, b) => b.cost - a.cost);
}
