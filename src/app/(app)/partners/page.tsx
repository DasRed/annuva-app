import EntityPageView from '@/component/entity/EntityPageView';
import pageMetadata from '@/server/page/pageMetadata';

export const generateMetadata = () => pageMetadata('nav.partners');

export default function PartnersPage() {
    return <EntityPageView entity="partners"/>;
}
