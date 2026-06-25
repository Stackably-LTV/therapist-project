// Note: This service should be called from API routes (server-side only)
// to keep the Resend API key secure
import { render } from '@react-email/render';
import { Resend } from 'resend';
import BookingConfirmationEmail from '@/components/c5deb8452f91';
import CancellationConfirmationEmail from '@/components/7461ea637452';
import ClientConsentInviteEmail from '@/components/71f9453f834a';
import PaymentFailedEmail from '@/components/7301bfbff196';
import RefundConfirmationEmail from '@/components/67aeb453c2b6';
import TherapistBookingNotificationEmail from '@/components/4bbf1e980d17';
import MessageNotificationEmail from '@/components/c9deb8d8f726';
export class EmailService {
    apiKey;
    fromEmail;
    resend;
    constructor() {
        this.apiKey = process.env.RESEND_API_KEY || '';
        this.fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@psychlink.pro';
        this.resend = new Resend(this.apiKey);
    }
    /**
     * Send an email using Resend API
     */
    // Returns the Resend result on success, or null on failure. Never throws — email
    // failures must not 500 a request that already wrote durable state (booking, invite, etc.).
    async sendEmail(data) {
        const maxAttempts = 3;
        try {
            for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
                const { data: result, error } = await this.resend.emails.send({
                    from: this.fromEmail,
                    to: data.to,
                    subject: data.subject,
                    html: data.html,
                    ...(data.replyTo ? { replyTo: data.replyTo } : {}),
                });
                if (!error) {
                    if (process.env.NODE_ENV !== 'production') {
                        console.log('[EmailService] sendEmail success', {
                            to: data.to,
                            subject: data.subject,
                            id: result?.id ?? null,
                            attempt,
                        });
                    }
                    return result;
                }
                const statusCode = error.statusCode;
                const retryable = typeof statusCode === 'number' ? statusCode >= 500 : true;
                const errorDetails = {
                    name: error.name ?? 'resend_error',
                    statusCode: statusCode ?? null,
                    message: error.message || 'Failed to send email',
                    attempt,
                };
                console.error('[EmailService] sendEmail provider error', errorDetails);
                if (retryable && attempt < maxAttempts) {
                    await new Promise((resolve) => setTimeout(resolve, attempt * 750));
                    continue;
                }
                return null;
            }
            return null;
        }
        catch (error) {
            console.error('Send email error:', error);
            return null;
        }
    }
    /**
     * Send booking confirmation email to client
     */
    async sendBookingConfirmation(data) {
        const html = await render(BookingConfirmationEmail({
            clientName: data.clientName,
            therapistName: data.therapistName,
            sessionDate: data.sessionDate,
            sessionDuration: data.sessionDuration,
            joinLink: data.joinLink,
        }));
        return this.sendEmail({
            to: data.clientEmail,
            subject: `Session Confirmed with ${data.therapistName}`,
            html,
        });
    }
    async sendClientConsentInvite(data) {
        const html = await render(ClientConsentInviteEmail({
            seekerName: data.seekerName,
            therapistName: data.therapistName,
            acceptUrl: data.acceptUrl,
            rejectUrl: data.rejectUrl,
            signupUrl: data.signupUrl,
            requiresSignup: data.requiresSignup,
        }));
        return this.sendEmail({
            to: data.to,
            subject: `${data.therapistName} requested client consent`,
            html,
        });
    }
    /**
     * Send booking notification to therapist
     */
    async sendTherapistBookingNotification(data) {
        const html = await render(TherapistBookingNotificationEmail({
            clientName: data.clientName,
            sessionDate: data.sessionDate,
            sessionDuration: data.sessionDuration,
            joinLink: data.joinLink,
        }));
        return this.sendEmail({
            to: data.therapistEmail || data.clientEmail,
            subject: `New Session Booked - ${data.clientName}`,
            html,
        });
    }
    /**
     * Send refund confirmation email
     */
    async sendRefundConfirmation(data) {
        const html = await render(RefundConfirmationEmail({
            clientName: data.clientName,
            amount: data.amount,
            currency: data.currency,
            sessionDate: data.sessionDate,
            therapistName: data.therapistName,
        }));
        return this.sendEmail({
            to: data.to,
            subject: 'Refund Processed Successfully',
            html,
        });
    }
    /**
     * Send cancellation confirmation email
     */
    async sendCancellationConfirmation(data) {
        const isClient = !!data.therapistName;
        const html = await render(CancellationConfirmationEmail({
            recipientName: data.recipientName,
            sessionDate: data.sessionDate,
            therapistName: data.therapistName,
            clientName: data.clientName,
            reason: data.reason,
            isClient,
            appUrl: process.env.NEXT_PUBLIC_APP_URL,
        }));
        return this.sendEmail({
            to: data.to,
            subject: 'Session Cancellation Confirmation',
            html,
        });
    }
    /**
     * Send payment failed notification
     */
    async sendPaymentFailedNotification(data) {
        const html = await render(PaymentFailedEmail({
            clientName: data.clientName,
            amount: data.amount,
            currency: data.currency,
            appUrl: process.env.NEXT_PUBLIC_APP_URL,
        }));
        return this.sendEmail({
            to: data.to,
            subject: 'Payment Failed - Action Required',
            html,
        });
    }
    /**
     * Send message notification (alerts for new messages)
     */
    async sendMessageNotification(data) {
        const html = await render(MessageNotificationEmail({
            recipientName: data.recipientName,
            senderName: data.senderName,
            messagePreview: data.messagePreview,
            chatUrl: data.chatUrl,
            appName: 'Psychlink.pro',
            settingsUrl: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/settings` : undefined,
        }));
        return this.sendEmail({
            to: data.to,
            subject: `New message from ${data.senderName}`,
            html,
        });
    }
}
// Export singleton instance (server-side only!)
export const emailService = new EmailService();
