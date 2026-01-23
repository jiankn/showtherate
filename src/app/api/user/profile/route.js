import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function cleanString(value, maxLen = 200) {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    return trimmed.slice(0, maxLen);
}

async function getAuthUserRow(supabaseAdmin, userId) {
    // First try with preferences column
    let result = await supabaseAdmin
        .from('users')
        .select('id, email, name, first_name, last_name, contact_email, nmls, phone, x_handle, facebook, tiktok, instagram, avatar_url, preferences')
        .eq('id', userId)
        .maybeSingle();

    // If preferences column doesn't exist, query without it
    if (result.error && result.error.message?.includes('preferences')) {
        result = await supabaseAdmin
            .from('users')
            .select('id, email, name, first_name, last_name, contact_email, nmls, phone, x_handle, facebook, tiktok, instagram, avatar_url')
            .eq('id', userId)
            .maybeSingle();
    }

    return result.data || null;
}

export async function GET() {
    try {
        const { auth } = await import('@/app/api/auth/[...nextauth]/route');
        const { supabaseAdmin } = await import('@/lib/supabase/server');

        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        const userRow = await getAuthUserRow(supabaseAdmin, userId);

        return NextResponse.json({
            profile: {
                firstName: userRow?.first_name ?? null,
                lastName: userRow?.last_name ?? null,
                email: userRow?.contact_email ?? userRow?.email ?? session.user.email ?? null,
                nmls: userRow?.nmls ?? null,
                phone: userRow?.phone ?? null,
                xHandle: userRow?.x_handle ?? null,
                facebook: userRow?.facebook ?? null,
                tiktok: userRow?.tiktok ?? null,
                instagram: userRow?.instagram ?? null,
                avatarUrl: userRow?.avatar_url ?? null,
                preferences: userRow?.preferences ?? { emailNotifications: true, theme: 'system' },
            },
        });
    } catch (error) {
        console.error('Profile GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const { auth } = await import('@/app/api/auth/[...nextauth]/route');
        const { supabaseAdmin } = await import('@/lib/supabase/server');

        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const profile = body?.profile && typeof body.profile === 'object' ? body.profile : {};

        const userId = session.user.id;

        // Handle preferences if provided
        let preferences = undefined;
        if (profile.preferences && typeof profile.preferences === 'object') {
            preferences = {
                emailNotifications: typeof profile.preferences.emailNotifications === 'boolean'
                    ? profile.preferences.emailNotifications
                    : true,
                theme: ['light', 'dark', 'system'].includes(profile.preferences.theme)
                    ? profile.preferences.theme
                    : 'system',
            };
        }

        const fields = {
            first_name: cleanString(profile.firstName, 80),
            last_name: cleanString(profile.lastName, 80),
            contact_email: cleanString(profile.email, 200),
            nmls: cleanString(profile.nmls, 40),
            phone: cleanString(profile.phone, 40),
            x_handle: cleanString(profile.xHandle, 80),
            facebook: cleanString(profile.facebook, 200),
            tiktok: cleanString(profile.tiktok, 200),
            instagram: cleanString(profile.instagram, 200),
            ...(preferences && { preferences }),
            updated_at: new Date().toISOString(),
        };

        Object.keys(fields).forEach((k) => {
            if (fields[k] === null) delete fields[k];
        });

        // Try to save with preferences first, fallback without if column doesn't exist
        let data, error;
        const hasPreferencesField = preferences !== undefined;

        if (hasPreferencesField) {
            // First attempt: save with preferences
            const result = await supabaseAdmin
                .from('users')
                .update(fields)
                .eq('id', userId)
                .select('id, email, name, first_name, last_name, contact_email, nmls, phone, x_handle, facebook, tiktok, instagram, avatar_url, preferences')
                .single();

            // Check if it failed due to missing preferences column
            if (result.error && result.error.message?.includes('preferences')) {
                console.warn('Preferences column not found, saving without preferences');
                // Remove preferences from fields and try again
                delete fields.preferences;
                const fallbackResult = await supabaseAdmin
                    .from('users')
                    .update(fields)
                    .eq('id', userId)
                    .select('id, email, name, first_name, last_name, contact_email, nmls, phone, x_handle, facebook, tiktok, instagram, avatar_url')
                    .single();
                data = fallbackResult.data;
                error = fallbackResult.error;
            } else {
                data = result.data;
                error = result.error;
            }
        } else {
            // No preferences to save
            const result = await supabaseAdmin
                .from('users')
                .update(fields)
                .eq('id', userId)
                .select('id, email, name, first_name, last_name, contact_email, nmls, phone, x_handle, facebook, tiktok, instagram, avatar_url')
                .single();
            data = result.data;
            error = result.error;
        }

        if (error || !data) {
            console.error('Profile save error:', {
                code: error?.code,
                message: error?.message,
                details: error?.details,
                hint: error?.hint,
            });
            const message = typeof error?.message === 'string' ? error.message : 'Failed to save profile';
            const code = typeof error?.code === 'string' ? error.code : null;

            const isMissingColumn =
                typeof message === 'string' &&
                (message.includes('Could not find the') ||
                    message.includes('column') ||
                    message.includes('schema cache') ||
                    message.includes('does not exist'));

            if (isMissingColumn) {
                return NextResponse.json(
                    {
                        error:
                            'Database schema is missing profile fields. Run the latest supabase/schema.sql (or add the profile columns to public.users), then retry.',
                        code,
                        original: message,
                    },
                    { status: 500 }
                );
            }
            return NextResponse.json({ error: message, code }, { status: 500 });
        }

        const displayName = [data.first_name, data.last_name].filter(Boolean).join(' ').trim();
        if (displayName) {
            await supabaseAdmin
                .from('users')
                .update({ name: displayName, updated_at: new Date().toISOString() })
                .eq('id', userId);
        }

        const userRow = await getAuthUserRow(supabaseAdmin, userId);

        return NextResponse.json({
            profile: {
                firstName: userRow?.first_name ?? null,
                lastName: userRow?.last_name ?? null,
                email: userRow?.contact_email ?? userRow?.email ?? session.user.email ?? null,
                nmls: userRow?.nmls ?? null,
                phone: userRow?.phone ?? null,
                xHandle: userRow?.x_handle ?? null,
                facebook: userRow?.facebook ?? null,
                tiktok: userRow?.tiktok ?? null,
                instagram: userRow?.instagram ?? null,
                avatarUrl: userRow?.avatar_url ?? null,
                preferences: userRow?.preferences ?? { emailNotifications: true, theme: 'system' },
            },
        });
    } catch (error) {
        console.error('Profile PUT error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
