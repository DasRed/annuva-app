import {notFound} from 'next/navigation';
import RegisterForm from '@/component/auth/RegisterForm';
import getConfig from '@/server/config/getConfig';
import pageMetadata from '@/server/page/pageMetadata';

export const generateMetadata = () => pageMetadata('auth.register.title');

export default function RegisterPage() {
    if (getConfig().appMode !== 'multi') {
        notFound();
    }
    return <RegisterForm/>;
}
