import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { Breadcrumbs } from "../Breadcrumbs";
import "@/lib/i18n";

describe("Breadcrumbs", () => {
  it("renders dashboard crumb on /dashboard", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Breadcrumbs />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("navigation", { name: /breadcrumb/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Dashboard/)).toBeInTheDocument();
  });

  it("renders nested crumb for /projects", () => {
    render(
      <MemoryRouter initialEntries={["/projects"]}>
        <Breadcrumbs />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Dashboard/)).toBeInTheDocument();
    expect(screen.getByText(/Projects/)).toBeInTheDocument();
  });
});