import type {Kysely} from 'kysely';
import DashboardView from '@/component/dashboard/DashboardView';
import DashboardService from '@/server/dashboard/DashboardService';
import getDb from '@/server/db/getDb';
import pageMetadata from '@/server/page/pageMetadata';
import requireSession from '@/server/page/requireSession';

export const generateMetadata = () => pageMetadata('nav.dashboard');

export default async function DashboardPage({searchParams}: { searchParams: Promise<Record<string, string | undefined>> }) {
    const session = await requireSession();
    const params = await searchParams;
    const year = params.year !== undefined && /^\d{4}$/.test(params.year) ? Number(params.year) : null;
    const customerId = params.customer !== undefined && params.customer !== '' ? params.customer : null;
    const data = await new DashboardService().get(session.context, {customerId, year});
    const db = (await getDb()) as unknown as Kysely<any>;
    const customers = await db.selectFrom('customers').select(['id', 'name']).where('tenantId', '=', session.context.tenantId).orderBy('name').execute() as { id: string; name: string }[];
    return <DashboardView customers={customers} data={data}/>;
}
