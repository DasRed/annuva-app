import {redirect} from 'next/navigation';
import LoginForm from '@/component/auth/LoginForm';
import getConfig from '@/server/config/getConfig';
import MailService from '@/server/mail/MailService';
import getPageSession from '@/server/page/getPageSession';
import pageMetadata from '@/server/page/pageMetadata';
import isSetupRequired from '@/server/setup/isSetupRequired';

export const generateMetadata = () => pageMetadata('auth.login.title');

export default async function LoginPage() {
    if (await isSetupRequired()) {
        redirect('/setup');
    }
    if ((await getPageSession()) !== null) {
        redirect('/');
    }
    return <LoginForm mailEnabled={MailService.isEnabled()} canRegister={getConfig().appMode === 'multi'}/>;
}
