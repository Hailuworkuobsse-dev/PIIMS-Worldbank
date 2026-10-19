import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DuplicateWarningModal } from "../DuplicateWarningModal";
import "@/lib/i18n";

const candidates = [
  {
    candidateId: "1",
    fullName: "Aster Bekele",
    uniqueId: "BEN-001",
    region: "Oromia",
    woreda: "Bora",
    dedupScore: 0.92,
    matchReasons: ["name", "phone"],
  },
];

describe("DuplicateWarningModal", () => {
  it("renders candidates and fires callbacks", async () => {
    const onProceed = vi.fn();
    const onCancel = vi.fn();
    const onMerge = vi.fn();
    render(
      <DuplicateWarningModal
        open
        candidates={candidates}
        onCancel={onCancel}
        onMerge={onMerge}
        onProceed={onProceed}
      />,
    );
    expect(screen.getByText("Aster Bekele")).toBeInTheDocument();
    expect(screen.getByText("92% match")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Proceed anyway/i }));
    expect(onProceed).toHaveBeenCalled();
  });
});