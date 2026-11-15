import {notFound} from 'next/navigation';
import TemplateEditor from '@/component/template/TemplateEditor';
import EntityService from '@/server/entity/EntityService';
import ApiError from '@/server/error/ApiError';
import pageMetadata from '@/server/page/pageMetadata';
import requireSession from '@/server/page/requireSession';

export const generateMetadata = () => pageMetadata('nav.templates');

export default async function TemplateEditorPage({params}: { params: Promise<{ id: string }> }) {
    const session = await requireSession({admin: true});
    const {id} = await params;
    const template = await new EntityService('invoiceTemplates').get(session.context, id).catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 404) {
            notFound();
        }
        throw error;
    });
    return <TemplateEditor template={template}/>;
}
