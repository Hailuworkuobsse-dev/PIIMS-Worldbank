import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LandingPage from "../LandingPage";
import { i18n } from "@/lib/i18n";

function renderLanding() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  );
}

describe("LandingPage", () => {
  it("renders hero, features and sign-in entry point", () => {
    renderLanding();
    expect(
      screen.getByRole("heading", { level: 1 }),
    ).toHaveTextContent(/World Bank-financed projects/i);
    expect(
      screen.getAllByRole("link", { name: /sign in/i }).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByRole("heading", { level: 2 }).length).toBeGreaterThanOrEqual(2);
  });

  it("exposes the skip-link target", () => {
    renderLanding();
    expect(document.getElementById("main")).toBeInTheDocument();
  });
});
