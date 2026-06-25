import { z } from 'zod';
export const markReadSchema = z.object({
    senderId: z.string().min(1),
});
export const sendMessageSchema = z.object({
    recipientId: z.string().min(1),
    content: z.string().min(1),
});
