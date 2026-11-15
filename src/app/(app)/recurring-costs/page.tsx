import EntityPageView from '@/component/entity/EntityPageView';
import pageMetadata from '@/server/page/pageMetadata';

export const generateMetadata = () => pageMetadata('nav.recurringCosts');

export default function RecurringCostsPage() {
    return <EntityPageView entity="recurringCosts"/>;
}
