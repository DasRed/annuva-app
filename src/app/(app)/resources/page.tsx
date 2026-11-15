import EntityPageView from '@/component/entity/EntityPageView';
import pageMetadata from '@/server/page/pageMetadata';

export const generateMetadata = () => pageMetadata('nav.resources');

export default function ResourcesPage() {
    return <EntityPageView entity="resources"/>;
}
