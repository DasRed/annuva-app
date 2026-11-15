import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import CustomerDetailView from '@/component/customer/CustomerDetailView';
import DashboardService from '@/server/dashboard/DashboardService';
import EntityService from '@/server/entity/EntityService';
import ApiError from '@/server/error/ApiError';
import getPageSession from '@/server/page/getPageSession';
import requireSession from '@/server/page/requireSession';

export async function generateMetadata({params}: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const session = await getPageSession();
    if (session === null) {
        return {};
    }
    const customer = await new EntityService('customers').get(session.context, (await params).id).catch(() => null);
    return {title: customer === null ? undefined : String(customer.name)};
}

export default async function CustomerPage({params}: { params: Promise<{ id: string }> }) {
    const session = await requireSession();
    const {id} = await params;
    const customer = await new EntityService('customers').get(session.context, id).catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 404) {
            notFound();
        }
        throw error;
    });
    const dashboard = await new DashboardService().get(session.context, {customerId: id});
    return <CustomerDetailView customer={customer} rating={dashboard.customers[0] ?? null}/>;
}
