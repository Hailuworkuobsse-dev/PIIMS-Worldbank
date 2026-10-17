import { useState } from "react";
import {
  Button,
  IconButton,
  Input,
  Textarea,
  Select,
  Checkbox,
  RadioGroup,
  Switch,
  DateInput,
  FileUpload,
  Chip,
  Badge,
  Tooltip,
  Popover,
  Modal,
  Drawer,
  ConfirmDialog,
  Banner,
  Card,
  CardHeader,
  KPITile,
  DataGrid,
  Pagination,
  SkeletonTable,
  EmptyState,
  LoadingState,
  ErrorState,
  Tabs,
  Accordion,
  Breadcrumb,
  Stepper,
  Progress,
  TrafficLight,
  SyncBadge,
  useToast,
  type Column,
} from "@/components/ui";
import { Plus, Trash2, Filter, Download } from "lucide-react";

interface Row {
  id: string;
  code: string;
  name: string;
  budget: number;
  status: "ON_TRACK" | "AT_RISK" | "OFF_TRACK";
}

export default function DesignSystemPage() {
  const { push } = useToast();
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [radio, setRadio] = useState("female");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const rows: Row[] = [
    {
      id: "1",
      code: "PIIMS-2026-0042",
      name: "Solar Mini-Grid Oromia",
      budget: 15_000_000,
      status: "ON_TRACK",
    },
    {
      id: "2",
      code: "PIIMS-2026-0038",
      name: "Solar Home Systems Amhara",
      budget: 8_450_000,
      status: "AT_RISK",
    },
    {
      id: "3",
      code: "PIIMS-2026-0035",
      name: "Water Supply SNNP",
      budget: 22_100_000,
      status: "ON_TRACK",
    },
    {
      id: "4",
      code: "PIIMS-2026-0044",
      name: "Solar Irrigation Tigray",
      budget: 11_200_000,
      status: "OFF_TRACK",
    },
  ];

  const cols: Column<Row>[] = [
    { id: "code", header: "Code", sortable: true },
    { id: "name", header: "Project", sortable: true },
    {
      id: "budget",
      header: "Budget (ETB)",
      align: "right",
      sortable: true,
      render: (r) => r.budget.toLocaleString(),
    },
    {
      id: "status",
      header: "Status",
      render: (r) => (
        <TrafficLight
          status={r.status}
          percent={
            r.status === "ON_TRACK" ? 88 : r.status === "AT_RISK" ? 65 : 42
          }
        />
      ),
    },
  ];

  return (
    <div className="p-6 space-y-8">
      <header>
        <h1 className="text-h1">Design System — Living Catalogue</h1>
        <p className="text-neutral-600 mt-1">
          Every primitive, in context. Dev-only route.
        </p>
      </header>

      {/* Buttons */}
      <section className="space-y-3">
        <h2 className="text-h2">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
            Primary
          </Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger" leftIcon={<Trash2 className="h-4 w-4" />}>
            Delete
          </Button>
          <Button variant="link">Link</Button>
          <Button loading>Loading…</Button>
          <Button disabled>Disabled</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <IconButton label="Filter" icon={<Filter className="h-4 w-4" />} />
        </div>
      </section>

      {/* Form */}
      <section className="space-y-3">
        <h2 className="text-h2">Form controls</h2>
        <div className="grid md:grid-cols-2 gap-4 max-w-3xl">
          <Input
            label="Project name"
            required
            hint="Enter official name"
            leftIcon={<span>📁</span>}
          />
          <Input label="Project code" error="Code already exists" />
          <Select
            label="Sector"
            required
            options={[
              { value: "energy", label: "Energy" },
              { value: "water", label: "Water" },
            ]}
            placeholder="Choose…"
          />
          <DateInput label="Start date" required />
          <Textarea label="Description" rows={3} />
          <FileUpload
            label="Attach document"
            accept=".pdf,.docx"
            maxSizeMB={10}
          />
        </div>
        <div className="flex flex-wrap gap-6">
          <Checkbox label="Enable notifications" defaultChecked />
          <Switch label="Offline mode" hint="Sync when online" defaultChecked />
        </div>
        <RadioGroup
          name="gender"
          value={radio}
          onChange={setRadio}
          label="Gender"
          options={[
            { value: "female", label: "Female" },
            { value: "male", label: "Male" },
            { value: "other", label: "Other" },
          ]}
        />
      </section>

      {/* Chips & badges */}
      <section className="space-y-3">
        <h2 className="text-h2">Chips & Badges</h2>
        <div className="flex flex-wrap gap-2">
          <Chip tone="green">On-track</Chip>
          <Chip tone="amber">At-risk</Chip>
          <Chip tone="red">Off-track</Chip>
          <Chip tone="blue">Approved</Chip>
          <Chip tone="purple">Inception</Chip>
          <Chip tone="teal">L2</Chip>
          <Badge tone="spi">SPI</Badge>
          <Badge tone="rg">REGULATED</Badge>
          <Badge tone="pu">PUBLIC</Badge>
        </div>
      </section>

      {/* Feedback & overlays */}
      <section className="space-y-3">
        <h2 className="text-h2">Feedback & Overlays</h2>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() => push("success", "Record saved successfully.")}
          >
            Show toast
          </Button>
          <Button variant="secondary" onClick={() => setModal(true)}>
            Open modal
          </Button>
          <Button variant="secondary" onClick={() => setDrawer(true)}>
            Open drawer
          </Button>
          <Button variant="danger" onClick={() => setConfirm(true)}>
            Confirm delete
          </Button>
          <Tooltip content="Exported to CSV">
            <Button variant="ghost">Hover me</Button>
          </Tooltip>
          <Popover
            trigger={({ toggle, open, ...aria }) => (
              <Button variant="secondary" onClick={toggle} {...aria}>
                Popover
              </Button>
            )}
          >
            <div className="text-body-sm">Popover content</div>
          </Popover>
        </div>
        <div className="space-y-2">
          <Banner tone="info" title="Information">
            Quarterly reporting opens on 1 Nov.
          </Banner>
          <Banner tone="warning" title="Attention">
            3 projects have overdue inception reports.
          </Banner>
          <Banner tone="error" title="FMIS sync failed" onDismiss={() => {}}>
            Retry the last sync from Integrations.
          </Banner>
        </div>
      </section>

      {/* KPI & Cards */}
      <section className="space-y-3">
        <h2 className="text-h2">KPI Tiles & Cards</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPITile
            label="Active Projects"
            value="128"
            delta={{ value: "+6 this quarter", direction: "up" }}
          />
          <KPITile
            label="In Pipeline"
            value="23"
            tone="warning"
            delta={{ value: "3 overdue", direction: "down" }}
          />
          <KPITile label="Beneficiaries" value="45,678" tone="success" />
          <KPITile label="Execution Rate" value="30.4%" tone="accent" />
        </div>
        <Card>
          <CardHeader
            title="Recent activity"
            subtitle="Last 24 hours"
            action={
              <Button
                size="sm"
                variant="ghost"
                leftIcon={<Download className="h-4 w-4" />}
              >
                Export
              </Button>
            }
          />
          <p className="text-body-sm text-neutral-600">Card body content.</p>
        </Card>
      </section>

      {/* DataGrid & Pagination */}
      <section className="space-y-3">
        <h2 className="text-h2">DataGrid & Pagination</h2>
        <div className="flex items-center justify-between">
          <SyncBadge />
        </div>
        <DataGrid columns={cols} rows={rows} ariaLabel="Demo projects" />
        <Pagination
          page={page}
          pageSize={pageSize}
          total={248}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </section>

      {/* States */}
      <section className="space-y-3">
        <h2 className="text-h2">States</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <SkeletonTable rows={3} cols={3} />
          </Card>
          <Card>
            <LoadingState message="Loading projects…" />
          </Card>
          <Card>
            <EmptyState
              title="No projects yet"
              description="Register your first project to get started."
              action={<Button>Register project</Button>}
            />
          </Card>
          <Card>
            <ErrorState onRetry={() => push("info", "Retrying…")} />
          </Card>
        </div>
      </section>

      {/* Navigation */}
      <section className="space-y-3">
        <h2 className="text-h2">Navigation</h2>
        <Breadcrumb
          items={[
            { label: "Home", to: "/" },
            { label: "Projects", to: "/projects" },
            { label: "PIIMS-2026-0042" },
          ]}
        />
        <Stepper
          steps={[
            { id: "a", label: "Identification" },
            { id: "b", label: "Classification" },
            { id: "c", label: "Location" },
            { id: "d", label: "Budget" },
            { id: "e", label: "Review" },
          ]}
          current={2}
        />
        <Tabs
          tabs={[
            {
              id: "overview",
              label: "Overview",
              content: <p className="text-body-sm">Overview panel</p>,
            },
            {
              id: "components",
              label: "Components",
              content: <p className="text-body-sm">Components panel</p>,
            },
            {
              id: "financial",
              label: "Financial",
              content: <p className="text-body-sm">Financial panel</p>,
            },
          ]}
        />
        <Accordion
          items={[
            {
              id: "x",
              title: "What is PIIMS?",
              content: "Project Inception Information Management System.",
            },
            {
              id: "y",
              title: "How do I submit an inception report?",
              content: "Navigate to Projects → Inception → Submit.",
            },
          ]}
        />
        <Progress value={65} label="Wave W0 progress · 8,542 of 13,200" />
      </section>

      {/* Overlays */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Sample modal"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setModal(false);
                push("success", "Confirmed.");
              }}
            >
              Confirm
            </Button>
          </>
        }
      >
        <Input label="Example field" />
      </Modal>

      <Drawer
        open={drawer}
        onClose={() => setDrawer(false)}
        title="Detail panel"
      >
        <p className="text-body-sm text-neutral-600">Drawer content.</p>
      </Drawer>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        danger
        title="Delete project?"
        message="This action cannot be undone."
        onConfirm={() => {
          setConfirm(false);
          push("success", "Deleted.");
        }}
      />
    </div>
  );
}