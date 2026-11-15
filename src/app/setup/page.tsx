import {redirect} from 'next/navigation';
import LanguageSwitch from '@/component/auth/LanguageSwitch';
import BrandMark from '@/component/layout/BrandMark';
import SetupWizard from '@/component/setup/SetupWizard';
import getConfig from '@/server/config/getConfig';
import getPageSession from '@/server/page/getPageSession';
import pageMetadata from '@/server/page/pageMetadata';
import SetupService from '@/server/setup/SetupService';

export const dynamic = 'force-dynamic';

export const generateMetadata = () => pageMetadata('setup.title');

export default async function SetupPage() {
    const status = await new SetupService().status();
    if (!status.required) {
        redirect((await getPageSession()) === null ? '/login' : '/');
    }
    return (
        <div className="min-h-dvh px-4 py-6 sm:px-8 lg:px-12">
            <div className="mb-8 flex items-center justify-between">
                <BrandMark name={getConfig().appName}/>
                <LanguageSwitch/>
            </div>
            <SetupWizard database={status.database}/>
        </div>
    );
}
