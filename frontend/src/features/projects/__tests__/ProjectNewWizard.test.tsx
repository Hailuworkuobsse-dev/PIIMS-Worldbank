import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import { ToastProvider } from "@/components/ui/Toast";
import ProjectNewPage from "../ProjectNewPage";
import { i18n } from "@/lib/i18n";

vi.mock("../project.api", () => ({
  projectApi: {
    create: vi.fn().mockResolvedValue({
      projectId: "p1",
      projectCode: "PIIMS-2026-0001",
      name: "x",
      status: "IDEA",
    }),
  },
}));

function Wrap({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
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

describe("ProjectNewPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders wizard with step 1", () => {
    render(
      <Wrap>
        <ProjectNewPage />
      </Wrap>,
    );
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /Identification/i })).toBeInTheDocument();
  });

  it("shows validation error for short name", async () => {
    render(
      <Wrap>
        <ProjectNewPage />
      </Wrap>,
    );
    const nameInput = screen.getByLabelText(/Project name/i);
    await userEvent.type(nameInput, "AB");
    await userEvent.click(screen.getByRole("button", { name: /Continue/i }));
    expect(
      await screen.findByText(/at least 3 characters/i),
    ).toBeInTheDocument();
  });

  it("autosaves draft to localStorage", async () => {
    vi.useFakeTimers();
    render(
      <Wrap>
        <ProjectNewPage />
      </Wrap>,
    );
    const nameInput = screen.getByLabelText(/Project name/i);
    await userEvent.setup({ delay: null, advanceTimers: vi.advanceTimersByTime }).type(nameInput, "Solar Mini-Grid");
    vi.advanceTimersByTime(20_000);
    const draft = JSON.parse(
      localStorage.getItem("piims.project.draft") ?? "{}",
    );
    expect(draft.name).toBe("Solar Mini-Grid");
    vi.useRealTimers();
  });
});