import type DashboardFilter from '@/calculation/DashboardFilter';
import type DashboardInput from '@/calculation/DashboardInput';
import type DashboardResult from '@/calculation/DashboardResult';

/**
 * Resources per customer, counted by kind, plus the detail list.
 */
export default function computeResources(input: DashboardInput, filter: DashboardFilter): DashboardResult['resources'] {
    const names = new Map(input.customers.map((customer) => [customer.id, customer.name]));
    const resources = input.resources.filter((resource) => filter.customerId === null || resource.customerId === filter.customerId);
    const counts = new Map<string, DashboardResult['resources']['counts'][number]>();
    for (const resource of resources) {
        const row = counts.get(resource.customerId) ?? {container: 0, customerId: resource.customerId, domain: 0, name: names.get(resource.customerId) ?? '?', other: 0, packageServer: 0, proxyHost: 0};
        if (resource.kind === 'domain') {
            row.domain += 1;
        }
        else if (resource.kind === 'container') {
            row.container += 1;
        }
        else if (resource.kind === 'proxy_host') {
            row.proxyHost += 1;
        }
        else if (resource.kind === 'package' || resource.kind === 'server') {
            row.packageServer += 1;
        }
        else {
            row.other += 1;
        }
        counts.set(resource.customerId, row);
    }
    return {
        counts: [...counts.values()].toSorted((a, b) => a.name.localeCompare(b.name)),
        items:  resources
            .map((resource) => ({...resource, customerName: names.get(resource.customerId) ?? '?'}))
            .toSorted((a, b) => a.customerName.localeCompare(b.customerName) || a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name)),
    };
}
