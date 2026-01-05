import { auth } from '@/app/api/auth/[...nextauth]/route';
import { isAdminEmail } from '@/lib/adminAuth';

export async function getAdminUser() {
  const session = await auth();
  if (!session?.user) {
    return null;
  }

  if (!isAdminEmail(session.user.email)) {
    return null;
  }

  if (session.user.provider !== 'google') {
    return null;
  }

  return session.user;
}
