export const QUESTION_TYPES = [
  "SINGLE",
  "MULTI",
  "NUMERIC",
  "DECIMAL",
  "DATE",
  "TEXT",
  "GPS",
  "PHOTO",
  "AUDIO",
  "BARCODE",
  "MATRIX",
  "RANKING",
  "CALCULATED",
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export interface QuestionOption {
  optionId?: string | undefined;
  code: string;
  label: string;
  labelAm?: string | undefined;
  value: string;
  orderNo: number;
}

export interface Question {
  questionId: string;
  sectionId: string;
  code: string;
  type: QuestionType;
  text: string;
  textAm?: string | undefined;
  hint?: string | undefined;
  required: boolean;
  orderNo: number;
  validation?: Record<string, unknown> | undefined;
  calculation?: string | undefined;
  indicatorId?: string | undefined;
  disaggregationKey?: string | undefined;
  options?: QuestionOption[] | undefined;
  skipLogic?: SkipLogic[] | undefined;
}

export interface SkipLogic {
  logicId: string;
  questionId: string;
  condition: string; // e.g. "${q1_2} = 'F'"
  action: "SKIP" | "SHOW" | "HIDE" | "REQUIRE";
  targetQuestionId?: string;
}

export interface Section {
  sectionId: string;
  versionId: string;
  code: string;
  title: string;
  titleAm?: string | undefined;
  description?: string | undefined;
  orderNo: number;
  repeatable: boolean;
  repeatMin?: number | undefined;
  repeatMax?: number | undefined;
  questions: Question[];
}

export interface SurveyVersion {
  versionId: string;
  surveyId: string;
  versionNo: number;
  publishedAt?: string;
  locked: boolean;
  lockedAt?: string;
  languages: string[];
}

export interface Survey {
  surveyId: string;
  code: string;
  name: string;
  nameAm?: string;
  purpose?: string;
  projectId?: string;
  currentVersion?: SurveyVersion;
  status: "DRAFT" | "PUBLISHED" | "LOCKED" | "ARCHIVED";
  sections: Section[];
}

export interface SurveyFilters {
  q?: string;
  status?: Survey["status"];
}