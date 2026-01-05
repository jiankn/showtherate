/**
 * Auth Helper Functions (NextAuth v5)
 * Server-side authentication utilities
 */

import { auth } from '@/app/api/auth/[...nextauth]/route';

/**
 * Get the current user session (server-side)
 * @returns {Promise<Session | null>}
 */
export async function getSession() {
    return await auth();
}

/**
 * Get the current user or null (server-side)
 * @returns {Promise<User | null>}
 */
export async function getCurrentUser() {
    const session = await getSession();
    return session?.user ?? null;
}

/**
 * Require authentication - throw if not authenticated
 * Use in API routes or server components
 * @returns {Promise<Session>}
 */
export async function requireAuth() {
    const session = await getSession();

    if (!session?.user) {
        throw new Error('Unauthorized');
    }

    return session;
}

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>}
 */
export async function isAuthenticated() {
    const session = await getSession();
    return !!session?.user;
}

/**
 * Auth response helper for API routes
 * Returns standardized 401 response
 */
export function unauthorizedResponse() {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
    });
}
