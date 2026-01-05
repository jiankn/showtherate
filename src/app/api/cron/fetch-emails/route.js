/**
 * Cron Job: Fetch Emails
 * 拉取IMAP邮件并处理工单回复
 * 
 * Vercel Cron: 每5分钟执行一次
 * Schedule: 0/5 * * * * (every 5 minutes)
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 最大执行时间60秒

export async function GET(request) {
    try {
        // 验证Cron密钥（Vercel自动添加或自定义）
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        // Vercel Cron 会自动添加 Authorization header
        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            // 也检查 Vercel 的内置验证
            const vercelCron = request.headers.get('x-vercel-cron');
            if (!vercelCron) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        // 检查IMAP配置
        if (!process.env.IMAP_USER || !process.env.IMAP_PASSWORD) {
            return NextResponse.json({
                error: 'IMAP not configured',
                message: 'Please set IMAP_USER and IMAP_PASSWORD environment variables'
            }, { status: 500 });
        }

        // 动态导入
        const { connectImap, fetchNewEmails, markAsRead, processInboundEmail } =
            await import('@/lib/email/imapClient');
        const { supabaseAdmin } = await import('@/lib/supabase/server');

        // 连接IMAP
        console.log('Connecting to IMAP server...');
        const connection = await connectImap();

        try {
            // 拉取新邮件
            console.log('Fetching new emails...');
            const emails = await fetchNewEmails(connection);
            console.log(`Found ${emails.length} new emails`);

            const results = {
                total: emails.length,
                processed: 0,
                failed: 0,
                errors: [],
            };

            // 处理每封邮件
            for (const email of emails) {
                try {
                    const result = await processInboundEmail(email, supabaseAdmin);

                    if (result.success) {
                        // 标记为已读
                        await markAsRead(connection, email.uid);
                        results.processed++;
                        console.log(`Processed email: ${email.subject}`);
                    } else {
                        results.failed++;
                        results.errors.push({
                            subject: email.subject,
                            reason: result.reason,
                        });
                    }
                } catch (err) {
                    console.error('Failed to process email:', err);
                    results.failed++;
                    results.errors.push({
                        subject: email.subject,
                        error: err.message,
                    });
                }
            }

            return NextResponse.json({
                success: true,
                ...results,
                timestamp: new Date().toISOString(),
            });
        } finally {
            // 确保断开连接
            await connection.end();
        }
    } catch (error) {
        console.error('Cron fetch-emails error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
        }, { status: 500 });
    }
}
