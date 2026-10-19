import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs } from "../Tabs";

const tabs = [
  { id: "a", label: "Tab A", content: <div>Content A</div> },
  { id: "b", label: "Tab B", content: <div>Content B</div> },
  { id: "c", label: "Tab C", content: <div>Content C</div>, disabled: true },
];

describe("Tabs", () => {
  it("renders all tabs with first active by default", () => {
    render(<Tabs tabs={tabs} />);
    expect(screen.getByRole("tab", { name: "Tab A" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Tab B" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
    expect(screen.getByText("Content A")).toBeVisible();
    // inactive panels stay mounted (ARIA keeps panels in the DOM) but hidden
    expect(
      screen.getByText("Content B").closest('[role="tabpanel"]'),
    ).not.toBeVisible();
  });

  it("switches active tab on click", async () => {
    render(<Tabs tabs={tabs} />);
    await userEvent.click(screen.getByRole("tab", { name: "Tab B" }));
    expect(screen.getByRole("tab", { name: "Tab B" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Content B")).toBeVisible();
  });

  it("navigates with arrow keys", async () => {
    render(<Tabs tabs={tabs} />);
    screen.getByRole("tab", { name: "Tab A" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Tab B" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await userEvent.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Tab A" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("wraps around with arrow keys", async () => {
    render(<Tabs tabs={tabs.slice(0, 2)} />);
    screen.getByRole("tab", { name: "Tab A" }).focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Tab B" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("does not activate disabled tab", async () => {
    render(<Tabs tabs={tabs} />);
    const disabledTab = screen.getByRole("tab", { name: "Tab C" });
    expect(disabledTab).toBeDisabled();
    await userEvent.click(disabledTab);
    expect(disabledTab).toHaveAttribute("aria-selected", "false");
  });

  it("has proper ARIA attributes", () => {
    render(<Tabs tabs={tabs} />);
    expect(screen.getByRole("tablist")).toHaveAttribute("aria-label", "Tabs");
    const tabA = screen.getByRole("tab", { name: "Tab A" });
    const panelA = screen.getByRole("tabpanel");
    expect(tabA).toHaveAttribute("aria-controls");
    expect(panelA).toHaveAttribute("aria-labelledby", tabA.id);
  });

  it("honors defaultTab prop", () => {
    render(<Tabs tabs={tabs} defaultTab="b" />);
    expect(screen.getByRole("tab", { name: "Tab B" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Content B")).toBeVisible();
  });
});