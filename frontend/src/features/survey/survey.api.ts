import { api } from "@/lib/api/client";
import type { Survey, SurveyFilters, SurveyVersion } from "./survey.types";
import type {
  SurveyFormData,
  SectionFormData,
  QuestionFormData,
  SkipLogicFormData,
} from "./survey.schema";

interface Envelope<T> {
  data: T;
}

export const surveyApi = {
  async list(f: SurveyFilters): Promise<Survey[]> {
    const p = new URLSearchParams();
    if (f.q) p.set("q", f.q);
    if (f.status) p.set("status", f.status);
    const { data } = await api.get<Envelope<Survey[]>>(
      `/surveys?${p.toString()}`,
    );
    return data.data;
  },

  async get(id: string): Promise<Survey> {
    const { data } = await api.get<Envelope<Survey>>(`/surveys/${id}`);
    return data.data;
  },

  async create(input: SurveyFormData): Promise<Survey> {
    const { data } = await api.post<Envelope<Survey>>("/surveys", input);
    return data.data;
  },

  async createVersion(
    surveyId: string,
    sections: SectionFormData[],
  ): Promise<SurveyVersion> {
    const { data } = await api.post<Envelope<SurveyVersion>>(
      `/surveys/${surveyId}/versions`,
      { sections },
    );
    return data.data;
  },

  async publish(surveyId: string): Promise<SurveyVersion> {
    const { data } = await api.post<Envelope<SurveyVersion>>(
      `/surveys/${surveyId}/publish`,
    );
    return data.data;
  },

  async lockVersion(
    surveyId: string,
    versionId: string,
  ): Promise<SurveyVersion> {
    const { data } = await api.post<Envelope<SurveyVersion>>(
      `/surveys/${surveyId}/versions/${versionId}/lock`,
    );
    return data.data;
  },

  async createQuestion(
    versionId: string,
    input: QuestionFormData,
  ): Promise<{ questionId: string }> {
    const { data } = await api.post<Envelope<{ questionId: string }>>(
      `/surveys/versions/${versionId}/questions`,
      input,
    );
    return data.data;
  },

  async createSkipLogic(
    versionId: string,
    input: SkipLogicFormData,
  ): Promise<{ logicId: string }> {
    const { data } = await api.post<Envelope<{ logicId: string }>>(
      `/surveys/versions/${versionId}/skip-logic`,
      input,
    );
    return data.data;
  },

  async exportXlsForm(surveyId: string): Promise<Blob> {
    const { data } = await api.get(`/surveys/${surveyId}/export-xlsform`, {
      responseType: "blob",
    });
    return data as unknown as Blob;
  },

  async importXlsForm(file: File, projectId?: string): Promise<Survey> {
    const fd = new FormData();
    fd.append("file", file);
    if (projectId) fd.append("project_id", projectId);
    const { data } = await api.post<Envelope<Survey>>(
      "/surveys/import-xlsform",
      fd,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return data.data;
  },
};