/**
 * 管理后台全局搜索 API
 * GET /api/admin/search?q=关键词
 * 搜索工单、用户、订阅
 */

import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/adminServerAuth';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const adminUser = await getAdminUser();
        if (!adminUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q')?.trim() || '';

        if (!query || query.length < 2) {
            return NextResponse.json({ results: [] });
        }

        const searchPattern = `%${query}%`;
        const results = [];

        // 1. 搜索工单
        const { data: tickets } = await supabaseAdmin
            .from('tickets')
            .select('id, ticket_no, title, requester_email, status')
            .or(`ticket_no.ilike.${searchPattern},title.ilike.${searchPattern},requester_email.ilike.${searchPattern}`)
            .limit(5);

        if (tickets?.length) {
            tickets.forEach((t) => {
                results.push({
                    type: 'ticket',
                    id: t.id,
                    title: t.ticket_no,
                    subtitle: t.title,
                    meta: t.requester_email,
                    status: t.status,
                    href: `/admin/tickets/${t.id}`,
                });
            });
        }

        // 2. 搜索用户
        const { data: users } = await supabaseAdmin
            .from('users')
            .select('id, email, name')
            .or(`email.ilike.${searchPattern},name.ilike.${searchPattern}`)
            .limit(5);

        if (users?.length) {
            users.forEach((u) => {
                results.push({
                    type: 'user',
                    id: u.id,
                    title: u.email,
                    subtitle: u.name || 'No name',
                    href: `/admin/users/${u.id}`,
                });
            });
        }

        // 3. 搜索订阅
        const { data: subscriptions } = await supabaseAdmin
            .from('subscriptions')
            .select('id, stripe_customer_id, stripe_subscription_id, status, plan, user_id, users(email)')
            .or(`stripe_customer_id.ilike.${searchPattern},stripe_subscription_id.ilike.${searchPattern},plan.ilike.${searchPattern}`)
            .limit(5);

        if (subscriptions?.length) {
            subscriptions.forEach((s) => {
                results.push({
                    type: 'subscription',
                    id: s.id,
                    title: s.plan || 'Subscription',
                    subtitle: s.users?.email || s.stripe_customer_id,
                    status: s.status,
                    href: `/admin/subscriptions?id=${s.id}`,
                });
            });
        }

        // 4. 搜索金额（如果输入是数字）
        const numQuery = parseFloat(query);
        if (!isNaN(numQuery)) {
            // 搜索 entitlements 中的支付记录
            const { data: payments } = await supabaseAdmin
                .from('entitlements')
                .select('id, type, stripe_payment_intent_id, user_id, users(email)')
                .not('stripe_payment_intent_id', 'is', null)
                .limit(5);

            if (payments?.length) {
                payments.forEach((p) => {
                    results.push({
                        type: 'payment',
                        id: p.id,
                        title: p.type,
                        subtitle: p.users?.email || 'Unknown user',
                        meta: p.stripe_payment_intent_id,
                        href: `/admin/revenue?payment=${p.id}`,
                    });
                });
            }
        }

        return NextResponse.json({ results: results.slice(0, 10) });
    } catch (error) {
        console.error('Admin search error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
