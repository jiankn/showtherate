import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Allowed image types and max size
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * POST /api/user/avatar
 * Upload avatar image to Supabase Storage
 */
export async function POST(request) {
    try {
        const { auth } = await import('@/app/api/auth/[...nextauth]/route');
        const { supabaseAdmin } = await import('@/lib/supabase/server');

        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // Parse form data
        const formData = await request.formData();
        const file = formData.get('avatar');

        if (!file || !(file instanceof Blob)) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Allowed: JPG, PNG, WebP, GIF' },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_SIZE) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 5MB' },
                { status: 400 }
            );
        }

        // Get file extension
        const ext = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1];
        const fileName = `${userId}/avatar.${ext}`;

        // Convert to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Delete old avatar if exists (different extension)
        const extensions = ['jpg', 'png', 'webp', 'gif'];
        for (const oldExt of extensions) {
            if (oldExt !== ext) {
                await supabaseAdmin.storage
                    .from('avatars')
                    .remove([`${userId}/avatar.${oldExt}`]);
            }
        }

        // Upload to Supabase Storage
        const { error: uploadError } = await supabaseAdmin.storage
            .from('avatars')
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: true,
                cacheControl: '3600',
            });

        if (uploadError) {
            console.error('Avatar upload error:', uploadError);
            return NextResponse.json(
                { error: 'Failed to upload avatar' },
                { status: 500 }
            );
        }

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
            .from('avatars')
            .getPublicUrl(fileName);

        // 添加时间戳破除浏览器缓存
        const avatarUrl = urlData?.publicUrl ? `${urlData.publicUrl}?t=${Date.now()}` : null;

        // Update user record (保存带时间戳的 URL)
        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

        if (updateError) {
            console.error('Avatar URL update error:', updateError);
            return NextResponse.json(
                { error: 'Failed to save avatar URL' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            avatarUrl,
        });
    } catch (error) {
        console.error('Avatar POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE /api/user/avatar
 * Delete avatar from Supabase Storage
 */
export async function DELETE() {
    try {
        const { auth } = await import('@/app/api/auth/[...nextauth]/route');
        const { supabaseAdmin } = await import('@/lib/supabase/server');

        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // Delete all possible avatar files
        const extensions = ['jpg', 'png', 'webp', 'gif'];
        for (const ext of extensions) {
            await supabaseAdmin.storage
                .from('avatars')
                .remove([`${userId}/avatar.${ext}`]);
        }

        // Clear avatar_url in database
        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({
                avatar_url: null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

        if (updateError) {
            console.error('Avatar clear error:', updateError);
            return NextResponse.json(
                { error: 'Failed to clear avatar' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Avatar DELETE error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
