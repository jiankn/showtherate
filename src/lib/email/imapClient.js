/**
 * IMAP 邮件客户端
 * 用于拉取工单系统的邮件回复
 */

import ImapSimple from 'imap-simple';
import { simpleParser } from 'mailparser';

// IMAP 配置
const getImapConfig = () => ({
    imap: {
        user: process.env.IMAP_USER,
        password: process.env.IMAP_PASSWORD,
        host: process.env.IMAP_HOST || 'imap.gmail.com',
        port: parseInt(process.env.IMAP_PORT || '993'),
        tls: process.env.IMAP_TLS !== 'false',
        authTimeout: 10000,
        tlsOptions: { rejectUnauthorized: false },
    },
});

/**
 * 连接到IMAP服务器
 */
export async function connectImap() {
    const config = getImapConfig();
    if (!config.imap.user || !config.imap.password) {
        throw new Error('IMAP credentials not configured');
    }
    return await ImapSimple.connect(config);
}

/**
 * 从邮件标题中提取工单号
 * 格式: [STR-000001] 工单标题
 */
export function extractTicketNo(subject) {
    const match = subject?.match(/\[STR-(\d+)\]/);
    if (match) {
        return `STR-${match[1]}`;
    }
    return null;
}

/**
 * 拉取新邮件
 */
export async function fetchNewEmails(connection) {
    await connection.openBox('INBOX');

    // 搜索未读邮件
    const searchCriteria = ['UNSEEN'];
    const fetchOptions = {
        bodies: ['HEADER', 'TEXT', ''],
        markSeen: false, // 先不标记，处理成功后再标记
    };

    const messages = await connection.search(searchCriteria, fetchOptions);

    const emails = [];
    for (const msg of messages) {
        try {
            const uid = msg.attributes.uid;
            const all = msg.parts.find(p => p.which === '');

            if (!all?.body) continue;

            // 解析邮件
            const parsed = await simpleParser(all.body);

            emails.push({
                uid,
                messageId: parsed.messageId,
                inReplyTo: parsed.inReplyTo,
                references: parsed.references?.join(' ') || '',
                from: parsed.from?.value?.[0] || {},
                subject: parsed.subject || '',
                text: parsed.text || '',
                html: parsed.html || '',
                date: parsed.date,
                attachments: parsed.attachments?.map(att => ({
                    filename: att.filename,
                    contentType: att.contentType,
                    size: att.size,
                })) || [],
            });
        } catch (err) {
            console.error('Failed to parse email:', err);
        }
    }

    return emails;
}

/**
 * 标记邮件为已读
 */
export async function markAsRead(connection, uid) {
    await connection.addFlags(uid, ['\\Seen']);
}

/**
 * 移动邮件到指定文件夹
 */
export async function moveToFolder(connection, uid, folder) {
    try {
        await connection.moveMessage(uid, folder);
    } catch (err) {
        console.error(`Failed to move message to ${folder}:`, err);
    }
}

/**
 * 处理入站邮件
 */
export async function processInboundEmail(email, supabaseAdmin) {
    const { addTicketReply, getTicketDetail } = await import('@/lib/tickets');

    // 1. 从标题提取工单号
    let ticketNo = extractTicketNo(email.subject);
    let ticket = null;

    // 2. 如果标题有工单号，查找工单
    if (ticketNo) {
        const { data } = await supabaseAdmin
            .from('tickets')
            .select('*')
            .eq('ticket_no', ticketNo)
            .single();
        ticket = data;
    }

    // 3. 如果没找到，尝试通过 References/In-Reply-To 查找
    if (!ticket && (email.inReplyTo || email.references)) {
        const { data } = await supabaseAdmin
            .from('ticket_messages')
            .select('ticket_id')
            .or(`message_id.eq.${email.inReplyTo},message_id.ilike.%${email.references}%`)
            .limit(1)
            .single();

        if (data?.ticket_id) {
            const ticketData = await getTicketDetail(data.ticket_id);
            ticket = ticketData;
        }
    }

    // 4. 如果还是没找到，可以选择创建新工单（根据配置）
    if (!ticket) {
        return { success: false, reason: 'no_matching_ticket' };
    }

    // 5. 验证发件人（必须是工单创建人）
    const senderEmail = email.from.address?.toLowerCase();
    if (senderEmail !== ticket.requester_email?.toLowerCase()) {
        // 标记为待审核
        await supabaseAdmin.from('ticket_messages').insert({
            ticket_id: ticket.id,
            author_email: senderEmail,
            author_name: email.from.name,
            author_type: 'customer',
            source: 'email',
            body: email.text,
            body_html: email.html,
            message_id: email.messageId,
            in_reply_to: email.inReplyTo,
            references: email.references,
            imap_uid: String(email.uid),
            mailbox: 'INBOX',
            review_status: 'pending',
        });
        return { success: true, action: 'pending_review' };
    }

    // 6. 添加回复
    await addTicketReply({
        ticketId: ticket.id,
        authorEmail: senderEmail,
        authorName: email.from.name,
        authorType: 'customer',
        body: email.text,
        source: 'email',
    });

    // 7. 记录邮件元数据（用于去重）
    await supabaseAdmin
        .from('ticket_messages')
        .update({
            message_id: email.messageId,
            in_reply_to: email.inReplyTo,
            references: email.references,
            imap_uid: String(email.uid),
            mailbox: 'INBOX',
        })
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: false })
        .limit(1);

    return { success: true, ticketNo: ticket.ticket_no };
}

export default {
    connectImap,
    fetchNewEmails,
    markAsRead,
    moveToFolder,
    extractTicketNo,
    processInboundEmail,
};
