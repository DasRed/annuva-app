import EntityPageView from '@/component/entity/EntityPageView';
import BillingRunButton from '@/component/invoice/BillingRunButton';
import pageMetadata from '@/server/page/pageMetadata';

export const generateMetadata = () => pageMetadata('nav.recurringCharges');

export default function RecurringChargesPage() {
    return <EntityPageView entity="recurringCharges" extraActions={<BillingRunButton/>}/>;
}
