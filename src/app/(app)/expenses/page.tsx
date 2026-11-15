import EntityPageView from '@/component/entity/EntityPageView';
import pageMetadata from '@/server/page/pageMetadata';

export const generateMetadata = () => pageMetadata('nav.expenses');

export default function ExpensesPage() {
    return <EntityPageView entity="expenses"/>;
}
