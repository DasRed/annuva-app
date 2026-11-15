import SettingsForm from '@/component/settings/SettingsForm';
import pageMetadata from '@/server/page/pageMetadata';
import requireSession from '@/server/page/requireSession';

export const generateMetadata = () => pageMetadata('nav.settings');

export default async function SettingsPage() {
    const session = await requireSession({admin: true});
    return <SettingsForm settings={session.settings ?? {}}/>;
}
