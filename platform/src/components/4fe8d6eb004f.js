/**
 * Notification Service - Handles all email notifications via Resend
 * This adapter ensures consistent error handling and logging
 */
import { EmailService } from '@/components/b2a0b00fb250';
export class NotificationService {
    emailService;
    constructor() {
        this.emailService = new EmailService();
    }
    /**
     * Send client consent invite (when therapist manually adds patient)
     */
    async sendClientInvite(data) {
        try {
            if (!data.to) {
                return {
                    success: false,
                    error: 'Recipient email is required',
                };
            }
            const result = await this.emailService.sendClientConsentInvite(data);
            if (!result) {
                return {
                    success: false,
                    error: 'Email service returned no result',
                };
            }
            return {
                success: true,
                messageId: result.id,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('[NotificationService] sendClientInvite failed:', {
                to: data.to,
                error: errorMessage,
            });
            return {
                success: false,
                error: errorMessage,
            };
        }
    }
    /**
     * Send booking confirmation to client
     */
    async sendBookingConfirmation(data) {
        try {
            if (!data.clientEmail) {
                return {
                    success: false,
                    error: 'Client email is required',
                };
            }
            const result = await this.emailService.sendBookingConfirmation(data);
            return {
                success: true,
                messageId: result.id,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('[NotificationService] sendBookingConfirmation failed:', {
                clientEmail: data.clientEmail,
                error: errorMessage,
            });
            return {
                success: false,
                error: errorMessage,
            };
        }
    }
    /**
     * Send therapist booking notification
     */
    async sendTherapistNotification(data) {
        try {
            const therapistEmail = data.therapistEmail || data.clientEmail;
            if (!therapistEmail) {
                return {
                    success: false,
                    error: 'Therapist email is required',
                };
            }
            const result = await this.emailService.sendTherapistBookingNotification(data);
            return {
                success: true,
                messageId: result.id,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('[NotificationService] sendTherapistNotification failed:', {
                therapistEmail: data.therapistEmail || data.clientEmail,
                error: errorMessage,
            });
            return {
                success: false,
                error: errorMessage,
            };
        }
    }
    /**
     * Send refund confirmation
     */
    async sendRefundConfirmation(data) {
        try {
            if (!data.to) {
                return {
                    success: false,
                    error: 'Recipient email is required',
                };
            }
            const result = await this.emailService.sendRefundConfirmation(data);
            return {
                success: true,
                messageId: result.id,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('[NotificationService] sendRefundConfirmation failed:', {
                to: data.to,
                error: errorMessage,
            });
            return {
                success: false,
                error: errorMessage,
            };
        }
    }
    /**
     * Send cancellation confirmation
     */
    async sendCancellationConfirmation(data) {
        try {
            if (!data.to) {
                return {
                    success: false,
                    error: 'Recipient email is required',
                };
            }
            const result = await this.emailService.sendCancellationConfirmation(data);
            return {
                success: true,
                messageId: result.id,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('[NotificationService] sendCancellationConfirmation failed:', {
                to: data.to,
                error: errorMessage,
            });
            return {
                success: false,
                error: errorMessage,
            };
        }
    }
    /**
     * Send payment failed notification
     */
    async sendPaymentFailedNotification(data) {
        try {
            if (!data.to) {
                return {
                    success: false,
                    error: 'Recipient email is required',
                };
            }
            const result = await this.emailService.sendPaymentFailedNotification(data);
            return {
                success: true,
                messageId: result.id,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('[NotificationService] sendPaymentFailedNotification failed:', {
                to: data.to,
                error: errorMessage,
            });
            return {
                success: false,
                error: errorMessage,
            };
        }
    }
    /**
     * Send message notification alert
     */
    async sendMessageNotification(data) {
        try {
            if (!data.to) {
                return {
                    success: false,
                    error: 'Recipient email is required',
                };
            }
            const result = await this.emailService.sendMessageNotification(data);
            return {
                success: true,
                messageId: result.id,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('[NotificationService] sendMessageNotification failed:', {
                to: data.to,
                error: errorMessage,
            });
            return {
                success: false,
                error: errorMessage,
            };
        }
    }
}
// Export singleton instance
export const notificationService = new NotificationService();
