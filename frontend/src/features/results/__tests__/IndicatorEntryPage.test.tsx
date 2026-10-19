import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ToastProvider } from "@/components/ui/Toast";
import IndicatorEntryPage from "../IndicatorEntryPage";
import { i18n } from "@/lib/i18n";

vi.mock("../results.queries", () => ({
  useIndicator: () => ({
    isLoading: false,
    data: {
      indicatorId: "i1",
      subcomponentId: "s1",
      componentId: "c1",
      projectId: "p1",
      code: "IND-001",
      name: "Households with solar systems",
      indicatorType: "OUTPUT",
      unit: "households",
      baseline: 0,
      target: 5000,
      actual: 4250,
      frequency: "QUARTERLY",
      direction: "INCREASE",
      status: "ON_TRACK",
      achievementPct: 85,
    },
  }),
  useIndicatorValues: () => ({ data: [] }),
}));

vi.mock("../results.mutations", () => ({
  useRecordIndicatorValue: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

function Wrap({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient();
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={qc}>
        <ToastProvider>
          <MemoryRouter initialEntries={["/results/i1/entry"]}>
            <Routes>
              <Route path="/results/:indicatorId/entry" element={children} />
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

describe("IndicatorEntryPage", () => {
  it("renders indicator details and form", () => {
    render(
      <Wrap>
        <IndicatorEntryPage />
      </Wrap>,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /Households with solar systems/,
    );
    expect(screen.getByLabelText(/Reporting period/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Actual value/i)).toBeInTheDocument();
  });

  it("shows achievement percentage", () => {
    render(
      <Wrap>
        <IndicatorEntryPage />
      </Wrap>,
    );
    expect(screen.getByText(/Achievement/i)).toBeInTheDocument();
  });
});