import {headers} from 'next/headers';
import ApiDocs from '@/component/api/ApiDocs';
import getBaseUrl from '@/server/http/getBaseUrl';
import pageMetadata from '@/server/page/pageMetadata';

export const generateMetadata = () => pageMetadata('nav.apiDocs');

export default async function ApiDocsPage() {
    return <ApiDocs baseUrl={getBaseUrl(await headers())}/>;
}
