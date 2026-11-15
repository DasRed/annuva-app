import PasswordResetForm from '@/component/auth/PasswordResetForm';
import pageMetadata from '@/server/page/pageMetadata';

export const generateMetadata = () => pageMetadata('auth.reset.title');

export default async function PasswordResetPage({searchParams}: { searchParams: Promise<Record<string, string | undefined>> }) {
    const {token} = await searchParams;
    return <PasswordResetForm token={token ?? null}/>;
}
