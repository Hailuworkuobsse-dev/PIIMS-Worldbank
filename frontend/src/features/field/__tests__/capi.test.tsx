import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import { ToastProvider } from "@/components/ui/Toast";
import { CapiRenderer } from "../CapiRenderer";
import { i18n } from "@/lib/i18n";

// Mock the submit mutation
vi.mock("../field.mutations", () => ({
  useSubmitInterview: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("../offlineStore", () => ({
  offlineStore: {
    saveDraft: vi.fn().mockResolvedValue(undefined),
    enqueue: vi.fn().mockResolvedValue("local-id"),
    deleteDraft: vi.fn().mockResolvedValue(undefined),
  },
}));

const assignment = {
  assignmentId: "a1",
  waveId: "w0",
  waveCode: "W0",
  waveName: "Baseline",
  surveyVersionId: "sv1",
  collectorId: "c1",
  collectorName: "Yohannes",
  targetCount: 10,
  completedCount: 0,
  status: "ASSIGNED" as const,
  assignedAt: new Date().toISOString(),
};

const surveyView = {
  version: {
    versionId: "sv1",
    surveyId: "s1",
    versionNo: 1,
    locked: false,
    languages: ["en"],
  },
  sections: [
    {
      sectionId: "sec1",
      versionId: "sv1",
      code: "S1",
      title: "Household",
      orderNo: 0,
      repeatable: false,
      questions: [
        {
          questionId: "q1",
          sectionId: "sec1",
          code: "q1",
          type: "TEXT" as const,
          text: "Full name",
          required: true,
          orderNo: 0,
        },
        {
          questionId: "q2",
          sectionId: "sec1",
          code: "q2",
          type: "NUMERIC" as const,
          text: "Age",
          required: true,
          orderNo: 1,
        },
      ],
    },
  ],
  allQuestions: [],
};

function Wrap({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient();
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={qc}>
        <ToastProvider>
          <MemoryRouter>{children}</MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

describe("CapiRenderer", () => {
  it("starts at consent phase", () => {
    render(
      <Wrap>
        <CapiRenderer
          assignment={assignment}
          surveyView={surveyView}
          collectorId="c1"
          onExit={() => {}}
        />
      </Wrap>,
    );
    expect(
      screen.getByRole("heading", { name: /Consent/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/agrees to participate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/agrees to data use/i)).toBeInTheDocument();
  });

  it("requires participation + data_use consent to continue", async () => {
    render(
      <Wrap>
        <CapiRenderer
          assignment={assignment}
          surveyView={surveyView}
          collectorId="c1"
          onExit={() => {}}
        />
      </Wrap>,
    );
    const beginBtn = screen.getByRole("button", { name: /Begin interview/i });
    expect(beginBtn).toBeDisabled();
    await userEvent.click(screen.getByLabelText(/agrees to participate/i));
    await userEvent.click(screen.getByLabelText(/agrees to data use/i));
    expect(beginBtn).not.toBeDisabled();
  });

  it("shows first question after consent", async () => {
    render(
      <Wrap>
        <CapiRenderer
          assignment={assignment}
          surveyView={surveyView}
          collectorId="c1"
          onExit={() => {}}
        />
      </Wrap>,
    );
    await userEvent.click(screen.getByLabelText(/agrees to participate/i));
    await userEvent.click(screen.getByLabelText(/agrees to data use/i));
    await userEvent.click(
      screen.getByRole("button", { name: /Begin interview/i }),
    );
    expect(screen.getByText("Full name")).toBeInTheDocument();
  });

  it("validates required questions", async () => {
    render(
      <Wrap>
        <CapiRenderer
          assignment={assignment}
          surveyView={surveyView}
          collectorId="c1"
          onExit={() => {}}
        />
      </Wrap>,
    );
    await userEvent.click(screen.getByLabelText(/agrees to participate/i));
    await userEvent.click(screen.getByLabelText(/agrees to data use/i));
    await userEvent.click(
      screen.getByRole("button", { name: /Begin interview/i }),
    );
    await userEvent.click(screen.getByRole("button", { name: /Next/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/required/i);
  });
});