import { z } from 'zod';
import { QuestionType, SkipLogicAction } from '@prisma/client';

const questionTypeValues = Object.values(QuestionType) as [QuestionType, ...QuestionType[]];
const skipActionValues = Object.values(SkipLogicAction) as [SkipLogicAction, ...SkipLogicAction[]];

export const createSurveySchema = z.object({
  code: z.string().trim().min(1).max(30),
  name: z.string().trim().min(3).max(300),
  nameAm: z.string().trim().max(300).optional().or(z.literal('')),
  purpose: z.string().trim().max(1000).optional().or(z.literal('')),
  projectId: z.string().uuid().optional().or(z.literal(''))
});
export type CreateSurveyInput = z.infer<typeof createSurveySchema>;

export const createSectionSchema = z.object({
  versionId: z.string().uuid(),
  code: z.string().trim().min(1).max(20),
  title: z.string().trim().min(3).max(300),
  titleAm: z.string().trim().max(300).optional().or(z.literal('')),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  orderNo: z.coerce.number().int().min(0).default(0),
  repeatable: z.boolean().default(false),
  repeatMin: z.coerce.number().int().min(1).optional(),
  repeatMax: z.coerce.number().int().min(1).optional()
});
export type CreateSectionInput = z.infer<typeof createSectionSchema>;

export const createQuestionSchema = z.object({
  sectionId: z.string().uuid(),
  code: z.string().trim().min(1).max(30),
  type: z.enum(questionTypeValues),
  text: z.string().trim().min(3).max(500),
  textAm: z.string().trim().max(500).optional().or(z.literal('')),
  hint: z.string().trim().max(500).optional().or(z.literal('')),
  required: z.boolean().default(false),
  orderNo: z.coerce.number().int().min(0).default(0),
  indicatorId: z.string().uuid().optional().or(z.literal('')),
  disaggregationKey: z.string().max(50).optional().or(z.literal('')),
  calculation: z.string().max(300).optional().or(z.literal('')),
  options: z.array(z.object({
    code: z.string().trim().min(1).max(20),
    label: z.string().trim().min(1).max(300),
    labelAm: z.string().trim().max(300).optional().or(z.literal('')),
    value: z.string().trim().min(1).max(50),
    orderNo: z.coerce.number().int().min(0)
  })).optional()
}).refine(
  (d) => !['SINGLE', 'MULTI'].includes(d.type) || (d.options && d.options.length > 0),
  { path: ['options'], message: 'Choice questions require at least one option' }
);
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;

export const skipLogicSchema = z.object({
  questionId: z.string().uuid(),
  condition: z.string().trim().min(1).max(300),
  action: z.enum(skipActionValues),
  targetQuestionId: z.string().uuid().optional().or(z.literal(''))
});
export type SkipLogicInput = z.infer<typeof skipLogicSchema>;

export const assignSurveySchema = z.object({
  waveId: z.string().uuid(),
  surveyVersionId: z.string().uuid(),
  collectorIds: z.array(z.string().uuid()).min(1, 'At least one collector required'),
  supervisorId: z.string().uuid().optional().or(z.literal('')),
  region: z.string().max(100).optional().or(z.literal('')),
  woreda: z.string().max(100).optional().or(z.literal('')),
  targetCount: z.coerce.number().int().min(1).max(10000).default(1),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal(''))
});
export type AssignSurveyInput = z.infer<typeof assignSurveySchema>;