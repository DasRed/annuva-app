import EntityPageView from '@/component/entity/EntityPageView';
import pageMetadata from '@/server/page/pageMetadata';
import requireSession from '@/server/page/requireSession';

export const generateMetadata = () => pageMetadata('nav.templates');

export default async function TemplatesPage() {
    await requireSession({admin: true});
    return <EntityPageView entity="invoiceTemplates"/>;
}
