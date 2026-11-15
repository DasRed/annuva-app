import EntityPageView from '@/component/entity/EntityPageView';
import pageMetadata from '@/server/page/pageMetadata';

export const generateMetadata = () => pageMetadata('nav.tasks');

export default function TasksPage() {
    return <EntityPageView entity="tasks"/>;
}
