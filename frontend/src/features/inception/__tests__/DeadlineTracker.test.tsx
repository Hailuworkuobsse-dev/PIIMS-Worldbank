import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { DeadlineTracker } from "../DeadlineTracker";
import { i18n } from "@/lib/i18n";

vi.mock("../inception.queries", () => ({
  useInceptionReports: () => ({
    isLoading: false,
    data: {
      data: [
        {
          reportId: "r1",
          projectId: "p1",
          projectCode: "PIIMS-2026-0042",
          projectName: "Solar Oromia",
          version: 1,
          templateId: "t1",
          templateName: "Standard",
          dueDate: "2030-12-31",
          status: "SUBMITTED",
          noObjection: false,
        },
      ],
    },
  }),
}));

describe("DeadlineTracker", () => {
  it("renders upcoming deadlines", () => {
    const qc = new QueryClient();
    render(
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={qc}>
          <MemoryRouter>
            <DeadlineTracker />
          </MemoryRouter>
        </QueryClientProvider>
      </I18nextProvider>,
    );
    expect(screen.getByText("Solar Oromia")).toBeInTheDocument();
    expect(screen.getByText(/PIIMS-2026-0042/)).toBeInTheDocument();
  });
});