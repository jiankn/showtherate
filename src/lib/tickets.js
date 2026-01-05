/**
 * 工单服务层
 * 处理工单的创建、查询、更新等业务逻辑
 */

import { supabaseAdmin } from '@/lib/supabase/server';
import { calculateSLADeadline, getSLAStatus, DEFAULT_CONFIG } from '@/lib/sla';

/**
 * 获取SLA配置
 */
export async function getSLAConfig() {
    const { data, error } = await supabaseAdmin
        .from('sla_config')
        .select('*')
        .eq('is_active', true)
        .single();

    if (error || !data) {
        return DEFAULT_CONFIG;
    }

    return {
        timezone: data.timezone,
        workdays: data.workdays,
        workStart: parseInt(data.work_start?.split(':')[0]) || 9,
        workEnd: parseInt(data.work_end?.split(':')[0]) || 18,
        firstResponseHours: data.first_response_hours,
        warnThreshold1: data.warn_threshold_1,
        warnThreshold2: data.warn_threshold_2,
        holidays: data.holidays || [],
    };
}

/**
 * 生成工单号
 */
export async function generateTicketNo() {
    const { data, error } = await supabaseAdmin.rpc('generate_ticket_no');
    if (error) {
        console.error('Failed to generate ticket no:', error);
        // 备用方案：时间戳
        return `STR-${Date.now().toString().slice(-6)}`;
    }
    return data;
}

/**
 * 创建工单
 */
export async function createTicket({
    title,
    description,
    bindType,
    bindId,
    requesterId,
    requesterEmail,
    requesterName,
    priority = 'normal',
}) {
    // 生成工单号
    const ticketNo = await generateTicketNo();

    // 获取SLA配置并计算截止时间
    const slaConfig = await getSLAConfig();
    const slaDeadline = calculateSLADeadline(new Date(), slaConfig);

    // 创建工单
    const { data: ticket, error } = await supabaseAdmin
        .from('tickets')
        .insert({
            ticket_no: ticketNo,
            title,
            description,
            status: 'new',
            priority,
            bind_type: bindType,
            bind_id: bindId || null,
            requester_id: requesterId,
            requester_email: requesterEmail,
            requester_name: requesterName,
            sla_deadline: slaDeadline.toISOString(),
            sla_status: 'normal',
            has_unread_customer_reply: true,  // 新工单对管理员来说是未读的
        })
        .select()
        .single();

    if (error) {
        console.error('Failed to create ticket:', error);
        throw new Error('Failed to create ticket');
    }

    // 如果有描述，创建初始消息
    if (description) {
        await supabaseAdmin.from('ticket_messages').insert({
            ticket_id: ticket.id,
            author_id: requesterId,
            author_email: requesterEmail,
            author_name: requesterName,
            author_type: 'customer',
            source: 'web',
            body: description,
        });
    }

    return ticket;
}

/**
 * 获取用户的工单列表
 */
export async function getUserTickets(userId, options = {}) {
    const { status, page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
        .from('tickets')
        .select('*, ticket_messages(count)', { count: 'exact' })
        .eq('requester_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (status) {
        query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
        console.error('Failed to get user tickets:', error);
        throw new Error('Failed to get ticket list');
    }

    return {
        tickets: data || [],
        total: count || 0,
        page,
        limit,
    };
}

/**
 * 获取工单详情（含消息）
 */
export async function getTicketDetail(ticketId, userId = null) {
    // 获取工单
    const { data: ticket, error } = await supabaseAdmin
        .from('tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

    if (error || !ticket) {
        return null;
    }

    // 权限检查（用户只能查看自己的工单）
    if (userId && ticket.requester_id !== userId && ticket.assignee_id !== userId) {
        return null;
    }

    // 获取消息
    const { data: messages } = await supabaseAdmin
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

    return {
        ...ticket,
        messages: messages || [],
    };
}

/**
 * 添加工单回复
 */
export async function addTicketReply({
    ticketId,
    authorId,
    authorEmail,
    authorName,
    authorType,
    body,
    source = 'web',
    attachments = [],
}) {
    // 获取当前工单状态
    const { data: ticket } = await supabaseAdmin
        .from('tickets')
        .select('status, first_response_at, assignee_id')
        .eq('id', ticketId)
        .single();

    if (!ticket) {
        throw new Error('Ticket not found');
    }

    // 判断是否为客服首次响应
    const isFirstResponse = authorType === 'staff' && !ticket.first_response_at;

    // 创建消息
    const { data: message, error } = await supabaseAdmin
        .from('ticket_messages')
        .insert({
            ticket_id: ticketId,
            author_id: authorId,
            author_email: authorEmail,
            author_name: authorName,
            author_type: authorType,
            source,
            body,
            attachments,
            is_first_response: isFirstResponse,
        })
        .select()
        .single();

    if (error) {
        console.error('Failed to add reply:', error);
        throw new Error('Failed to add reply');
    }

    // 更新工单状态
    const updates = {
        updated_at: new Date().toISOString(),
    };

    if (isFirstResponse) {
        updates.first_response_at = new Date().toISOString();
        updates.status = 'assigned';
        updates.sla_status = 'normal';  // 首次响应完成，重置SLA状态
    } else if (authorType === 'customer' && ticket.status === 'waiting_customer') {
        updates.status = 'processing';
    } else if (authorType === 'staff') {
        updates.status = 'waiting_customer';
    }

    // 客服回复时标记为用户未读
    if (authorType === 'staff') {
        updates.has_unread_reply = true;
    }

    // 用户回复时标记为管理员未读
    if (authorType === 'customer') {
        updates.has_unread_customer_reply = true;
    }

    await supabaseAdmin
        .from('tickets')
        .update(updates)
        .eq('id', ticketId);

    return message;
}

/**
 * 更新工单状态
 */
export async function updateTicketStatus(ticketId, status, resolution = null, userId = null) {
    const updates = {
        status,
        updated_at: new Date().toISOString(),
    };

    if (status === 'resolved' || status === 'closed') {
        updates.resolved_at = new Date().toISOString();
        if (resolution) {
            updates.resolution = resolution;
        }
    }

    let query = supabaseAdmin
        .from('tickets')
        .update(updates)
        .eq('id', ticketId)
        .select()
        .single();

    // 如果提供了userId，则只允许用户更新自己的工单
    if (userId) {
        query = query.eq('requester_id', userId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Failed to update ticket status:', error);
        throw new Error('Failed to update ticket status');
    }

    if (!data && userId) {
        throw new Error('No permission to operate this ticket');
    }

    return data;
}

/**
 * 获取所有工单（客服用）
 */
export async function getAllTickets(options = {}) {
    const { status, slaStatus, bindType, page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
        .from('tickets')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (status) {
        query = query.eq('status', status);
    }
    if (slaStatus) {
        query = query.eq('sla_status', slaStatus);
    }
    if (bindType) {
        query = query.eq('bind_type', bindType);
    }

    const { data, error, count } = await query;

    if (error) {
        console.error('Failed to get all tickets:', error);
        throw new Error('Failed to get ticket list');
    }

    return {
        tickets: data || [],
        total: count || 0,
        page,
        limit,
    };
}

/**
 * 更新SLA状态（定时任务调用）
 */
export async function updateSLAStatuses() {
    const slaConfig = await getSLAConfig();

    // 获取所有未关闭且未首次响应的工单
    const { data: tickets } = await supabaseAdmin
        .from('tickets')
        .select('id, sla_deadline, sla_status')
        .is('first_response_at', null)
        .not('status', 'in', '("resolved","closed")');

    if (!tickets?.length) {
        return { updated: 0 };
    }

    let updated = 0;
    for (const ticket of tickets) {
        const newStatus = getSLAStatus(ticket.sla_deadline, slaConfig);
        if (newStatus !== ticket.sla_status) {
            await supabaseAdmin
                .from('tickets')
                .update({ sla_status: newStatus })
                .eq('id', ticket.id);
            updated++;
        }
    }

    return { updated };
}

/**
 * 获取用户未读工单数量
 * 未读工单：has_unread_reply = true 的工单
 */
export async function getUnreadTicketCount(userId) {
    const { count, error } = await supabaseAdmin
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('requester_id', userId)
        .eq('has_unread_reply', true);

    if (error) {
        console.error('Failed to get unread ticket count:', error);
        throw new Error('Failed to get unread ticket count');
    }

    return count || 0;
}

/**
 * 标记工单为已读
 */
export async function markTicketAsRead(ticketId, userId) {
    const { data, error } = await supabaseAdmin
        .from('tickets')
        .update({ has_unread_reply: false })
        .eq('id', ticketId)
        .eq('requester_id', userId)
        .select()
        .single();

    if (error) {
        console.error('Failed to mark ticket as read:', error);
        // 不抛出错误，允许静默失败
        return null;
    }

    return data;
}

/**
 * 获取管理后台未读工单数量
 * 未读工单：has_unread_customer_reply = true 的工单
 */
export async function getAdminUnreadTicketCount() {
    const { count, error } = await supabaseAdmin
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('has_unread_customer_reply', true);

    if (error) {
        console.error('Failed to get admin unread ticket count:', error);
        throw new Error('Failed to get admin unread ticket count');
    }

    return count || 0;
}

/**
 * 管理员标记工单为已读
 */
export async function markTicketAsReadByAdmin(ticketId) {
    const { data, error } = await supabaseAdmin
        .from('tickets')
        .update({ has_unread_customer_reply: false })
        .eq('id', ticketId)
        .select()
        .single();

    if (error) {
        console.error('Failed to mark ticket as read by admin:', error);
        return null;
    }

    return data;
}

/**
 * 批量删除工单（仅限用户删除自己的）
 */
export async function batchDeleteTickets(ticketIds, userId) {
    if (!ticketIds || ticketIds.length === 0) {
        return { count: 0 };
    }

    // 安全检查：仅删除属于该用户的工单
    const { data: userTickets, error: checkError } = await supabaseAdmin
        .from('tickets')
        .select('id')
        .in('id', ticketIds)
        .eq('requester_id', userId);

    if (checkError) {
        throw new Error('Failed to verify ticket ownership');
    }

    const validIds = userTickets.map(t => t.id);

    if (validIds.length === 0) {
        return { count: 0 };
    }

    // 先删除消息（级联删除应自动处理，但为了保险手动删除）
    await supabaseAdmin
        .from('ticket_messages')
        .delete()
        .in('ticket_id', validIds);

    // 删除工单
    const { count, error } = await supabaseAdmin
        .from('tickets')
        .delete({ count: 'exact' })
        .in('id', validIds);

    if (error) {
        console.error('Failed to delete tickets:', error);
        throw new Error('Failed to delete tickets');
    }

    return { count };
}

export default {
    getSLAConfig,
    generateTicketNo,
    createTicket,
    getUserTickets,
    getTicketDetail,
    addTicketReply,
    updateTicketStatus,
    getAllTickets,
    updateSLAStatuses,
    batchDeleteTickets,
    getUnreadTicketCount,
    getAdminUnreadTicketCount,
    markTicketAsRead,
    markTicketAsReadByAdmin,
};
