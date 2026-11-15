import EntityPageView from '@/component/entity/EntityPageView';
import pageMetadata from '@/server/page/pageMetadata';

export const generateMetadata = () => pageMetadata('nav.offers');

export default function OffersPage() {
    return <EntityPageView entity="offers"/>;
}
