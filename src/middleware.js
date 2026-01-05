import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { isAdminEmail } from '@/lib/adminAuth';

/**
 * Middleware to protect /app/* routes
 * Redirects unauthenticated users to login
 */
export async function middleware(request) {
    const { pathname } = request.nextUrl;
    const host = request.headers.get('host') || '';
    const isStaticAsset = pathname.startsWith('/_next') || /\.[^/]+$/.test(pathname);
    const isApiRoute = pathname.startsWith('/api');

    const isAppRoute = pathname.startsWith('/app');
    const isShareRoute = pathname === '/s' || pathname.startsWith('/s/');
    const isShareBlockedRoute = pathname === '/s/blocked' || pathname.startsWith('/s/blocked/');
    const isAdminHost = host.startsWith('admin.') || host.startsWith('admin.localhost');
    let adminPathname = pathname;
    let needsAdminRewrite = false;

    if (isStaticAsset) {
        return NextResponse.next();
    }

    if (isAdminHost && !pathname.startsWith('/admin') && !isApiRoute) {
        needsAdminRewrite = true;
        adminPathname = pathname === '/' ? '/admin' : `/admin${pathname}`;
    }

    const isAdminPath = adminPathname.startsWith('/admin');
    const isAdminAuthPath = adminPathname === '/admin';

    if (isAdminPath) {
        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET,
        });
        const isAdmin = !!token?.email && isAdminEmail(token.email) && token?.provider === 'google';

        if (!isAdmin) {
            if (isAdminAuthPath) {
                if (needsAdminRewrite) {
                    const adminUrl = request.nextUrl.clone();
                    adminUrl.pathname = adminPathname;
                    return NextResponse.rewrite(adminUrl);
                }
                return NextResponse.next();
            }
            const loginUrl = request.nextUrl.clone();
            loginUrl.pathname = '/admin';
            if (token?.email) {
                loginUrl.searchParams.set('error', 'unauthorized');
            }
            return NextResponse.redirect(loginUrl);
        }

        if (adminPathname === '/admin') {
            const overviewUrl = request.nextUrl.clone();
            overviewUrl.pathname = '/admin/overview';
            return NextResponse.redirect(overviewUrl);
        }

        if (needsAdminRewrite) {
            const adminUrl = request.nextUrl.clone();
            adminUrl.pathname = adminPathname;
            return NextResponse.rewrite(adminUrl);
        }

        return NextResponse.next();
    }

    if (isAppRoute || isShareRoute) {
        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET,
        });

        // Not authenticated - redirect to login
        if (isAppRoute && !token) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('callbackUrl', pathname);
            return NextResponse.redirect(loginUrl);
        }

        if (isShareRoute && !isShareBlockedRoute && token?.name === 'Demo User') {
            const blockedUrl = new URL('/s/blocked', request.url);
            return NextResponse.redirect(blockedUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/:path*',
    ],
};
