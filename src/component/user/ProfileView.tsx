'use client';

import PageHeader from '@/component/ui/PageHeader';
import PasswordForm from '@/component/user/PasswordForm';
import ProfileForm from '@/component/user/ProfileForm';
import TokenManager from '@/component/user/TokenManager';
import TwoFactorCard from '@/component/user/TwoFactorCard';
import useI18n from '@/i18n/useI18n';

export default function ProfileView({baseUrl, gravatarEnabled, profile}: {
    baseUrl: string;
    gravatarEnabled: boolean;
    profile: { avatarFileId: string | null; avatarUrl: string | null; email: string; locale: string; name: string; theme: string; timezone: string };
}) {
    const {t} = useI18n();
    return (
        <>
            <PageHeader eyebrow={t('nav.profile')} title={profile.name} description={t('profile.pageDescription')}/>
            <div className="grid gap-6 2xl:grid-cols-2">
                <div className="flex flex-col gap-6">
                    <ProfileForm profile={profile} gravatarEnabled={gravatarEnabled}/>
                    <PasswordForm/>
                    <TwoFactorCard/>
                </div>
                <TokenManager baseUrl={baseUrl}/>
            </div>
        </>
    );
}
