import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExecutionGauge } from "../ExecutionGauge";
import "@/lib/i18n";

describe("ExecutionGauge", () => {
  it("renders percentage from execution rate", () => {
    render(
      <ExecutionGauge
        execution={{
          totalAppropriation: "1000",
          totalReleased: "800",
          totalExpended: "700",
          totalCommitted: "50",
          executionRate: 70,
          currency: "ETB",
          byComponent: [],
        }}
      />,
    );
    expect(screen.getByText("70%")).toBeInTheDocument();
  });
});