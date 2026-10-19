import type {
  Question,
  Section,
  SurveyVersion,
} from "@/features/survey/survey.types";

export interface Collector {
  collectorId: string;
  userId: string;
  fullName: string;
  region?: string;
  woreda?: string;
  deviceId?: string | undefined;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}

export interface Assignment {
  assignmentId: string;
  waveId: string;
  waveCode: string;
  waveName: string;
  surveyVersionId: string;
  collectorId: string;
  collectorName: string;
  supervisorId?: string;
  region?: string;
  woreda?: string;
  targetCount: number;
  completedCount: number;
  status: "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  assignedAt: string;
  dueDate?: string;
}

export interface ParadataEntry {
  questionId?: string;
  timeSpentMs: number;
  editCount: number;
  interrupted: boolean;
}

export interface ConsentPayload {
  participation: boolean;
  data_use: boolean;
  future_research: boolean;
  media: boolean;
  contact: boolean;
  consent_version: string;
  language: "en" | "am";
}

export interface SubmissionAnswer {
  questionId: string;
  valueType: "TEXT" | "NUMERIC" | "DATE" | "JSON" | "GPS" | "MEDIA";
  valueText?: string;
  valueNumeric?: number;
  valueDate?: string;
  valueJson?: Record<string, unknown>;
  valueGps?: { lat: number; lon: number };
}

export interface Submission {
  submissionId?: string;
  assignmentId: string;
  collectorId: string;
  waveId: string;
  surveyVersionId: string;
  beneficiaryId?: string;
  panelId?: string;
  startedAt: string;
  endedAt?: string;
  gpsStart?: { lat: number; lon: number } | undefined;
  gpsEnd?: { lat: number; lon: number } | undefined;
  deviceId?: string | undefined;
  consent: ConsentPayload;
  answers: SubmissionAnswer[];
  paradata: ParadataEntry[];
  checksum?: string;
  status:
    | "DRAFT"
    | "SUBMITTED"
    | "SYNCED"
    | "QA_REVIEW"
    | "QA_CLEARED"
    | "REJECTED";
}

/** Local-only draft (in IndexedDB) */
export interface LocalDraft {
  localId: string;
  assignmentId: string;
  answers: Record<string, any>;
  startedAt: string;
  lastSavedAt: string;
  sectionIndex: number;
  questionIndex: number;
}

export interface SurveyView {
  version: SurveyVersion;
  sections: Section[];
  allQuestions: Question[];
}