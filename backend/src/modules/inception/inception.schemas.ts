import { z } from 'zod';
import { InceptionStatus } from '@prisma/client';

export const submitInceptionSchema = z.object({
  projectId: z.string().uuid('Select a project'),
  templateId: z.string().uuid('Select a template').optional().or(z.literal('')),
  summary: z.string().trim().min(20, 'Summary must be at least 20 chars').max(2000),
  version: z.coerce.number().int().min(1).default(1)
});
export type SubmitInceptionInput = z.infer<typeof submitInceptionSchema>;

export const reviewDecisionSchema = z
  .object({
    decision: z.enum(['APPROVE', 'REQUEST_REVISION', 'REJECT']),
    comments: z.string().max(2000).optional().or(z.literal('')),
    sectionComments: z.record(z.string().max(1000)).optional()
  })
  .refine(
    (d) =>
      d.decision === 'APPROVE' ||
      (typeof d.comments === 'string' && d.comments.trim().length >= 10),
    {
      path: ['comments'],
      message: 'Comments (min 10 chars) required for revision or rejection'
    }
  );
export type ReviewDecisionInput = z.infer<typeof reviewDecisionSchema>;

export const noObjectionSchema = z.object({
  noObjection: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm no-objection' })
  }),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD'),
  comments: z.string().max(1000).optional().or(z.literal(''))
});
export type NoObjectionInput = z.infer<typeof noObjectionSchema>;

export const addCommentSchema = z.object({
  text: z.string().trim().min(1).max(2000),
  section_id: z.string().max(50).optional().or(z.literal('')),
  parent_id: z.string().uuid().optional().or(z.literal(''))
});
export type AddCommentInput = z.infer<typeof addCommentSchema>;

export const listReportsQuerySchema = z.object({
  project_id: z.string().uuid().optional(),
  status: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  overdue: z.coerce.boolean().optional(),
  q: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional()
});
export type ListReportsQuery = z.infer<typeof listReportsQuerySchema>;

export const STATUS_VALUES = Object.values(InceptionStatus);