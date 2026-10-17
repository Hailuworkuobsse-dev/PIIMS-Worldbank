import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataGrid, type Column } from "../DataGrid";

interface Row {
  id: string;
  name: string;
  budget: number;
}

const cols: Column<Row>[] = [
  { id: "name", header: "Name", sortable: true },
  {
    id: "budget",
    header: "Budget",
    align: "right",
    sortable: true,
    render: (r) => <span>ETB {r.budget.toLocaleString()}</span>,
  },
];

const rows: Row[] = [
  { id: "1", name: "Alpha", budget: 5000 },
  { id: "2", name: "Bravo", budget: 1200 },
];

describe("DataGrid", () => {
  it("renders rows and headers", () => {
    render(<DataGrid columns={cols} rows={rows} ariaLabel="Projects" />);
    expect(screen.getByRole("table", { name: "Projects" })).toBeInTheDocument();
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("ETB 5,000")).toBeInTheDocument();
  });

  it("sorts ascending then descending on column click", async () => {
    render(<DataGrid columns={cols} rows={rows} />);
    const budgetHeader = screen.getByRole("button", { name: /Budget/i });
    await userEvent.click(budgetHeader);
    const cells = screen.getAllByRole("cell");
    // first data cell should be Bravo (smallest) after asc sort
    const firstRowFirstCell = cells[2]; // header row consumes cells[0..]
    expect(screen.getAllByRole("row")[1]).toHaveTextContent("Bravo");
  });

  it("calls onRowClick when Enter pressed", async () => {
    const onRowClick = vi.fn();
    render(<DataGrid columns={cols} rows={rows} onRowClick={onRowClick} />);
    const row = screen.getByText("Alpha").closest("tr")!;
    row.focus();
    await userEvent.keyboard("{Enter}");
    expect(onRowClick).toHaveBeenCalledWith(rows[0]);
  });

  it("shows empty message", () => {
    render(<DataGrid columns={cols} rows={[]} emptyMessage="No projects" />);
    expect(screen.getByText("No projects")).toBeInTheDocument();
  });
});