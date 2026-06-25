import { z } from 'zod';
/**
 * Raw body shapes accepted by the therapist provider-notes endpoints. Kept
 * permissive to preserve the existing handlers' behaviour (manual validation of
 * `title`, passthrough of the remaining fields). The service applies the same
 * defaults the route handlers used to.
 */
export const createProviderNoteSchema = z.object({
    title: z.string().optional(),
    content: z.unknown().optional(),
    patientId: z.string().optional(),
    seekerId: z.string().optional(),
    noteType: z.string().optional(),
    isPrivate: z.boolean().optional(),
    templateKey: z.string().optional(),
    templateData: z.unknown().optional(),
}).passthrough();
export const updateProviderNoteSchema = z.object({
    title: z.string().optional(),
    content: z.unknown().optional(),
    patientId: z.string().optional(),
    seekerId: z.string().optional(),
    noteType: z.string().optional(),
    isPrivate: z.boolean().optional(),
    templateKey: z.string().optional(),
    templateData: z.unknown().optional(),
}).passthrough();
