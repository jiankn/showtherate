/**
 * Cron Job: SLA Check
 * 检查并更新工单SLA状态，发送提醒
 * 
 * Vercel Cron: 每10分钟执行一次
 * Schedule: 0/10 * * * * (every 10 minutes)
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request) {
    try {
        // 验证Cron密钥
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            const vercelCron = request.headers.get('x-vercel-cron');
            if (!vercelCron) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        // 动态导入
        const { updateSLAStatuses, getSLAConfig } = await import('@/lib/tickets');
        const { supabaseAdmin } = await import('@/lib/supabase/server');
        const { getSLAStatus, calculateSLARemaining, formatRemaining } = await import('@/lib/sla');

        // 更新SLA状态
        console.log('Checking SLA statuses...');
        const updateResult = await updateSLAStatuses();
        console.log(`Updated ${updateResult.updated} ticket SLA statuses`);

        // 获取需要提醒的工单
        const slaConfig = await getSLAConfig();
        const { data: warningTickets } = await supabaseAdmin
            .from('tickets')
            .select('id, ticket_no, title, requester_email, sla_deadline, sla_status')
            .is('first_response_at', null)
            .in('sla_status', ['warn', 'overdue'])
            .not('status', 'in', '("resolved","closed")');

        const reminders = [];

        for (const ticket of warningTickets || []) {
            const remaining = calculateSLARemaining(ticket.sla_deadline, slaConfig);
            reminders.push({
                ticketNo: ticket.ticket_no,
                title: ticket.title,
                status: ticket.sla_status,
                remaining: formatRemaining(remaining),
            });
        }

        // TODO: 发送提醒邮件（需要配置SMTP）
        // 这里可以集成邮件发送逻辑

        return NextResponse.json({
            success: true,
            updated: updateResult.updated,
            warnings: reminders.length,
            reminders,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Cron sla-check error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
        }, { status: 500 });
    }
}
