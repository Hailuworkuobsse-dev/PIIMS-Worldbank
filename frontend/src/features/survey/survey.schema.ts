import { z } from "zod";
import { QUESTION_TYPES } from "./survey.types";

export const questionOptionSchema = z.object({
  code: z.string().trim().min(1).max(20),
  label: z.string().trim().min(1).max(300),
  labelAm: z.string().trim().max(300).optional().or(z.literal("")),
  value: z.string().trim().min(1).max(50),
  orderNo: z.number().int().min(0),
});

export const questionSchema = z
  .object({
    sectionId: z.string().uuid(),
    code: z.string().trim().min(1, "Code is required").max(30),
    type: z.enum(QUESTION_TYPES),
    text: z.string().trim().min(3, "Question text required").max(500),
    textAm: z.string().trim().max(500).optional().or(z.literal("")),
    hint: z.string().trim().max(500).optional().or(z.literal("")),
    required: z.boolean().default(false),
    orderNo: z.number().int().min(0),
    indicatorId: z.string().uuid().optional().or(z.literal("")),
    disaggregationKey: z.string().max(50).optional().or(z.literal("")),
    calculation: z.string().max(300).optional().or(z.literal("")),
    options: z.array(questionOptionSchema).optional(),
  })
  .refine(
    (d) =>
      !["SINGLE", "MULTI"].includes(d.type) ||
      (d.options && d.options.length > 0),
    {
      path: ["options"],
      message: "Choice questions require at least one option",
    },
  );
export type QuestionFormData = z.infer<typeof questionSchema>;

export const sectionSchema = z.object({
  versionId: z.string().uuid(),
  code: z.string().trim().min(1).max(20),
  title: z.string().trim().min(3).max(300),
  titleAm: z.string().trim().max(300).optional().or(z.literal("")),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  orderNo: z.number().int().min(0),
  repeatable: z.boolean().default(false),
  repeatMin: z.number().int().min(1).optional(),
  repeatMax: z.number().int().min(1).optional(),
});
export type SectionFormData = z.infer<typeof sectionSchema>;

export const skipLogicSchema = z.object({
  questionId: z.string().uuid(),
  condition: z.string().trim().min(1, "Condition required").max(300),
  action: z.enum(["SKIP", "SHOW", "HIDE", "REQUIRE"]),
  targetQuestionId: z.string().uuid().optional(),
});
export type SkipLogicFormData = z.infer<typeof skipLogicSchema>;

export const surveySchema = z.object({
  code: z.string().trim().min(1).max(30),
  name: z.string().trim().min(3).max(300),
  nameAm: z.string().trim().max(300).optional().or(z.literal("")),
  purpose: z.string().trim().max(1000).optional().or(z.literal("")),
  projectId: z.string().uuid().optional().or(z.literal("")),
});
export type SurveyFormData = z.infer<typeof surveySchema>;