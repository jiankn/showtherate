/**
 * NextAuth.js Configuration (v5 Beta)
 * Handles authentication with Google OAuth and Email Magic Links
 */

import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';

// Force dynamic to avoid static page generation errors
export const dynamic = 'force-dynamic';

const providers = [];



const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value) {
    return typeof value === 'string' && uuidRegex.test(value);
}

async function ensureDbUserId({ email, name, image }) {
    if (typeof email !== 'string' || !email.trim()) return null;

    const { supabaseAdmin } = await import('@/lib/supabase/server');
    const normalizedEmail = email.trim().toLowerCase();

    const { data: existing, error: existingError } = await supabaseAdmin
        .from('users')
        .select('id, name, image')
        .eq('email', normalizedEmail)
        .maybeSingle();

    if (existingError) {
        console.error('Failed to read user row:', existingError);
        return null;
    }

    if (existing?.id) {
        const nextName = typeof name === 'string' && name.trim() ? name.trim() : null;
        const nextImage = typeof image === 'string' && image.trim() ? image.trim() : null;

        if (
            (nextName && nextName !== existing.name) ||
            (nextImage && nextImage !== existing.image)
        ) {
            const updates = {
                ...(nextName ? { name: nextName } : {}),
                ...(nextImage ? { image: nextImage } : {}),
                updated_at: new Date().toISOString(),
            };

            await supabaseAdmin.from('users').update(updates).eq('id', existing.id);
        }

        return existing.id;
    }

    const { data: inserted, error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
            email: normalizedEmail,
            name: typeof name === 'string' && name.trim() ? name.trim() : null,
            image: typeof image === 'string' && image.trim() ? image.trim() : null,
            updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();

    if (insertError) {
        console.error('Failed to insert user row:', insertError);
        return null;
    }

    return inserted?.id ?? null;
}

// Credentials Provider (Password Login)
providers.push(
    Credentials({
        name: 'Password',
        credentials: {
            email: { label: "Email", type: "email" },
            password: { label: "Password", type: "password" }
        },
        async authorize(credentials) {
            // TODO: Implement real password verification against database
            if (credentials?.email && credentials?.password) {
                // Demo: Allow login with password "password"
                if (credentials.password === 'password') {
                    return {
                        id: 'demo-user-id',
                        email: credentials.email,
                        name: 'Demo User',
                    };
                }
            }
            return null;
        }
    })
);

// Only add providers if credentials are available
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })
    );
}

const authConfig = {
    providers,
    // Note: Using JWT-only mode without database adapter for now
    // This allows OAuth login without database persistence
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    callbacks: {
        async jwt({ token, user, account, profile }) {
            // Initial sign in
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
                token.picture = user.image;
            }
            // For OAuth, use profile data
            if (account && profile) {
                token.id = profile.sub || user?.id;
                token.email = profile.email;
                token.name = profile.name;
                token.picture = profile.picture;
            }
            if (account?.provider) {
                token.provider = account.provider;
            }

            const email = profile?.email || user?.email || token.email;
            const name = profile?.name || user?.name || token.name;
            const image = profile?.picture || user?.image || token.picture;

            if (!isUuid(token.id) && typeof email === 'string' && email.trim()) {
                const dbUserId = await ensureDbUserId({ email, name, image });
                if (dbUserId) token.id = dbUserId;
            }
            return token;
        },
        async session({ session, token }) {
            // Add user ID to session
            if (token && session.user) {
                session.user.id = token.id;
                session.user.name = token.name;
                session.user.email = token.email;
                session.user.image = token.picture;
                session.user.provider = token.provider;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    debug: process.env.NODE_ENV === 'development',
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// Export handlers for App Router
export const { GET, POST } = handlers;

