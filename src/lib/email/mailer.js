import nodemailer from 'nodemailer';
import { ADMIN_EMAIL } from '@/lib/adminAuth';

const smtpHost = process.env.SMTP_HOST;
const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM;
const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom) {
    return null;
  }
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
  return transporter;
}

export async function sendAdminTicketNotification(ticket, requester) {
  const mailer = getTransporter();
  if (!mailer) {
    console.warn('SMTP not configured, skipping ticket notification email.');
    return;
  }

  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || ADMIN_EMAIL;
  const subject = `[${ticket.ticket_no}] New support ticket`;
  const requesterLabel = requester?.email || 'Unknown requester';

  const text = [
    `A new support ticket was created.`,
    ``,
    `Ticket: ${ticket.ticket_no}`,
    `Title: ${ticket.title}`,
    `Requester: ${requesterLabel}`,
    `Priority: ${ticket.priority}`,
    `Status: ${ticket.status}`,
    ``,
    `Open in admin: ${process.env.ADMIN_TICKET_BASE_URL || ''}/admin/tickets/${ticket.id}`,
  ].join('\n');

  await mailer.sendMail({
    from: smtpFrom,
    to: adminEmail,
    subject,
    text,
  });
}

export async function sendRentCastUsageAlert(keyIndex, usage, limit, period) {
  const mailer = getTransporter();
  if (!mailer) {
    console.warn('SMTP not configured, skipping RentCast alert email.');
    return;
  }

  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || ADMIN_EMAIL;
  const percentage = Math.round((usage / limit) * 100);
  const subject = `[Alert] RentCast Key ${keyIndex} Usage Warning: ${percentage}%`;

  const text = [
    `RentCast API Key Alert`,
    ``,
    `Key Index: ${keyIndex}`,
    `Billing Period: ${period}`,
    `Usage: ${usage} / ${limit} (${percentage}%)`,
    ``,
    `Please check your quota usage. If all keys are exhausted, the API will stop working.`,
    `Manage Keys: ${process.env.NEXT_PUBLIC_SITE_URL || ''}/admin/settings`, // 假设有一个设置页面，如果没有可留空或指向 Supabase
  ].join('\n');

  try {
    await mailer.sendMail({
      from: smtpFrom,
      to: adminEmail,
      subject,
      text,
    });
    console.log(`[RentCast] Alert email sent for Key ${keyIndex} (${percentage}%)`);
  } catch (error) {
    console.error('[RentCast] Failed to send alert email:', error);
  }
}

