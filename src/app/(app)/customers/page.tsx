import EntityPageView from '@/component/entity/EntityPageView';
import pageMetadata from '@/server/page/pageMetadata';

export const generateMetadata = () => pageMetadata('nav.customers');

export default function CustomersPage() {
    return <EntityPageView entity="customers" createHref="/customers/new" detailHref="/customers"/>;
}
