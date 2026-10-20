import {
  PrismaClient,
  OrgType,
  OrgLevel,
  ProjectStatus,
  ProjectSector,
  IndicatorType,
  IndicatorFrequency,
  IndicatorDirection,
  TrafficLight,
  ImpactDomain as DomainEnum,
  ImpactDirection,
  ImpactStatus,
  Gender,
  RegistrationChannel,
  BeneficiaryStatus,
  DeliveryStatus,
} from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding PIIMS dev database…");

  // ── 1. Organizations ────────────────────────────────────────────────
  const mowe = await prisma.organization.upsert({
    where: { code: "MOWE" },
    update: {},
    create: {
      code: "MOWE",
      name: "Ministry of Water and Energy",
      nameAm: "የውሃና ኢነርጂ ሚኒስቴር",
      orgType: OrgType.GOV_MINISTRY,
      level: OrgLevel.FEDERAL,
    },
  });

  const mof = await prisma.organization.upsert({
    where: { code: "MOF" },
    update: {},
    create: {
      code: "MOF",
      name: "Ministry of Finance",
      nameAm: "የገንዘብ ሚኒስቴር",
      orgType: OrgType.GOV_MINISTRY,
      level: OrgLevel.FEDERAL,
    },
  });

  const dbe = await prisma.organization.upsert({
    where: { code: "DBE" },
    update: {},
    create: {
      code: "DBE",
      name: "Development Bank of Ethiopia",
      orgType: OrgType.FIN_INST,
      level: OrgLevel.FEDERAL,
    },
  });

  const wb = await prisma.organization.upsert({
    where: { code: "WB" },
    update: {},
    create: {
      code: "WB",
      name: "World Bank",
      orgType: OrgType.WB,
      level: OrgLevel.FEDERAL,
    },
  });

  console.log("  ✓ 4 organizations");

  // ── 2. Roles (43 roles from the Role Register) ──────────────────────
  const roleDefs: Array<{
    code: string;
    name: string;
    scope: string;
    permissions: string[];
  }> = [
    // World Bank
    {
      code: "WB-TTL",
      name: "World Bank Task Team Leader",
      scope: "GLOBAL",
      permissions: [
        "project:read",
        "inception:read",
        "inception:review",
        "inception:approve",
        "result:read",
        "budget:read",
        "disbursement:read",
        "procurement:read",
        "contract:read",
        "beneficiary:read",
        "service:read",
        "doc:read",
        "report:read",
        "report:wb-export",
        "dashboard:read",
        "grievance:read",
        "impact:indicator:read",
        "audit:read",
      ],
    },
    {
      code: "WB-IE",
      name: "World Bank Impact Evaluation Lead",
      scope: "GLOBAL",
      permissions: [
        "project:read",
        "result:read",
        "impact:indicator:read",
        "impact:indicator:write",
        "impact:design",
        "survey:read",
        "survey:write",
        "warehouse:read",
        "impact:analytics:read",
        "doc:read",
        "report:read",
        "dashboard:read",
      ],
    },
    {
      code: "WB-FM",
      name: "World Bank Financial Management Specialist",
      scope: "GLOBAL",
      permissions: [
        "project:read",
        "budget:read",
        "disbursement:read",
        "report:read",
        "dashboard:read",
      ],
    },
    {
      code: "WB-PROC",
      name: "World Bank Procurement Specialist",
      scope: "GLOBAL",
      permissions: [
        "project:read",
        "procurement:read",
        "contract:read",
        "report:read",
      ],
    },
    {
      code: "WB-ES",
      name: "World Bank Environmental & Social Specialist",
      scope: "GLOBAL",
      permissions: [
        "project:read",
        "grievance:read",
        "beneficiary:read",
        "report:read",
        "dashboard:read",
      ],
    },
    {
      code: "WB-M&E",
      name: "World Bank M&E Specialist",
      scope: "GLOBAL",
      permissions: [
        "project:read",
        "result:read",
        "report:read",
        "dashboard:read",
      ],
    },
    // MoWE
    {
      code: "MW-SA",
      name: "System Administrator",
      scope: "GLOBAL",
      permissions: ["*"],
    },
    {
      code: "MW-PIU",
      name: "PIU Officer",
      scope: "NATIONAL",
      permissions: [
        "project:read",
        "project:write",
        "project:approve",
        "inception:read",
        "inception:submit",
        "result:read",
        "result:write",
        "beneficiary:read",
        "beneficiary:write",
        "beneficiary:verify",
        "service:read",
        "service:write",
        "procurement:read",
        "procurement:write",
        "contract:read",
        "contract:write",
        "doc:read",
        "doc:write",
        "report:read",
        "report:generate",
        "dashboard:read",
        "grievance:read",
        "grievance:write",
        "notification:read",
      ],
    },
    {
      code: "MW-ME",
      name: "M&E Officer",
      scope: "NATIONAL",
      permissions: [
        "project:read",
        "result:read",
        "result:write",
        "result:aggregate",
        "report:read",
        "report:generate",
        "dashboard:read",
      ],
    },
    {
      code: "MW-TL",
      name: "Technical Lead",
      scope: "NATIONAL",
      permissions: [
        "project:read",
        "project:write",
        "result:read",
        "doc:read",
        "doc:write",
      ],
    },
    {
      code: "MW-PM",
      name: "Project Manager",
      scope: "NATIONAL",
      permissions: [
        "project:read",
        "project:approve",
        "inception:read",
        "inception:review",
        "result:read",
        "report:read",
        "dashboard:read",
      ],
    },
    {
      code: "MW-IE",
      name: "Impact Evaluation Specialist",
      scope: "NATIONAL",
      permissions: [
        "project:read",
        "result:read",
        "impact:indicator:read",
        "impact:indicator:write",
        "impact:design",
        "survey:read",
        "survey:write",
        "survey:publish",
        "survey:assign",
        "collect:assign",
        "collect:supervise",
        "qa:read",
        "qa:review",
        "warehouse:read",
        "research:request",
        "impact:analytics:read",
        "impact:analytics:run",
        "report:read",
        "report:generate",
        "doc:read",
        "dashboard:read",
      ],
    },
    {
      code: "MW-DM",
      name: "Data Manager",
      scope: "NATIONAL",
      permissions: [
        "impact:indicator:read",
        "survey:read",
        "qa:read",
        "warehouse:read",
        "warehouse:manage",
        "warehouse:anonymize",
        "warehouse:release",
        "impact:analytics:read",
        "report:read",
        "report:generate",
        "audit:read",
      ],
    },
    {
      code: "MW-QA",
      name: "Data Quality Officer",
      scope: "NATIONAL",
      permissions: [
        "impact:indicator:read",
        "survey:read",
        "collect:supervise",
        "qa:read",
        "qa:review",
        "qa:rules",
        "qa:backcheck",
        "warehouse:read",
        "report:read",
        "dashboard:read",
      ],
    },
    {
      code: "MW-FO",
      name: "Field Operations Coordinator",
      scope: "NATIONAL",
      permissions: [
        "collect:assign",
        "collect:supervise",
        "qa:read",
        "report:read",
        "dashboard:read",
      ],
    },
    // MoF
    {
      code: "MF-BO",
      name: "MoF Budget Officer",
      scope: "NATIONAL",
      permissions: [
        "project:read",
        "budget:read",
        "budget:write",
        "report:read",
        "report:generate",
        "dashboard:read",
      ],
    },
    {
      code: "MF-FM",
      name: "MoF Financial Management Officer",
      scope: "NATIONAL",
      permissions: [
        "project:read",
        "budget:read",
        "disbursement:read",
        "disbursement:write",
        "finance:reconcile",
        "report:read",
        "report:generate",
        "dashboard:read",
      ],
    },
    {
      code: "MF-AUD",
      name: "MoF Internal Auditor",
      scope: "NATIONAL",
      permissions: [
        "project:read",
        "budget:read",
        "disbursement:read",
        "audit:read",
        "report:read",
      ],
    },
    // DBE
    {
      code: "DB-LO",
      name: "DBE Loan Officer",
      scope: "NATIONAL",
      permissions: [
        "project:read",
        "disbursement:read",
        "disbursement:write",
        "contract:read",
        "report:read",
      ],
    },
    {
      code: "DB-DO",
      name: "DBE Disbursement Officer",
      scope: "NATIONAL",
      permissions: [
        "project:read",
        "disbursement:read",
        "disbursement:write",
        "report:read",
      ],
    },
    {
      code: "DB-PM",
      name: "DBE Portfolio Manager",
      scope: "NATIONAL",
      permissions: [
        "project:read",
        "disbursement:read",
        "contract:read",
        "report:read",
        "dashboard:read",
      ],
    },
    {
      code: "DB-AUD",
      name: "DBE Internal Auditor",
      scope: "NATIONAL",
      permissions: [
        "project:read",
        "disbursement:read",
        "audit:read",
        "report:read",
      ],
    },
    // Suppliers
    {
      code: "SP-AD",
      name: "Supplier Administrator",
      scope: "OWN",
      permissions: [
        "supplier:self:read",
        "supplier:self:write",
        "contract:read",
        "doc:read",
        "doc:write",
      ],
    },
    {
      code: "SP-OPS",
      name: "Supplier Operations Officer",
      scope: "OWN",
      permissions: [
        "supplier:self:read",
        "supplier:delivery",
        "service:write",
        "doc:read",
        "doc:write",
      ],
    },
    {
      code: "SP-SVC",
      name: "Supplier Service Officer",
      scope: "OWN",
      permissions: [
        "supplier:self:read",
        "service:read",
        "service:write",
        "doc:read",
      ],
    },
    // Beneficiaries
    {
      code: "BN-SR",
      name: "Self-Registered Beneficiary",
      scope: "OWN",
      permissions: [],
    },
    {
      code: "BN-REP",
      name: "Household Representative",
      scope: "OWN",
      permissions: [],
    },
    // Local government
    {
      code: "LG-RO",
      name: "Regional Officer",
      scope: "REGIONAL",
      permissions: [
        "project:read",
        "result:read",
        "beneficiary:read",
        "beneficiary:write",
        "beneficiary:verify",
        "service:read",
        "geo:read",
        "geo:write",
        "grievance:read",
        "grievance:write",
        "report:read",
        "report:generate",
        "dashboard:read",
      ],
    },
    {
      code: "LG-ZO",
      name: "Zonal Officer",
      scope: "ZONAL",
      permissions: [
        "project:read",
        "result:read",
        "beneficiary:read",
        "beneficiary:write",
        "beneficiary:verify",
        "geo:read",
        "grievance:read",
        "grievance:write",
        "report:read",
        "dashboard:read",
      ],
    },
    {
      code: "LG-WO",
      name: "Woreda Officer",
      scope: "WOREDA",
      permissions: [
        "project:read",
        "result:read",
        "result:write",
        "beneficiary:read",
        "beneficiary:write",
        "beneficiary:verify",
        "service:read",
        "service:write",
        "geo:read",
        "geo:write",
        "grievance:read",
        "grievance:write",
        "grievance:resolve",
        "doc:read",
        "doc:write",
        "report:read",
        "dashboard:read",
      ],
    },
    {
      code: "LG-KO",
      name: "Kebele Officer",
      scope: "KEBELE",
      permissions: [
        "beneficiary:read",
        "beneficiary:write",
        "beneficiary:verify",
        "service:read",
        "service:write",
        "geo:read",
        "grievance:read",
        "grievance:write",
        "field:capture",
      ],
    },
    // Data collection
    {
      code: "DC-EN",
      name: "Data Collector (Enumerator)",
      scope: "OWN",
      permissions: [
        "field:capture",
        "field:sync",
        "collect:execute",
        "beneficiary:read",
        "beneficiary:write",
        "survey:read",
      ],
    },
    {
      code: "DC-SV",
      name: "Field Supervisor",
      scope: "OWN",
      permissions: [
        "field:capture",
        "field:supervise",
        "collect:supervise",
        "qa:read",
        "qa:review",
        "qa:backcheck",
        "survey:read",
        "beneficiary:read",
      ],
    },
    // Researchers
    {
      code: "RS-EX",
      name: "External Researcher",
      scope: "OWN",
      permissions: [
        "warehouse:read",
        "research:request",
        "research:download",
        "impact:analytics:read",
      ],
    },
    // Steering Committee
    {
      code: "SC-MB",
      name: "Steering Committee Member",
      scope: "GLOBAL",
      permissions: [
        "dashboard:read",
        "report:read",
        "result:read",
        "budget:read",
        "impact:analytics:read",
      ],
    },
    // Auditors
    {
      code: "AU-EX",
      name: "External Auditor",
      scope: "GLOBAL",
      permissions: [
        "project:read",
        "budget:read",
        "disbursement:read",
        "procurement:read",
        "contract:read",
        "beneficiary:read",
        "service:read",
        "doc:read",
        "audit:read",
        "report:read",
      ],
    },
    {
      code: "AU-EV",
      name: "Independent Evaluator",
      scope: "GLOBAL",
      permissions: [
        "project:read",
        "result:read",
        "impact:indicator:read",
        "impact:analytics:read",
        "report:read",
        "dashboard:read",
      ],
    },
    // System
    {
      code: "SYS-DBA",
      name: "Database Administrator",
      scope: "GLOBAL",
      permissions: ["system:monitor", "audit:read"],
    },
    {
      code: "SYS-OPS",
      name: "DevOps Engineer",
      scope: "GLOBAL",
      permissions: ["system:monitor", "integration:read", "integration:manage"],
    },
    {
      code: "SYS-SEC",
      name: "Security Officer",
      scope: "GLOBAL",
      permissions: [
        "system:monitor",
        "audit:read",
        "admin:users",
        "admin:roles",
      ],
    },
    {
      code: "SYS-HELP",
      name: "Help Desk Officer",
      scope: "GLOBAL",
      permissions: ["admin:users", "system:monitor"],
    },
  ];

  const roles: Record<string, string> = {};
  for (const r of roleDefs) {
    const role = await prisma.role.upsert({
      where: { code: r.code },
      update: { name: r.name, scope: r.scope, permissions: r.permissions },
      create: {
        code: r.code,
        name: r.name,
        scope: r.scope,
        permissions: r.permissions,
        isSystem: true,
      },
    });
    roles[r.code] = role.roleId;
  }
  console.log(`  ✓ ${roleDefs.length} roles`);

  // ── 3. Users (one per critical role) ─────────────────────────────────
  const password = await argon2.hash("demo1234");
  const userDefs = [
    {
      username: "mowe.admin",
      email: "admin@mowe.gov.et",
      fullName: "Hiwot Tesfaye",
      orgId: mowe.orgId,
      roleCode: "MW-SA",
    },
    {
      username: "mowe.piu01",
      email: "piu01@mowe.gov.et",
      fullName: "Abebe Kebede",
      orgId: mowe.orgId,
      roleCode: "MW-PIU",
    },
    {
      username: "mowe.me01",
      email: "me01@mowe.gov.et",
      fullName: "Meron Haile",
      orgId: mowe.orgId,
      roleCode: "MW-ME",
    },
    {
      username: "mowe.ie01",
      email: "ie01@mowe.gov.et",
      fullName: "Dr. Tigist Alemu",
      orgId: mowe.orgId,
      roleCode: "MW-IE",
    },
    {
      username: "mowe.dm01",
      email: "dm01@mowe.gov.et",
      fullName: "Daniel Girma",
      orgId: mowe.orgId,
      roleCode: "MW-DM",
    },
    {
      username: "mowe.qa01",
      email: "qa01@mowe.gov.et",
      fullName: "Selam Bekele",
      orgId: mowe.orgId,
      roleCode: "MW-QA",
    },
    {
      username: "mof.bo01",
      email: "bo01@mof.gov.et",
      fullName: "Yohannes Tadesse",
      orgId: mof.orgId,
      roleCode: "MF-BO",
    },
    {
      username: "dbe.lo01",
      email: "lo01@dbe.com.et",
      fullName: "Hanna Girma",
      orgId: dbe.orgId,
      roleCode: "DB-LO",
    },
    {
      username: "wb.ttl01",
      email: "ttl01@worldbank.org",
      fullName: "Sarah Mitchell",
      orgId: wb.orgId,
      roleCode: "WB-TTL",
    },
    {
      username: "dc.en01",
      email: "dc01@mowe.gov.et",
      fullName: "Yohannes Tadesse",
      orgId: mowe.orgId,
      roleCode: "DC-EN",
    },
    {
      username: "dc.sv01",
      email: "sv01@mowe.gov.et",
      fullName: "Meron Supervisor",
      orgId: mowe.orgId,
      roleCode: "DC-SV",
    },
  ];

  const users: Record<string, string> = {};
  for (const u of userDefs) {
    const user = await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: {
        username: u.username,
        email: u.email,
        fullName: u.fullName,
        orgId: u.orgId,
        roleId: roles[u.roleCode]!,
        passwordHash: password,
        mfaEnabled: false,
      },
    });
    users[u.username] = user.userId;
  }
  console.log(`  ✓ ${userDefs.length} users (password: demo1234)`);

  // ── 4. Locations ────────────────────────────────────────────────────
  const locOromia = await prisma.location.upsert({
    where: { locationId: "11111111-1111-4111-8111-111111111111" },
    update: {},
    create: {
      locationId: "11111111-1111-4111-8111-111111111111",
      region: "Oromia",
      regionCode: "OR",
      zone: "East Shewa",
      woreda: "Bora",
      latitude: 8.541,
      longitude: 39.269,
    },
  });

  const locAmhara = await prisma.location.upsert({
    where: { locationId: "22222222-2222-4222-8222-222222222222" },
    update: {},
    create: {
      locationId: "22222222-2222-4222-8222-222222222222",
      region: "Amhara",
      zone: "North Shewa",
      woreda: "Kewet",
      latitude: 9.61,
      longitude: 39.84,
    },
  });
  console.log("  ✓ 2 locations");

  // ── 5. Sample project ───────────────────────────────────────────────
  const project = await prisma.project.upsert({
    where: { projectCode: "PIIMS-2026-0042" },
    update: {},
    create: {
      projectCode: "PIIMS-2026-0042",
      name: "Solar Mini-Grid Deployment – Oromia Phase 1",
      description:
        "Deployment of solar mini-grids across 25 rural woredas in Oromia region.",
      sector: ProjectSector.ENERGY,
      subsector: "Solar Mini-Grid",
      status: ProjectStatus.ACTIVE,
      ownerOrgId: mowe.orgId,
      locationId: locOromia.locationId,
      totalBudget: 15000000,
      currency: "ETB",
      wbCreditNo: "IDA-XXXX",
      startDate: new Date("2026-10-01"),
      endDate: new Date("2029-09-30"),
      implementationArrangement: "PIU",
      financingSource: [
        { source: "WORLD_BANK", amount: "12000000.00", currency: "ETB" },
        { source: "GOVERNMENT", amount: "3000000.00", currency: "ETB" },
      ],
    },
  });

  await prisma.project.upsert({
    where: { projectCode: "PIIMS-2026-0038" },
    update: {},
    create: {
      projectCode: "PIIMS-2026-0038",
      name: "Solar Home Systems – Amhara Rural",
      sector: ProjectSector.ENERGY,
      status: ProjectStatus.ACTIVE,
      ownerOrgId: mowe.orgId,
      locationId: locAmhara.locationId,
      totalBudget: 8450000,
      currency: "ETB",
      startDate: new Date("2026-08-01"),
      endDate: new Date("2028-07-31"),
      implementationArrangement: "PIU",
    },
  });

  await prisma.project.upsert({
    where: { projectCode: "PIIMS-2026-0035" },
    update: {},
    create: {
      projectCode: "PIIMS-2026-0035",
      name: "Water Supply – SNNP Rural Woredas",
      sector: ProjectSector.WATER,
      status: ProjectStatus.ACTIVE,
      ownerOrgId: mowe.orgId,
      totalBudget: 22100000,
      currency: "ETB",
      startDate: new Date("2026-05-01"),
      endDate: new Date("2029-04-30"),
      implementationArrangement: "PIU",
    },
  });
  console.log("  ✓ 3 sample projects");

  // ── 6. Components + Subcomponent + Indicator for project 42 ─────────
  const component = await prisma.component.upsert({
    where: { projectId_code: { projectId: project.projectId, code: "C1" } },
    update: {},
    create: {
      projectId: project.projectId,
      code: "C1",
      name: "Solar Mini-Grid Deployment",
      description: "Deploy solar mini-grids in target woredas",
      budget: 12000000,
      orderNo: 0,
    },
  });

  const subcomponent = await prisma.subcomponent.upsert({
    where: {
      componentId_code: { componentId: component.componentId, code: "C1.1" },
    },
    update: {},
    create: {
      subcomponentId: "33333333-3333-4333-8333-333333333333",
      componentId: component.componentId,
      projectId: project.projectId,
      code: "C1.1",
      name: "Household Solar Systems",
      budget: 12000000,
      orderNo: 0,
    },
  });

  await prisma.indicator.upsert({
    where: {
      subcomponentId_code: {
        subcomponentId: subcomponent.subcomponentId,
        code: "IND-001",
      },
    },
    update: {},
    create: {
      subcomponentId: subcomponent.subcomponentId,
      projectId: project.projectId,
      code: "IND-001",
      name: "Households with solar systems installed",
      indicatorType: IndicatorType.OUTPUT,
      unit: "households",
      baseline: 0,
      target: 5000,
      actual: 4250,
      frequency: IndicatorFrequency.QUARTERLY,
      direction: IndicatorDirection.INCREASE,
      method: "Field verification + supplier records",
      status: TrafficLight.ON_TRACK,
    },
  });

  await prisma.indicator.upsert({
    where: {
      subcomponentId_code: {
        subcomponentId: subcomponent.subcomponentId,
        code: "IND-002",
      },
    },
    update: {},
    create: {
      subcomponentId: subcomponent.subcomponentId,
      projectId: project.projectId,
      code: "IND-002",
      name: "Rural health centers electrified",
      indicatorType: IndicatorType.OUTPUT,
      unit: "facilities",
      baseline: 0,
      target: 120,
      actual: 98,
      frequency: IndicatorFrequency.QUARTERLY,
      direction: IndicatorDirection.INCREASE,
      status: TrafficLight.AT_RISK,
    },
  });
  console.log("  ✓ Component, subcomponent, 2 indicators");

  // ── 7. Impact domains ───────────────────────────────────────────────
  const domains: Array<{ code: string; name: string }> = [
    { code: "INCOME", name: "Income & Employment" },
    { code: "ENERGY", name: "Energy Access" },
    { code: "WATER", name: "Water Access" },
    { code: "HEALTH", name: "Health" },
    { code: "EDUCATION", name: "Education" },
    { code: "GENDER", name: "Gender" },
    { code: "ENVIRONMENT", name: "Environment" },
    { code: "RESILIENCE", name: "Resilience" },
    { code: "SATISFACTION", name: "Satisfaction" },
  ];

  const domainMap: Record<string, string> = {};
  for (const d of domains) {
    const domain = await prisma.impactDomain.upsert({
      where: { code: d.code },
      update: {},
      create: { code: d.code, name: d.name },
    });
    domainMap[d.code] = domain.domainId;
  }
  console.log(`  ✓ ${domains.length} impact domains`);

  // ── 8. Sample impact indicators ─────────────────────────────────────
  await prisma.impactIndicator.upsert({
    where: { code: "IMP-INC-001" },
    update: {},
    create: {
      domainId: domainMap["INCOME"]!,
      code: "IMP-INC-001",
      name: "Average monthly household income",
      unit: "ETB",
      direction: ImpactDirection.INCREASE,
      method: "Household survey",
      disaggregation: ["gender", "region", "wealth_quintile"],
      effectiveFrom: new Date("2026-01-01"),
      status: ImpactStatus.ACTIVE,
      createdById: users["mowe.ie01"]!,
    },
  });

  await prisma.impactIndicator.upsert({
    where: { code: "IMP-ENE-001" },
    update: {},
    create: {
      domainId: domainMap["ENERGY"]!,
      code: "IMP-ENE-001",
      name: "Hours of electricity available per day",
      unit: "hours",
      direction: ImpactDirection.INCREASE,
      effectiveFrom: new Date("2026-01-01"),
      status: ImpactStatus.ACTIVE,
      createdById: users["mowe.ie01"]!,
    },
  });
  console.log("  ✓ 2 impact indicators");

  // ── 9. Sample wave ──────────────────────────────────────────────────
  await prisma.wave.upsert({
    where: { projectId_code: { projectId: project.projectId, code: "W0" } },
    update: {},
    create: {
      projectId: project.projectId,
      code: "W0",
      name: "Baseline",
      waveType: "BASELINE",
      plannedStart: new Date("2026-11-01"),
      plannedEnd: new Date("2026-12-31"),
      status: "PLANNED",
    },
  });
  console.log("  ✓ 1 wave");

  // ── 10. Sample supplier + product + contract ────────────────────────
  const supplier = await prisma.supplier.upsert({
    where: { tin: "TIN-0000001" },
    update: {},
    create: {
      name: "SolarTech Ethiopia PLC",
      tin: "TIN-0000001",
      licenseNo: "LIC-2026-0001",
      category: "MANUFACTURER",
      contactPerson: "Sales Manager",
      contactEmail: "sales@solartech.et",
      contactPhone: "+251911000001",
      address: "Addis Ababa, Ethiopia",
      status: "ACTIVE",
    },
  });

  const product = await prisma.product.upsert({
    where: { productId: "44444444-4444-4444-8444-444444444444" },
    update: {},
    create: {
      productId: "44444444-4444-4444-8444-444444444444",
      supplierId: supplier.supplierId,
      name: "Solar Home System 100W",
      productType: "SHS",
      capacity: "100W",
      unitPrice: 35000,
      currency: "ETB",
      standardId: "ES-2024-001",
      warrantyMonths: 24,
      status: "ACTIVE",
    },
  });

  await prisma.contract.upsert({
    where: { contractNo: "CTR-2026-001" },
    update: {},
    create: {
      projectId: project.projectId,
      supplierId: supplier.supplierId,
      contractNo: "CTR-2026-001",
      title: "Supply and installation of solar home systems – Lot 1",
      amount: 1950000,
      currency: "ETB",
      signedDate: new Date("2026-10-10"),
      startDate: new Date("2026-11-01"),
      endDate: new Date("2027-10-31"),
      status: "ACTIVE",
    },
  });
  console.log("  ✓ 1 supplier, 1 product, 1 contract");

  // ── 11. Sample beneficiary + service delivery ───────────────────────
  const beneficiary = await prisma.beneficiary.upsert({
    where: { uniqueId: "BEN-2026-00012345" },
    update: {},
    create: {
      uniqueId: "BEN-2026-00012345",
      fullName: "Aster Bekele",
      gender: "FEMALE",
      dateOfBirth: new Date("1984-05-15"),
      ageYears: 42,
      householdSize: 5,
      phone: "+251911234567",
      locationId: locOromia.locationId,
      region: "Oromia",
      woreda: "Bora",
      registrationChannel: "CAPI",
      registrationDate: new Date("2026-09-20"),
      status: "VERIFIED",
    },
  });

  await prisma.serviceDelivery.upsert({
    where: { deliveryId: "55555555-5555-4555-8555-555555555555" },
    update: {},
    create: {
      deliveryId: "55555555-5555-4555-8555-555555555555",
      beneficiaryId: beneficiary.beneficiaryId,
      projectId: project.projectId,
      supplierId: supplier.supplierId,
      productId: product.productId,
      serialNo: "SN-2026-000123",
      quantity: 1,
      installDate: new Date("2026-10-15"),
      installLat: 8.541,
      installLon: 39.269,
      warrantyStart: new Date("2026-10-15"),
      warrantyEnd: new Date("2028-10-15"),
      status: "VERIFIED",
    },
  });
  console.log("  ✓ 1 beneficiary, 1 service delivery");

  // ── 12. Sample QA rules ─────────────────────────────────────────────
  const qaRules = [
    {
      code: "DURATION_SHORT",
      name: "Interview too short",
      type: "DURATION_SHORT",
      threshold: { multiplier: 0.5 },
      severity: "HIGH",
    },
    {
      code: "DURATION_LONG",
      name: "Interview too long",
      type: "DURATION_LONG",
      threshold: { multiplier: 3 },
      severity: "MEDIUM",
    },
    {
      code: "STRAIGHT_LINE",
      name: "Straight-lining detected",
      type: "STRAIGHT_LINE",
      threshold: { minConsecutive: 15 },
      severity: "HIGH",
    },
    {
      code: "GPS_OUTSIDE",
      name: "GPS outside target area",
      type: "GPS_OUTSIDE",
      threshold: { toleranceKm: 5 },
      severity: "HIGH",
    },
    {
      code: "DUPLICATE",
      name: "Duplicate submission",
      type: "DUPLICATE",
      threshold: { windowDays: 1 },
      severity: "CRITICAL",
    },
    {
      code: "OUTLIER",
      name: "Outlier value detected",
      type: "OUTLIER",
      threshold: { zScore: 3 },
      severity: "MEDIUM",
    },
  ];
  for (const r of qaRules) {
    await prisma.qaRule.upsert({
      where: { code: r.code },
      update: {},
      create: {
        code: r.code,
        name: r.name,
        type: r.type as QaRuleType,
        threshold: r.threshold,
        severity: r.severity as Severity,
        active: true,
      },
    });
  }
  console.log(`  ✓ ${qaRules.length} QA rules`);

  // ── 13. Sample master data ──────────────────────────────────────────
  const regions = [
    "Oromia",
    "Amhara",
    "Tigray",
    "SNNP",
    "Somali",
    "Afar",
    "Benishangul-Gumuz",
    "Gambella",
    "Harari",
    "Addis Ababa",
    "Dire Dawa",
    "Sidama",
    "South West Ethiopia",
  ];
  for (const region of regions) {
    await prisma.masterData.upsert({
      where: {
        category_code: {
          category: "REGION",
          code: region.toUpperCase().replace(/\s+/g, "_"),
        },
      },
      update: {},
      create: {
        category: "REGION",
        code: region.toUpperCase().replace(/\s+/g, "_"),
        name: region,
      },
    });
  }
  console.log(`  ✓ ${regions.length} regions`);

  // ── 14. System settings ─────────────────────────────────────────────
  const settings = [
    { key: "system.version", value: "2.0.0" },
    { key: "system.locale.default", value: "en" },
    { key: "system.fiscal_year.current", value: new Date().getFullYear() },
    { key: "consent.current_version", value: "v1.2" },
  ];
  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: { key: s.key, value: s.value },
    });
  }
  console.log(`  ✓ ${settings.length} system settings`);

  console.log("");
  console.log("✅ Seed complete!");
  console.log("");
  console.log("Test accounts (password: demo1234):");
  console.log("  mowe.admin   — MW-SA (System Administrator)");
  console.log("  mowe.piu01   — MW-PIU (PIU Officer)");
  console.log("  mowe.ie01    — MW-IE  (Impact Evaluation Specialist)");
  console.log("  mof.bo01     — MF-BO  (MoF Budget Officer)");
  console.log("  wb.ttl01     — WB-TTL (World Bank Task Team Leader)");
  console.log("  dc.en01      — DC-EN  (Data Collector)");
  console.log("");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
