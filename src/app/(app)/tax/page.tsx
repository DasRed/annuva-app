import TaxView from '@/component/tax/TaxView';
import DashboardService from '@/server/dashboard/DashboardService';
import pageMetadata from '@/server/page/pageMetadata';
import requireSession from '@/server/page/requireSession';

export const generateMetadata = () => pageMetadata('nav.tax');

export default async function TaxPage() {
    const session = await requireSession();
    const dashboard = await new DashboardService().get(session.context, {});
    return <TaxView rows={dashboard.tax}/>;
}
