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
  optionId?: string;
  code: string;
  label: string;
  labelAm?: string;
  value: string;
  orderNo: number;
}

export interface Question {
  questionId: string;
  sectionId: string;
  code: string;
  type: QuestionType;
  text: string;
  textAm?: string;
  hint?: string;
  required: boolean;
  orderNo: number;
  validation?: Record<string, unknown>;
  calculation?: string;
  indicatorId?: string;
  disaggregationKey?: string;
  options?: QuestionOption[];
  skipLogic?: SkipLogic[];
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
  titleAm?: string;
  description?: string;
  orderNo: number;
  repeatable: boolean;
  repeatMin?: number;
  repeatMax?: number;
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