import { api } from "@/lib/api/client";
import type {
  Assignment,
  Submission,
  SurveyView,
  Collector,
} from "./field.types";

interface Envelope<T> {
  data: T;
}

export const fieldApi = {
  async me(): Promise<Collector> {
    const { data } = await api.get<Envelope<Collector>>("/collect/me");
    return data.data;
  },

  async assignments(): Promise<Assignment[]> {
    const { data } = await api.get<Envelope<Assignment[]>>(
      "/collect/assignments",
    );
    return data.data;
  },

  async surveyView(assignmentId: string): Promise<SurveyView> {
    const { data } = await api.get<Envelope<SurveyView>>(
      `/collect/assignments/${assignmentId}/survey`,
    );
    return data.data;
  },

  async submit(
    submission: Submission,
  ): Promise<{ submissionId: string; status: string }> {
    const { data } = await api.post<
      Envelope<{ submissionId: string; status: string }>
    >("/collect/submit", submission);
    return data.data;
  },

  async deviceRegister(
    deviceId: string,
    platform: string,
    appVersion: string,
  ): Promise<void> {
    await api.post("/collect/device/register", {
      device_id: deviceId,
      platform,
      app_version: appVersion,
    });
  },
};