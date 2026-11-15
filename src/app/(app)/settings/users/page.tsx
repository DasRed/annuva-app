import UsersAdmin from '@/component/user/UsersAdmin';
import MailService from '@/server/mail/MailService';
import pageMetadata from '@/server/page/pageMetadata';
import requireSession from '@/server/page/requireSession';

export const generateMetadata = () => pageMetadata('nav.users');

export default async function UsersPage() {
    const session = await requireSession({admin: true});
    return <UsersAdmin currentUserId={session.user.id} mailEnabled={MailService.isEnabled()}/>;
}
