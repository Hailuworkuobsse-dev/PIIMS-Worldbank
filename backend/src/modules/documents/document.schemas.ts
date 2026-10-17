import { z } from 'zod';
import { DocType, AccessLevel } from '@prisma/client';

const docTypeValues = Object.values(DocType) as [DocType, ...DocType[]];
const accessLevelValues = Object.values(AccessLevel) as [AccessLevel, ...AccessLevel[]];

/**
 * Multipart body — all fields arrive as strings because form-data is text.
 * The `file` field is handled by multer separately.
 */
export const uploadDocumentSchema = z.object({
  projectId: z.string().uuid().optional().or(z.literal('')),
  docType: z.enum(docTypeValues),
  title: z.string().trim().min(3, 'Title must be at least 3 chars').max(300),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  accessLevel: z.enum(accessLevelValues).default(AccessLevel.INTERNAL),
  tags: z
    .string()
    .optional()
    .transform((s) => (s ? s.split(',').map((t) => t.trim()).filter(Boolean) : []))
});
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;

export const listDocumentsQuerySchema = z.object({
  project_id: z.string().uuid().optional(),
  doc_type: z.string().optional(),
  q: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional()
});
export type ListDocumentsQuery = z.infer<typeof listDocumentsQuerySchema>;