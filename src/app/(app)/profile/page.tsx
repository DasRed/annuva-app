import {headers} from 'next/headers';
import ProfileView from '@/component/user/ProfileView';
import getConfig from '@/server/config/getConfig';
import getBaseUrl from '@/server/http/getBaseUrl';
import pageMetadata from '@/server/page/pageMetadata';
import requireSession from '@/server/page/requireSession';

export const generateMetadata = () => pageMetadata('nav.profile');

export default async function ProfilePage() {
    const session = await requireSession();
    return <ProfileView profile={session.user} gravatarEnabled={getConfig().gravatarEnabled} baseUrl={getBaseUrl(await headers())}/>;
}
