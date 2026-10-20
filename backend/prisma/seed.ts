import {
  PrismaClient,
  OrgType, OrgLevel, ProjectStatus, ProjectSector, ImplArrangement,
  IndicatorType, IndicatorFrequency, IndicatorDirection, TrafficLight,
  DisbursementStatus, FinancingCategory, ProcurementMethod, ProcurementStatus,
  ContractStatus, SupplierCategory, SupplierStatus, ProductType, ProductStatus,
  Gender, RegistrationChannel, BeneficiaryStatus, DeliveryStatus,
  GrievanceCategory, GrievanceChannel, GrievanceStatus, Severity, GrievanceActionType,
  DocType, AccessLevel, ReportType, ReportFormat, InceptionStatus,
  ImpactDirection, ImpactStatus, SurveyStatus, WaveType, WaveStatus,
  QuestionType, SkipLogicAction, CollectorStatus, AssignmentStatus,
  SubmissionStatus, QaStatus, AnswerType, MediaType, ConsentType,
  QaRuleType, QaFlagStatus, BackCheckResult, PanelStatus, TreatmentGroupType,
  WaveDatasetStatus, AnonLevel, ResearchDatasetStatus, DataRequestStatus,
  ResearchProjectStatus, NotificationChannel, NotificationStatus,
  SyncJobDirection, SyncJobStatus, AuditAction, UserStatus
} from '@prisma/client';
import { Prisma } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

/* ── deterministic id + rng helpers ─────────────────────────────────────── */
const uid = (series: string, n: number): string =>
  `${series.padEnd(8, '0')}-${String(n).padStart(4, '0')}-4000-8000-${String(n).padStart(12, '0')}`;

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20261019);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)]!;
const int = (min: number, max: number): number => min + Math.floor(rnd() * (max - min + 1));
const money = (min: number, max: number): string => (int(min, max) * 100).toFixed(2);
const day = (iso: string): Date => new Date(`${iso}T00:00:00.000Z`);
const hex = (len: number): string =>
  Array.from({ length: len }, () => '0123456789abcdef'[int(0, 15)]).join('');

const FIRST = ['Abebe', 'Almaz', 'Besrat', 'Chaltu', 'Dawit', 'Eleni', 'Fikadu', 'Girma', 'Hanna', 'Kebede', 'Luam', 'Marta', 'Negash', 'Olga', 'Paulos', 'Roman', 'Samuel', 'Tsion', 'Worku', 'Zewditu'];
const LAST = ['Alemu', 'Bekele', 'Chane', 'Demeke', 'Esayas', 'Feleke', 'Gebre', 'Haile', 'Imru', 'Jember', 'Kassa', 'Lemma', 'Mengistu', 'Negga', 'Oba', 'Petros', 'Qefo', 'Reta', 'Sefu', 'Tadesse'];
const fullName = (i: number): string => `${FIRST[i % FIRST.length]!} ${LAST[(i * 7 + 3) % LAST.length]!}`;

async function main() {
  console.log('🌱 Seeding PIIMS dev database (full demo dataset)…');

  /* ── 0. Clean wipe (idempotent re-seed) ─────────────────────────────── */
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0');
  const models = [
    'refreshToken', 'auditLog', 'submissionAnswer', 'paradata', 'mediaAttachment', 'consent',
    'qaRule', 'qaFlag', 'backCheck', 'collectorScorecard', 'submission', 'assignment', 'skipLogic',
    'questionOption', 'question', 'section', 'surveyVersion', 'survey', 'indicatorWave',
    'theoryOfChange', 'impactIndicator', 'impactDomain', 'panelMember', 'treatmentGroup',
    'waveDataset', 'anonymizationMap', 'dataUseAgreement', 'dataRequest', 'researchDataset',
    'publication', 'researchProject', 'notification', 'notificationTemplate', 'syncJob',
    'reviewComment', 'inceptionReport', 'documentVersion', 'document', 'report', 'reportSchedule',
    'grievanceAction', 'grievance', 'serviceDelivery', 'beneficiary', 'contract', 'procurement',
    'product', 'supplier', 'disbursement', 'budget', 'costPerOutputRow', 'indicatorValue',
    'indicator', 'milestone', 'subcomponent', 'component', 'project', 'collector', 'supervisor',
    'wave', 'user', 'role', 'organization', 'location', 'masterData', 'systemSetting',
    'job', 'idempotencyKey'
  ] as const;
  for (const m of models) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any)[m].deleteMany({});
  }
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');
  console.log('  ✓ wiped existing data');

  /* ── 1. Organizations ───────────────────────────────────────────────── */
  const orgDefs: Array<{ code: string; name: string; nameAm?: string; orgType: OrgType; level: OrgLevel }> = [
    { code: 'MOWE', name: 'Ministry of Water and Energy', nameAm: 'የውሃና ኢነርጂ ኒስቴር', orgType: OrgType.GOV_MINISTRY, level: OrgLevel.FEDERAL },
    { code: 'MOF', name: 'Ministry of Finance', nameAm: 'የገንዘብ ኒስቴር', orgType: OrgType.GOV_MINISTRY, level: OrgLevel.FEDERAL },
    { code: 'DBE', name: 'Development Bank of Ethiopia', orgType: OrgType.FIN_INST, level: OrgLevel.FEDERAL },
    { code: 'WB', name: 'World Bank', orgType: OrgType.WB, level: OrgLevel.FEDERAL },
    { code: 'OR-RO', name: 'Oromia Water & Energy Bureau', orgType: OrgType.LOCAL_GOV, level: OrgLevel.REGIONAL },
    { code: 'OR-ZO', name: 'East Shewa Zone Administration', orgType: OrgType.LOCAL_GOV, level: OrgLevel.ZONAL },
    { code: 'OR-WO', name: 'Bora Woreda Administration', orgType: OrgType.LOCAL_GOV, level: OrgLevel.WOREDA },
    { code: 'OR-KO', name: 'Bora Kebele 03 Administration', orgType: OrgType.LOCAL_GOV, level: OrgLevel.KEBELE },
    { code: 'AM-RO', name: 'Amhara Water & Energy Bureau', orgType: OrgType.LOCAL_GOV, level: OrgLevel.REGIONAL },
    { code: 'AM-WO', name: 'Kewet Woreda Administration', orgType: OrgType.LOCAL_GOV, level: OrgLevel.WOREDA },
    { code: 'SUP-HEL', name: 'Helios Solar Systems PLC', orgType: OrgType.SUPPLIER, level: OrgLevel.FEDERAL },
    { code: 'SUP-AQU', name: 'AquaPump Technologies PLC', orgType: OrgType.SUPPLIER, level: OrgLevel.FEDERAL },
    { code: 'SUP-ETH', name: 'Ethio Electro Works PLC', orgType: OrgType.SUPPLIER, level: OrgLevel.FEDERAL },
    { code: 'AAU', name: 'Addis Ababa University', orgType: OrgType.OTHER, level: OrgLevel.FEDERAL },
    { code: 'AUD-FRM', name: 'Mesfin & Associates Auditors', orgType: OrgType.OTHER, level: OrgLevel.FEDERAL }
  ];
  await prisma.organization.createMany({
    data: orgDefs.map((o, i) => ({
      orgId: uid('org', i + 1), code: o.code, name: o.name, nameAm: o.nameAm ?? null,
      orgType: o.orgType, level: o.level, status: 'ACTIVE',
      contactEmail: `info@${o.code.toLowerCase().replace(/[^a-z0-9]/g, '')}.gov.et`
    }))
  });
  const org: Record<string, string> = {};
  for (const [i, o] of orgDefs.entries()) org[o.code] = uid('org', i + 1);
  console.log(`  ✓ ${orgDefs.length} organizations`);

  /* ── 2. Roles (43) ──────────────────────────────────────────────────── */
  const roleDefs: Array<{ code: string; name: string; scope: string; permissions: string[] }> = [
    { code: 'WB-TTL', name: 'World Bank Task Team Leader', scope: 'GLOBAL', permissions: ['project:read', 'inception:read', 'inception:review', 'inception:approve', 'result:read', 'budget:read', 'disbursement:read', 'procurement:read', 'contract:read', 'beneficiary:read', 'service:read', 'doc:read', 'report:read', 'report:wb-export', 'dashboard:read', 'grievance:read', 'impact:indicator:read', 'audit:read'] },
    { code: 'WB-IE', name: 'World Bank Impact Evaluation Lead', scope: 'GLOBAL', permissions: ['project:read', 'result:read', 'impact:indicator:read', 'impact:indicator:write', 'impact:design', 'survey:read', 'survey:write', 'warehouse:read', 'impact:analytics:read', 'doc:read', 'report:read', 'dashboard:read'] },
    { code: 'WB-FM', name: 'World Bank Financial Management Specialist', scope: 'GLOBAL', permissions: ['project:read', 'budget:read', 'disbursement:read', 'report:read', 'dashboard:read'] },
    { code: 'WB-PROC', name: 'World Bank Procurement Specialist', scope: 'GLOBAL', permissions: ['project:read', 'procurement:read', 'contract:read', 'report:read'] },
    { code: 'WB-ES', name: 'World Bank Environmental & Social Specialist', scope: 'GLOBAL', permissions: ['project:read', 'grievance:read', 'beneficiary:read', 'report:read', 'dashboard:read'] },
    { code: 'WB-M&E', name: 'World Bank M&E Specialist', scope: 'GLOBAL', permissions: ['project:read', 'result:read', 'report:read', 'dashboard:read'] },
    { code: 'MW-SA', name: 'System Administrator', scope: 'GLOBAL', permissions: ['*'] },
    { code: 'MW-PIU', name: 'PIU Officer', scope: 'NATIONAL', permissions: ['project:read', 'project:write', 'project:approve', 'inception:read', 'inception:submit', 'result:read', 'result:write', 'beneficiary:read', 'beneficiary:write', 'beneficiary:verify', 'service:read', 'service:write', 'procurement:read', 'procurement:write', 'contract:read', 'contract:write', 'doc:read', 'doc:write', 'report:read', 'report:generate', 'dashboard:read', 'grievance:read', 'grievance:write', 'notification:read'] },
    { code: 'MW-ME', name: 'M&E Officer', scope: 'NATIONAL', permissions: ['project:read', 'result:read', 'result:write', 'result:aggregate', 'report:read', 'report:generate', 'dashboard:read'] },
    { code: 'MW-TL', name: 'Technical Lead', scope: 'NATIONAL', permissions: ['project:read', 'project:write', 'result:read', 'doc:read', 'doc:write'] },
    { code: 'MW-PM', name: 'Project Manager', scope: 'NATIONAL', permissions: ['project:read', 'project:approve', 'inception:read', 'inception:review', 'result:read', 'report:read', 'dashboard:read'] },
    { code: 'MW-IE', name: 'Impact Evaluation Specialist', scope: 'NATIONAL', permissions: ['project:read', 'result:read', 'impact:indicator:read', 'impact:indicator:write', 'impact:design', 'survey:read', 'survey:write', 'survey:publish', 'survey:assign', 'collect:assign', 'collect:supervise', 'qa:read', 'qa:review', 'warehouse:read', 'research:request', 'impact:analytics:read', 'impact:analytics:run', 'report:read', 'report:generate', 'doc:read', 'dashboard:read'] },
    { code: 'MW-DM', name: 'Data Manager', scope: 'NATIONAL', permissions: ['impact:indicator:read', 'survey:read', 'qa:read', 'warehouse:read', 'warehouse:manage', 'warehouse:anonymize', 'warehouse:release', 'impact:analytics:read', 'report:read', 'report:generate', 'audit:read'] },
    { code: 'MW-QA', name: 'Data Quality Officer', scope: 'NATIONAL', permissions: ['impact:indicator:read', 'survey:read', 'collect:supervise', 'qa:read', 'qa:review', 'qa:rules', 'qa:backcheck', 'warehouse:read', 'report:read', 'dashboard:read'] },
    { code: 'MW-FO', name: 'Field Operations Coordinator', scope: 'NATIONAL', permissions: ['collect:assign', 'collect:supervise', 'qa:read', 'report:read', 'dashboard:read'] },
    { code: 'MF-BO', name: 'MoF Budget Officer', scope: 'NATIONAL', permissions: ['project:read', 'budget:read', 'budget:write', 'report:read', 'report:generate', 'dashboard:read'] },
    { code: 'MF-FM', name: 'MoF Financial Management Officer', scope: 'NATIONAL', permissions: ['project:read', 'budget:read', 'disbursement:read', 'disbursement:write', 'finance:reconcile', 'report:read', 'report:generate', 'dashboard:read'] },
    { code: 'MF-AUD', name: 'MoF Internal Auditor', scope: 'NATIONAL', permissions: ['project:read', 'budget:read', 'disbursement:read', 'audit:read', 'report:read'] },
    { code: 'DB-LO', name: 'DBE Loan Officer', scope: 'NATIONAL', permissions: ['project:read', 'disbursement:read', 'disbursement:write', 'contract:read', 'report:read'] },
    { code: 'DB-DO', name: 'DBE Disbursement Officer', scope: 'NATIONAL', permissions: ['project:read', 'disbursement:read', 'disbursement:write', 'report:read'] },
    { code: 'DB-PM', name: 'DBE Portfolio Manager', scope: 'NATIONAL', permissions: ['project:read', 'disbursement:read', 'contract:read', 'report:read', 'dashboard:read'] },
    { code: 'DB-AUD', name: 'DBE Internal Auditor', scope: 'NATIONAL', permissions: ['project:read', 'disbursement:read', 'audit:read', 'report:read'] },
    { code: 'SP-AD', name: 'Supplier Administrator', scope: 'OWN', permissions: ['supplier:self:read', 'supplier:self:write', 'contract:read', 'doc:read', 'doc:write'] },
    { code: 'SP-OPS', name: 'Supplier Operations Officer', scope: 'OWN', permissions: ['supplier:self:read', 'supplier:delivery', 'service:write', 'doc:read', 'doc:write'] },
    { code: 'SP-SVC', name: 'Supplier Service Officer', scope: 'OWN', permissions: ['supplier:self:read', 'service:read', 'service:write', 'doc:read'] },
    { code: 'BN-SR', name: 'Self-Registered Beneficiary', scope: 'OWN', permissions: [] },
    { code: 'BN-REP', name: 'Household Representative', scope: 'OWN', permissions: [] },
    { code: 'LG-RO', name: 'Regional Officer', scope: 'REGIONAL', permissions: ['project:read', 'result:read', 'beneficiary:read', 'beneficiary:write', 'beneficiary:verify', 'service:read', 'geo:read', 'geo:write', 'grievance:read', 'grievance:write', 'report:read', 'report:generate', 'dashboard:read'] },
    { code: 'LG-ZO', name: 'Zonal Officer', scope: 'ZONAL', permissions: ['project:read', 'result:read', 'beneficiary:read', 'beneficiary:write', 'beneficiary:verify', 'geo:read', 'grievance:read', 'grievance:write', 'report:read', 'dashboard:read'] },
    { code: 'LG-WO', name: 'Woreda Officer', scope: 'WOREDA', permissions: ['project:read', 'result:read', 'result:write', 'beneficiary:read', 'beneficiary:write', 'beneficiary:verify', 'service:read', 'service:write', 'geo:read', 'geo:write', 'grievance:read', 'grievance:write', 'grievance:resolve', 'doc:read', 'doc:write', 'report:read', 'dashboard:read'] },
    { code: 'LG-KO', name: 'Kebele Officer', scope: 'KEBELE', permissions: ['beneficiary:read', 'beneficiary:write', 'beneficiary:verify', 'service:read', 'service:write', 'geo:read', 'grievance:read', 'grievance:write', 'field:capture'] },
    { code: 'DC-EN', name: 'Data Collector (Enumerator)', scope: 'OWN', permissions: ['field:capture', 'field:sync', 'collect:execute', 'beneficiary:read', 'beneficiary:write', 'survey:read'] },
    { code: 'DC-SV', name: 'Field Supervisor', scope: 'OWN', permissions: ['field:capture', 'field:supervise', 'collect:supervise', 'qa:read', 'qa:review', 'qa:backcheck', 'survey:read', 'beneficiary:read'] },
    { code: 'RS-EX', name: 'External Researcher', scope: 'OWN', permissions: ['warehouse:read', 'research:request', 'research:download', 'impact:analytics:read'] },
    { code: 'SC-MB', name: 'Steering Committee Member', scope: 'GLOBAL', permissions: ['dashboard:read', 'report:read', 'result:read', 'budget:read', 'impact:analytics:read'] },
    { code: 'AU-EX', name: 'External Auditor', scope: 'GLOBAL', permissions: ['project:read', 'budget:read', 'disbursement:read', 'procurement:read', 'contract:read', 'beneficiary:read', 'service:read', 'doc:read', 'audit:read', 'report:read'] },
    { code: 'AU-EV', name: 'Independent Evaluator', scope: 'GLOBAL', permissions: ['project:read', 'result:read', 'impact:indicator:read', 'impact:analytics:read', 'report:read', 'dashboard:read'] },
    { code: 'SYS-DBA', name: 'Database Administrator', scope: 'GLOBAL', permissions: ['system:monitor', 'audit:read'] },
    { code: 'SYS-OPS', name: 'DevOps Engineer', scope: 'GLOBAL', permissions: ['system:monitor', 'integration:read', 'integration:manage'] },
    { code: 'SYS-SEC', name: 'Security Officer', scope: 'GLOBAL', permissions: ['system:monitor', 'audit:read', 'admin:users', 'admin:roles'] },
    { code: 'SYS-HELP', name: 'Help Desk Officer', scope: 'GLOBAL', permissions: ['admin:users', 'system:monitor'] }
  ];
  await prisma.role.createMany({
    data: roleDefs.map((r, i) => ({
      roleId: uid('role', i + 1), code: r.code, name: r.name, scope: r.scope,
      permissions: r.permissions, isSystem: true
    }))
  });
  const role: Record<string, string> = {};
  for (const [i, r] of roleDefs.entries()) role[r.code] = uid('role', i + 1);
  console.log(`  ✓ ${roleDefs.length} roles`);

  /* ── 3. Users — one per role (+ extra collectors/supervisors) ────────── */
  const roleOrg: Record<string, string> = {
    'WB-TTL': 'WB', 'WB-IE': 'WB', 'WB-FM': 'WB', 'WB-PROC': 'WB', 'WB-ES': 'WB', 'WB-M&E': 'WB',
    'MW-SA': 'MOWE', 'MW-PIU': 'MOWE', 'MW-ME': 'MOWE', 'MW-TL': 'MOWE', 'MW-PM': 'MOWE',
    'MW-IE': 'MOWE', 'MW-DM': 'MOWE', 'MW-QA': 'MOWE', 'MW-FO': 'MOWE',
    'MF-BO': 'MOF', 'MF-FM': 'MOF', 'MF-AUD': 'MOF',
    'DB-LO': 'DBE', 'DB-DO': 'DBE', 'DB-PM': 'DBE', 'DB-AUD': 'DBE',
    'SP-AD': 'SUP-HEL', 'SP-OPS': 'SUP-AQU', 'SP-SVC': 'SUP-ETH',
    'BN-SR': 'MOWE', 'BN-REP': 'MOWE',
    'LG-RO': 'OR-RO', 'LG-ZO': 'OR-ZO', 'LG-WO': 'OR-WO', 'LG-KO': 'OR-KO',
    'DC-EN': 'MOWE', 'DC-SV': 'MOWE', 'RS-EX': 'AAU', 'SC-MB': 'MOF',
    'AU-EX': 'AUD-FRM', 'AU-EV': 'AAU',
    'SYS-DBA': 'MOWE', 'SYS-OPS': 'MOWE', 'SYS-SEC': 'MOWE', 'SYS-HELP': 'MOWE'
  };
  const password = await argon2.hash('demo1234');
  const userDefs: Array<{ username: string; roleCode: string; fullName: string }> = roleDefs.map((r, i) => ({
    username: `demo.${r.code.toLowerCase().replace(/[^a-z0-9]+/g, '.')}`,
    roleCode: r.code,
    fullName: fullName(i + 40)
  }));
  // friendly aliases used in docs/tests
  const aliases = [
    { username: 'mowe.admin', roleCode: 'MW-SA', fullName: 'Hiwot Tesfaye' },
    { username: 'mowe.piu01', roleCode: 'MW-PIU', fullName: 'Abebe Kebede' },
    { username: 'mowe.me01', roleCode: 'MW-ME', fullName: 'Meron Haile' },
    { username: 'mowe.ie01', roleCode: 'MW-IE', fullName: 'Dr. Tigist Alemu' },
    { username: 'mowe.dm01', roleCode: 'MW-DM', fullName: 'Daniel Girma' },
    { username: 'mowe.qa01', roleCode: 'MW-QA', fullName: 'Selam Bekele' },
    { username: 'mof.bo01', roleCode: 'MF-BO', fullName: 'Yohannes Tadesse' },
    { username: 'dbe.lo01', roleCode: 'DB-LO', fullName: 'Hanna Girma' },
    { username: 'wb.ttl01', roleCode: 'WB-TTL', fullName: 'Sarah Mitchell' },
    { username: 'dc.en01', roleCode: 'DC-EN', fullName: 'Kalid Yusuf' },
    { username: 'dc.en02', roleCode: 'DC-EN', fullName: 'Sara Lemma' },
    { username: 'dc.sv01', roleCode: 'DC-SV', fullName: 'Meron Supervisor' }
  ];
  const allUsers = [...userDefs, ...aliases];
  await prisma.user.createMany({
    data: allUsers.map((u, i) => ({
      userId: uid('user', i + 1),
      username: u.username,
      email: `${u.username}@piims-demo.et`,
      fullName: u.fullName,
      orgId: org[roleOrg[u.roleCode] ?? 'MOWE']!,
      roleId: role[u.roleCode]!,
      passwordHash: password,
      mfaEnabled: false,
      status: UserStatus.ACTIVE,
      locale: 'en'
    }))
  });
  const user: Record<string, string> = {};
  for (const [i, u] of allUsers.entries()) user[u.username] = uid('user', i + 1);
  console.log(`  ✓ ${allUsers.length} users (password: demo1234)`);

  /* ── 4. Locations ───────────────────────────────────────────────────── */
  const locDefs = [
    { region: 'Oromia', regionCode: 'OR', zone: 'East Shewa', woreda: 'Bora', kebele: 'K03', latitude: 8.541, longitude: 39.269 },
    { region: 'Oromia', regionCode: 'OR', zone: 'East Shewa', woreda: 'Bora', kebele: 'K05', latitude: 8.61, longitude: 39.35 },
    { region: 'Oromia', regionCode: 'OR', zone: 'Adama', woreda: 'Adama Zuria', kebele: 'K01', latitude: 8.54, longitude: 39.27 },
    { region: 'Amhara', regionCode: 'AM', zone: 'North Shewa', woreda: 'Kewet', kebele: 'K02', latitude: 9.61, longitude: 39.84 },
    { region: 'Amhara', regionCode: 'AM', zone: 'North Shewa', woreda: 'Gera', kebele: 'K04', latitude: 9.72, longitude: 39.91 },
    { region: 'SNNP', regionCode: 'SN', zone: 'Wolaita', woreda: 'Sodo Zuria', kebele: 'K01', latitude: 6.86, longitude: 37.76 }
  ];
  await prisma.location.createMany({ data: locDefs.map((l, i) => ({ locationId: uid('loc', i + 1), ...l })) });
  const loc = (i: number): string => uid('loc', i + 1);
  console.log(`  ✓ ${locDefs.length} locations`);

  /* ── 5. Projects (all statuses) ───────────────────────────────────────── */
  const projDefs = [
    { name: 'Solar Mini-Grid Deployment – Oromia Phase 1', sector: ProjectSector.ENERGY, sub: 'Solar Mini-Grid', status: ProjectStatus.ACTIVE, budget: 48_000_000, loc: 0 },
    { name: 'Rural Water Supply Rehabilitation – Amhara', sector: ProjectSector.WATER, sub: 'Water Points', status: ProjectStatus.ACTIVE, budget: 32_500_000, loc: 3 },
    { name: 'Integrated WASH & Energy – SNNP Corridor', sector: ProjectSector.BOTH, sub: 'WASH+Energy', status: ProjectStatus.ACTIVE, budget: 61_200_000, loc: 5 },
    { name: 'Last-Mile Electrification – Oromia Phase 2', sector: ProjectSector.ENERGY, sub: 'Grid Extension', status: ProjectStatus.APPROVED, budget: 27_400_000, loc: 1 },
    { name: 'Irrigation & Solar Pumping Pilot – Amhara', sector: ProjectSector.BOTH, sub: 'Irrigation', status: ProjectStatus.APPRAISAL, budget: 18_900_000, loc: 4 },
    { name: 'Urban Water Loss Reduction – Addis Belt', sector: ProjectSector.WATER, sub: 'NRW Reduction', status: ProjectStatus.FEASIBILITY, budget: 22_000_000, loc: 2 },
    { name: 'Mini-Grid Tariff Support Study', sector: ProjectSector.OTHER, sub: 'Advisory', status: ProjectStatus.PRE_FEASIBILITY, budget: 4_500_000, loc: 0 },
    { name: 'Community Handpump Framework – Phase 0', sector: ProjectSector.WATER, sub: 'Handpumps', status: ProjectStatus.PROFILE, budget: 9_800_000, loc: 3 },
    { name: 'Off-Grid Lighting Voucher Scheme (Concept)', sector: ProjectSector.ENERGY, sub: 'Vouchers', status: ProjectStatus.IDEA, budget: 6_200_000, loc: 5 },
    { name: 'Solar Home Systems Rollout – Completed 2025', sector: ProjectSector.ENERGY, sub: 'SHS', status: ProjectStatus.CLOSED, budget: 41_000_000, loc: 1 },
    { name: 'Dam Safety Component (Cancelled)', sector: ProjectSector.WATER, sub: 'Dam Safety', status: ProjectStatus.CANCELLED, budget: 15_000_000, loc: 4 },
    { name: 'Woreda Capacity Building & Systems', sector: ProjectSector.OTHER, sub: 'Institutional', status: ProjectStatus.ACTIVE, budget: 8_700_000, loc: 2 }
  ];
  await prisma.project.createMany({
    data: projDefs.map((p, i) => ({
      projectId: uid('proj', i + 1),
      projectCode: `PIIMS-2026-${String(i + 1).padStart(4, '0')}`,
      name: p.name,
      description: `${p.name} — demonstration record seeded for end-to-end testing.`,
      sector: p.sector,
      subsector: p.sub,
      status: p.status,
      ownerOrgId: org.MOWE!,
      locationId: loc(p.loc),
      totalBudget: p.budget.toFixed(2),
      currency: 'ETB',
      wbCreditNo: i % 3 === 0 ? `IDA-70${i}0-ET` : null,
      approvalDate: p.status === ProjectStatus.IDEA || p.status === ProjectStatus.PROFILE ? null : day('2025-07-01'),
      startDate: p.status === ProjectStatus.ACTIVE || p.status === ProjectStatus.CLOSED ? day('2025-09-15') : null,
      endDate: p.status === ProjectStatus.ACTIVE || p.status === ProjectStatus.CLOSED ? day('2029-06-30') : null,
      implementationArrangement: pick([ImplArrangement.PIU, ImplArrangement.LINE_MINISTRY, ImplArrangement.REGIONAL]),
      financingSource: [
        { source: 'WORLD_BANK', amount: (p.budget * 0.7).toFixed(2), currency: 'ETB', referenceNo: `IDA-${7000 + i}` },
        { source: 'GOVERNMENT', amount: (p.budget * 0.3).toFixed(2), currency: 'ETB', referenceNo: `GOV-2026-${i}` }
      ],
      createdById: user['mowe.piu01']!,
      updatedById: user['mowe.piu01']!,
      version: 1
    }))
  });
  const proj = (i: number): string => uid('proj', i + 1);
  console.log(`  ✓ ${projDefs.length} projects (all ${Object.keys(ProjectStatus).length} statuses)`);

  /* ── 6. Components / subcomponents / milestones ──────────────────────── */
  const compRows: Array<{ componentId: string; projectId: string; code: string; name: string; budget: string; orderNo: number }> = [];
  const subRows: Array<{ subcomponentId: string; componentId: string; projectId: string; code: string; name: string }> = [];
  let cn = 0, sn = 0;
  for (const pi of [0, 1, 2, 3, 9, 11]) {
    for (const ci of [1, 2, 3]) {
      cn += 1;
      const compId = uid('comp', cn);
      compRows.push({
        componentId: compId, projectId: proj(pi + 1), code: `C${ci}`,
        name: `Component ${ci} — ${['Works & Infrastructure', 'Goods & Equipment', 'Systems & Capacity'][ci - 1]}`,
        budget: (projDefs[pi]!.budget * (0.5 - ci * 0.1)).toFixed(2), orderNo: ci
      });
      for (const si of [1, 2]) {
        sn += 1;
        subRows.push({
          subcomponentId: uid('subc', sn), componentId: compId, projectId: proj(pi + 1),
          code: `C${ci}.S${si}`, name: `Subcomponent ${ci}.${si}`
        });
      }
    }
  }
  await prisma.component.createMany({ data: compRows.map(c => ({ ...c, responsibleOrgId: org.MOWE! })) });
  await prisma.subcomponent.createMany({ data: subRows });
  const mileRows = [0, 1, 2].flatMap((pi, k) => [
    { milestoneId: uid('mile', k * 2 + 1), projectId: proj(pi + 1), componentId: compRows[k * 3]?.componentId ?? null, name: 'Works completion', plannedDate: day('2026-12-20'), actualDate: pi === 0 ? day('2026-09-30') : null, status: pi === 0 ? 'COMPLETED' : 'PENDING', ownerOrgId: org.MOWE! },
    { milestoneId: uid('mile', k * 2 + 2), projectId: proj(pi + 1), componentId: compRows[k * 3 + 1]?.componentId ?? null, name: 'Equipment delivery', plannedDate: day('2027-03-15'), actualDate: null, status: 'IN_PROGRESS', ownerOrgId: org.MOWE! }
  ]);
  await prisma.milestone.createMany({ data: mileRows });
  console.log(`  ✓ ${compRows.length} components, ${subRows.length} subcomponents, ${mileRows.length} milestones`);

  /* ── 7. Indicators + values + cost-per-output ─────────────────────────── */
  const indRows: Array<{ indicatorId: string; subcomponentId: string; projectId: string; code: string; name: string; indicatorType: IndicatorType; unit: string; baseline: string; target: string; actual: string | null; frequency: IndicatorFrequency; direction: IndicatorDirection; status: TrafficLight }> = [];
  let inx = 0;
  for (const s of subRows.slice(0, 12)) {
    for (const t of [0, 1]) {
      inx += 1;
      const target = int(200, 5000);
      const actual = t === 0 ? Math.round(target * (0.3 + rnd() * 0.9)) : null;
      const ratio = actual == null ? 0 : actual / target;
      indRows.push({
        indicatorId: uid('ind', inx), subcomponentId: s.subcomponentId, projectId: s.projectId,
        code: `IND-${String(inx).padStart(3, '0')}`,
        name: t === 0 ? `Households with improved service (${s.code})` : `Persons trained (${s.code})`,
        indicatorType: t === 0 ? IndicatorType.OUTPUT : IndicatorType.OUTCOME,
        unit: t === 0 ? 'households' : 'persons',
        baseline: '0.0000', target: String(target), actual: actual == null ? null : String(actual),
        frequency: IndicatorFrequency.QUARTERLY,
        direction: IndicatorDirection.INCREASE,
        status: actual == null ? TrafficLight.NOT_STARTED : ratio > 0.8 ? TrafficLight.ON_TRACK : ratio > 0.5 ? TrafficLight.AT_RISK : TrafficLight.OFF_TRACK
      });
    }
  }
  await prisma.indicator.createMany({ data: indRows });
  const ivRows: Array<{ valueId: string; indicatorId: string; period: string; fiscalYear: number; value: string; target: string; achievementPct: string; verifiedById: string | null; verifiedAt: Date | null }> = [];
  let vn = 0;
  for (const ind of indRows.filter(i => i.actual != null).slice(0, 12)) {
    for (const [qi, period] of ['2026-Q1', '2026-Q2', '2026-Q3', '2026-Q4'].entries()) {
      vn += 1;
      const v = Math.round(Number(ind.target) * (0.15 + qi * 0.18 + rnd() * 0.08));
      ivRows.push({
        valueId: uid('indv', vn), indicatorId: ind.indicatorId, period, fiscalYear: 2026,
        value: String(v), target: String(Math.round(Number(ind.target) * (0.25 + qi * 0.25))),
        achievementPct: (v / (Number(ind.target) * (0.25 + qi * 0.25)) * 100).toFixed(2),
        verifiedById: qi < 2 ? user['mowe.me01']! : null,
        verifiedAt: qi < 2 ? day('2026-08-01') : null
      });
    }
  }
  await prisma.indicatorValue.createMany({ data: ivRows });
  await prisma.costPerOutputRow.createMany({
    data: indRows.slice(0, 6).map((ind, i) => ({
      rowId: uid('cpo', i + 1), indicatorId: ind.indicatorId,
      expendedEtb: money(2_000_000, 9_000_000), costPerUnit: money(800, 4200), computedAt: new Date()
    }))
  });
  console.log(`  ✓ ${indRows.length} indicators, ${ivRows.length} indicator values`);

  /* ── 8. Budgets & disbursements ───────────────────────────────────────── */
  const budRows: Array<{ budgetId: string; projectId: string; componentId: string | null; fiscalYear: number; currency: string; appropriation: string; released: string; expended: string; committed: string; balance: string; fmisReference: string | null }> = [];
  let bn = 0;
  for (const pi of [0, 1, 2, 11]) {
    for (const fy of [2025, 2026]) {
      bn += 1;
      const appr = Math.round(projDefs[pi]!.budget / 2);
      const rel = Math.round(appr * (fy === 2025 ? 0.95 : 0.6));
      const exp = Math.round(rel * (fy === 2025 ? 0.82 : 0.35));
      budRows.push({
        budgetId: uid('bud', bn), projectId: proj(pi + 1), componentId: null, fiscalYear: fy,
        currency: 'ETB', appropriation: appr.toFixed(2), released: rel.toFixed(2),
        expended: exp.toFixed(2), committed: Math.round(rel * 0.1).toFixed(2),
        balance: (rel - exp).toFixed(2), fmisReference: fy === 2025 ? `FMIS-${fy}-${pi + 1}` : null
      });
    }
    for (const c of compRows.filter(c => c.projectId === proj(pi + 1)).slice(0, 2)) {
      bn += 1;
      budRows.push({
        budgetId: uid('bud', bn), projectId: proj(pi + 1), componentId: c.componentId,
        fiscalYear: 2026, currency: 'ETB', appropriation: c.budget, released: (Number(c.budget) * 0.5).toFixed(2),
        expended: (Number(c.budget) * 0.3).toFixed(2), committed: '0.00',
        balance: (Number(c.budget) * 0.5).toFixed(2), fmisReference: null
      });
    }
  }
  await prisma.budget.createMany({ data: budRows });
  const disbRows = Array.from({ length: 26 }, (_, i) => {
    const pi = pick([0, 1, 2, 3, 9, 11]);
    const amount = int(400, 9000) * 1000;
    return {
      disbursementId: uid('disb', i + 1), projectId: proj(pi + 1),
      sourceOrgId: pick([org.WB!, org.DBE!, org.MOF!]),
      category: pick([FinancingCategory.CATEGORY_1, FinancingCategory.CATEGORY_2, FinancingCategory.CATEGORY_3]),
      amount: amount.toFixed(2), currency: 'USD', amountEtb: (amount * 56.4).toFixed(2),
      valueDate: day(`2026-${String(int(1, 10)).padStart(2, '0')}-${String(int(1, 28)).padStart(2, '0')}`),
      referenceNo: `DIS-2026-${String(i + 1).padStart(4, '0')}`,
      status: pick([DisbursementStatus.PLANNED, DisbursementStatus.REQUESTED, DisbursementStatus.APPROVED, DisbursementStatus.DISBURSED, DisbursementStatus.RECONCILED, DisbursementStatus.REJECTED]),
      fmisReference: i % 2 === 0 ? `FMIS-D-${1000 + i}` : null
    };
  });
  await prisma.disbursement.createMany({ data: disbRows });
  console.log(`  ✓ ${budRows.length} budgets, ${disbRows.length} disbursements`);

  /* ── 9. Suppliers, products, procurement, contracts ───────────────────── */
  const supDefs = [
    { name: 'Helios Solar Systems PLC', org: 'SUP-HEL', category: SupplierCategory.MANUFACTURER },
    { name: 'AquaPump Technologies PLC', org: 'SUP-AQU', category: SupplierCategory.INSTALLER },
    { name: 'Ethio Electro Works PLC', org: 'SUP-ETH', category: SupplierCategory.DISTRIBUTOR },
    { name: 'GreenVolt Mini-Grids PLC', org: null, category: SupplierCategory.INSTALLER },
    { name: 'SafeWater Drilling PLC', org: null, category: SupplierCategory.OTHER },
    { name: 'Solarify Imports PLC', org: null, category: SupplierCategory.IMPORTER }
  ];
  await prisma.supplier.createMany({
    data: supDefs.map((s, i) => ({
      supplierId: uid('sup', i + 1), name: s.name,
      tin: `00${int(100000, 999999)}${i}`, licenseNo: `LIC-${2000 + i}`,
      category: s.category, contactPerson: fullName(i + 5), contactEmail: `sales@sup${i + 1}.et`,
      contactPhone: `+25191100000${i}`, status: i === 5 ? SupplierStatus.INACTIVE : SupplierStatus.ACTIVE,
      performanceScore: (60 + rnd() * 39).toFixed(2), orgId: s.org ? org[s.org] ?? null : null
    }))
  });
  const sup = (i: number): string => uid('sup', i + 1);
  const prodDefs = [
    { name: 'SHS-200W Home System', type: ProductType.SHS, price: 18500 },
    { name: 'SHS-100W Home System', type: ProductType.SHS, price: 11200 },
    { name: 'Mini-Grid Kit 15kWp', type: ProductType.MINI_GRID, price: 1450000 },
    { name: 'Submersible Solar Pump 2HP', type: ProductType.PUMP, price: 96000 },
    { name: 'Handpump WS-40', type: ProductType.PUMP, price: 42000 },
    { name: 'Solar Lantern SL-10', type: ProductType.LANTERN, price: 950 },
    { name: 'Battery Bank 5kWh', type: ProductType.OTHER, price: 38500 },
    { name: 'Distribution Board DB-6', type: ProductType.OTHER, price: 7800 }
  ];
  await prisma.product.createMany({
    data: prodDefs.map((p, i) => ({
      productId: uid('prod', i + 1), supplierId: sup(i % 6 + 1), name: p.name, productType: p.type,
      capacity: i < 3 ? '200-400 Wp' : null, unitPrice: p.price.toFixed(2), currency: 'ETB',
      standardId: `ISO-${9001 + i}`, warrantyMonths: i < 5 ? 24 : 12, status: ProductStatus.ACTIVE
    }))
  });
  const procRows = Array.from({ length: 18 }, (_, i) => {
    const pi = pick([0, 1, 2, 3, 9, 11]);
    return {
      procurementId: uid('proc', i + 1), projectId: proj(pi + 1),
      componentId: compRows.find(c => c.projectId === proj(pi + 1))?.componentId ?? null,
      planRef: `PIIMS-2026-${String(pi + 1).padStart(4, '0')}-PP-${String(i + 1).padStart(2, '0')}`,
      description: pick(['Supply of solar home systems', 'Borehole drilling & equipping', 'Mini-grid construction lot', 'Technical assistance & training', 'Supply of water point fittings']),
      method: pick([ProcurementMethod.ICB, ProcurementMethod.NCB, ProcurementMethod.SHOPPING, ProcurementMethod.DIRECT]),
      estimatedAmount: money(500_000, 25_000_000), currency: 'ETB',
      planDate: day('2026-01-15'), advertisementDate: i > 3 ? day('2026-02-10') : null,
      bidOpeningDate: i > 5 ? day('2026-03-05') : null, evaluationDate: i > 8 ? day('2026-03-25') : null,
      awardDate: i > 11 ? day('2026-04-12') : null,
      status: ([ProcurementStatus.PLANNED, ProcurementStatus.ADVERTISED, ProcurementStatus.BID_OPEN, ProcurementStatus.EVALUATED, ProcurementStatus.AWARDED, ProcurementStatus.CANCELLED] as ProcurementStatus[])[i % 6]!
    };
  });
  await prisma.procurement.createMany({ data: procRows });
  const contRows = Array.from({ length: 14 }, (_, i) => ({
    contractId: uid('cont', i + 1), projectId: procRows[i % 18]!.projectId,
    procurementId: i < 10 ? procRows[i]!.procurementId : null,
    supplierId: sup(i % 6 + 1),
    contractNo: `CTR-2026-${String(i + 1).padStart(4, '0')}`,
    title: pick(['Supply & installation of SHS', 'Borehole drilling contract', 'Mini-grid EPC contract', 'Warranty & maintenance agreement', 'Training services contract']),
    amount: money(800_000, 18_000_000), currency: 'ETB',
    signedDate: day('2026-04-20'), startDate: day('2026-05-01'), endDate: day('2027-04-30'),
    status: ([ContractStatus.DRAFT, ContractStatus.SIGNED, ContractStatus.ACTIVE, ContractStatus.COMPLETED, ContractStatus.TERMINATED] as ContractStatus[])[i % 5]!,
    amendmentNo: i % 4 === 0 ? 1 : 0
  }));
  await prisma.contract.createMany({ data: contRows });
  console.log(`  ✓ 6 suppliers, 8 products, 18 procurements, 14 contracts`);

  /* ── 10. Beneficiaries & service deliveries ───────────────────────────── */
  const benRows = Array.from({ length: 90 }, (_, i) => ({
    beneficiaryId: uid('ben', i + 1),
    uniqueId: `BEN-${String(i + 1).padStart(6, '0')}`,
    nationalId: i % 5 === 0 ? null : `ET${int(10000000, 99999999)}`,
    fullName: fullName(i),
    gender: ([Gender.MALE, Gender.FEMALE, Gender.FEMALE] as Gender[])[i % 3]!,
    dateOfBirth: day(`19${int(60, 99)}-${String(int(1, 12)).padStart(2, '0')}-${String(int(1, 28)).padStart(2, '0')}`),
    ageYears: int(19, 78),
    householdSize: int(1, 9),
    phone: i % 4 === 0 ? null : `+2519${int(10000000, 99999999)}`,
    locationId: loc(i % 6),
    region: locDefs[i % 6]!.region, woreda: locDefs[i % 6]!.woreda, kebele: locDefs[i % 6]!.kebele,
    householdHead: i % 3 === 0,
    vulnerability: i % 7 === 0 ? { femaleHeaded: true, displaced: false } : Prisma.DbNull,
    registrationChannel: ([RegistrationChannel.CAPI, RegistrationChannel.WEB, RegistrationChannel.SMS, RegistrationChannel.USSD, RegistrationChannel.IMPORT, RegistrationChannel.SUPPLIER] as RegistrationChannel[])[i % 6]!,
    registrationDate: day(`2026-${String((i % 9) + 1).padStart(2, '0')}-${String((i % 27) + 1).padStart(2, '0')}`),
    verifiedById: i % 3 === 0 ? user['mowe.piu01']! : null,
    verifiedAt: i % 3 === 0 ? day('2026-06-01') : null,
    status: ([BeneficiaryStatus.REGISTERED, BeneficiaryStatus.VERIFIED, BeneficiaryStatus.ACTIVE, BeneficiaryStatus.ACTIVE, BeneficiaryStatus.INACTIVE, BeneficiaryStatus.DUPLICATE] as BeneficiaryStatus[])[i % 6]!,
    dedupScore: i % 11 === 0 ? (0.82 + rnd() * 0.15).toFixed(2) : null
  }));
  await prisma.beneficiary.createMany({ data: benRows });
  const ben = (i: number): string => uid('ben', i + 1);
  const srvRows = Array.from({ length: 60 }, (_, i) => ({
    deliveryId: uid('srv', i + 1), beneficiaryId: ben(i % 90 + 1), projectId: proj(i % 4 + 1),
    supplierId: sup(i % 6 + 1), productId: uid('prod', i % 8 + 1),
    serialNo: `SRV-${String(i + 1).padStart(5, '0')}`,
    quantity: int(1, 3), unit: 'unit',
    installDate: i % 6 === 0 ? null : day(`2026-${String((i % 8) + 2).padStart(2, '0')}-1${i % 9}`),
    installLat: 8.4 + rnd(), installLon: 39.1 + rnd(),
    warrantyStart: day('2026-05-01'), warrantyEnd: day('2028-05-01'),
    status: ([DeliveryStatus.PLANNED, DeliveryStatus.DELIVERED, DeliveryStatus.INSTALLED, DeliveryStatus.VERIFIED, DeliveryStatus.FAILED] as DeliveryStatus[])[i % 5]!,
    verifiedById: i % 5 === 3 ? user['dc.sv01']! : null,
    verifiedAt: i % 5 === 3 ? day('2026-08-15') : null
  }));
  await prisma.serviceDelivery.createMany({ data: srvRows });
  console.log(`  ✓ 90 beneficiaries, 60 service deliveries`);

  /* ── 11. Waves, treatment groups, panel ───────────────────────────────── */
  const waveDefs = [
    { projectId: proj(1), code: 'W1-BL', name: 'Baseline', type: WaveType.BASELINE, status: WaveStatus.COMPLETED, start: '2026-02-01', end: '2026-04-30' },
    { projectId: proj(1), code: 'W2-ML', name: 'Midline', type: WaveType.MIDLINE, status: WaveStatus.ACTIVE, start: '2026-09-01', end: '2026-11-30' },
    { projectId: proj(2), code: 'W1-BL', name: 'Baseline', type: WaveType.BASELINE, status: WaveStatus.COMPLETED, start: '2026-03-01', end: '2026-05-31' },
    { projectId: proj(3), code: 'W1-BL', name: 'Baseline', type: WaveType.BASELINE, status: WaveStatus.PLANNED, start: '2027-01-10', end: '2027-03-20' }
  ];
  await prisma.wave.createMany({
    data: waveDefs.map((w, i) => ({
      waveId: uid('wave', i + 1), projectId: w.projectId, code: w.code, name: w.name,
      waveType: w.type, plannedStart: day(w.start), plannedEnd: day(w.end),
      actualStart: w.status === WaveStatus.PLANNED ? null : day(w.start),
      actualEnd: w.status === WaveStatus.COMPLETED ? day(w.end) : null,
      status: w.status
    }))
  });
  const wave = (i: number): string => uid('wave', i + 1);
  const tgRows = [
    { groupId: uid('tgrp', 1), projectId: proj(1), code: 'T1', name: 'Treatment arm', groupType: TreatmentGroupType.TREATMENT, waveId: wave(1) },
    { groupId: uid('tgrp', 2), projectId: proj(1), code: 'C1', name: 'Control arm', groupType: TreatmentGroupType.CONTROL, waveId: wave(1) },
    { groupId: uid('tgrp', 3), projectId: proj(2), code: 'P1', name: 'Phase 1', groupType: TreatmentGroupType.PHASE_1, waveId: wave(3) },
    { groupId: uid('tgrp', 4), projectId: proj(2), code: 'P2', name: 'Phase 2', groupType: TreatmentGroupType.PHASE_2, waveId: wave(3) }
  ];
  await prisma.treatmentGroup.createMany({
    data: tgRows.map(t => ({ ...t, assignedAt: day('2026-01-20'), immutable: true, description: 'Seeded arm' }))
  });
  await prisma.panelMember.createMany({
    data: Array.from({ length: 36 }, (_, i) => ({
      panelId: uid('panel', i + 1), beneficiaryId: ben(i + 1),
      householdId: i % 2 === 0 ? `HH-${String(Math.floor(i / 2) + 1).padStart(4, '0')}` : null,
      treatmentGroupId: tgRows[i % 4]!.groupId, projectId: i % 2 === 0 ? proj(1) : proj(2),
      enrolledAt: day('2026-02-05'), enrolledWaveId: i % 2 === 0 ? wave(1) : wave(3),
      region: locDefs[i % 6]!.region, woreda: locDefs[i % 6]!.woreda,
      status: i % 9 === 8 ? PanelStatus.ATTRITED : PanelStatus.ACTIVE,
      attritionReason: i % 9 === 8 ? 'Migrated out of woreda' : null
    }))
  });
  console.log(`  ✓ 4 waves, 4 treatment groups, 36 panel members`);

  /* ── 12. Impact domains / indicators / ToC ────────────────────────────── */
  const domDefs = [
    { code: 'ENERGY', name: 'Energy Access' }, { code: 'WATER', name: 'Water & Sanitation' },
    { code: 'INCOME', name: 'Income & Livelihoods' }, { code: 'HEALTH', name: 'Health' },
    { code: 'EDU', name: 'Education' }
  ];
  await prisma.impactDomain.createMany({ data: domDefs.map((d, i) => ({ domainId: uid('dom', i + 1), code: d.code, name: d.name, orderNo: i, active: true })) });
  const iindDefs: Array<{ code: string; dom: number; name: string; unit: string; composite?: boolean }> = [
    { code: 'II-EN-01', dom: 1, name: 'Households with reliable electricity', unit: 'households' },
    { code: 'II-EN-02', dom: 1, name: 'Average daily supply hours', unit: 'hours' },
    { code: 'II-WA-01', dom: 2, name: 'People with improved water access', unit: 'persons' },
    { code: 'II-WA-02', dom: 2, name: 'Water points functional (%)', unit: 'percent' },
    { code: 'II-IN-01', dom: 3, name: 'Monthly household income', unit: 'ETB' },
    { code: 'II-IN-02', dom: 3, name: 'Enterprises reporting higher sales', unit: 'enterprises' },
    { code: 'II-HE-01', dom: 4, name: 'Clinic visits after hours', unit: 'visits' },
    { code: 'II-ED-01', dom: 5, name: 'Study hours per child per day', unit: 'hours' },
    { code: 'II-ED-02', dom: 5, name: 'School attendance rate', unit: 'percent' },
    { code: 'II-CMP-01', dom: 1, name: 'Composite energy access index', unit: 'index', composite: true }
  ];
  await prisma.impactIndicator.createMany({
    data: iindDefs.map((d, i) => ({
      indicatorId: uid('iind', i + 1), domainId: uid('dom', d.dom), code: d.code, name: d.name,
      unit: d.unit, direction: ImpactDirection.INCREASE, method: 'Survey + administrative data',
      disaggregation: ['gender', 'region'], isComposite: Boolean(d.composite),
      compositeFormula: d.composite ? { weights: { 'II-EN-01': 0.6, 'II-EN-02': 0.4 } } : Prisma.DbNull,
      standardRef: i % 2 === 0 ? 'WB-GPG-2024' : null, version: 1,
      effectiveFrom: day('2026-01-01'), effectiveTo: null, status: i === 9 ? ImpactStatus.DEPRECATED : ImpactStatus.ACTIVE,
      createdById: user['mowe.ie01']!
    }))
  });
  await prisma.indicatorWave.createMany({
    data: [0, 1, 2, 3, 4, 5].flatMap((ii, k) => [
      { indicatorWaveId: uid('iwav', k * 2 + 1), indicatorId: uid('iind', ii + 1), waveId: wave(1), targetValue: String(int(500, 4000)), collectionWindowStart: day('2026-02-01'), collectionWindowEnd: day('2026-04-30'), required: true },
      { indicatorWaveId: uid('iwav', k * 2 + 2), indicatorId: uid('iind', ii + 1), waveId: wave(2), targetValue: String(int(500, 4000)), collectionWindowStart: day('2026-09-01'), collectionWindowEnd: day('2026-11-30'), required: k % 2 === 0 }
    ])
  });
  await prisma.theoryOfChange.createMany({
    data: [1, 2].map((pi, i) => ({
      tocId: uid('toc', i + 1), projectId: proj(pi), name: `ToC — ${projDefs[pi - 1]!.name}`,
      description: 'Inputs → outputs → outcomes → impact narrative.',
      links: { outcomes: ['II-EN-01', 'II-IN-01'] }, authorId: user['mowe.ie01']!
    }))
  });
  console.log(`  ✓ 5 domains, ${iindDefs.length} impact indicators, 12 wave assignments, 2 ToCs`);

  /* ── 13. Surveys, sections, questions, skip logic ─────────────────────── */
  await prisma.survey.createMany({
    data: [
      { surveyId: uid('svy', 1), code: 'SVY-HH-01', name: 'Household Endline Survey', purpose: 'Outcome measurement for energy & water interventions', projectId: proj(1), status: SurveyStatus.PUBLISHED, currentVersionId: uid('sver', 1), createdById: user['mowe.ie01']! },
      { surveyId: uid('svy', 2), code: 'SVY-PWE-01', name: 'Productive Use of Energy Survey', purpose: 'Enterprise-level productive use baseline', projectId: proj(2), status: SurveyStatus.DRAFT, currentVersionId: null, createdById: user['mowe.ie01']! }
    ]
  });
  await prisma.surveyVersion.createMany({
    data: [
      { versionId: uid('sver', 1), surveyId: uid('svy', 1), versionNo: 1, publishedAt: day('2026-01-15'), publishedById: user['mowe.ie01']!, locked: true, lockedAt: day('2026-01-15'), languages: ['en', 'am'] },
      { versionId: uid('sver', 2), surveyId: uid('svy', 1), versionNo: 2, publishedAt: null, publishedById: null, locked: false, lockedAt: null, languages: ['en'] },
      { versionId: uid('sver', 3), surveyId: uid('svy', 2), versionNo: 1, publishedAt: null, publishedById: null, locked: false, lockedAt: null, languages: ['en'] }
    ]
  });
  const sectDefs = [
    { versionId: uid('sver', 1), code: 'A', title: 'Household roster' },
    { versionId: uid('sver', 1), code: 'B', title: 'Energy access & usage' },
    { versionId: uid('sver', 1), code: 'C', title: 'Water, income & wellbeing' },
    { versionId: uid('sver', 3), code: 'A', title: 'Enterprise profile' }
  ];
  await prisma.section.createMany({ data: sectDefs.map((s, i) => ({ sectionId: uid('sect', i + 1), ...s, orderNo: i, repeatable: false })) });
  const qDefs: Array<{ id: string; sectionId: string; code: string; type: QuestionType; text: string; required: boolean; indicatorId?: string }> = [
    { id: uid('ques', 1), sectionId: uid('sect', 1), code: 'a1', type: QuestionType.NUMERIC, text: 'How many people live in this household?', required: true },
    { id: uid('ques', 2), sectionId: uid('sect', 1), code: 'a2', type: QuestionType.SINGLE, text: 'Sex of household head', required: true },
    { id: uid('ques', 3), sectionId: uid('sect', 2), code: 'b1', type: QuestionType.SINGLE, text: 'Primary lighting source?', required: true, indicatorId: uid('iind', 1) },
    { id: uid('ques', 4), sectionId: uid('sect', 2), code: 'b2', type: QuestionType.NUMERIC, text: 'Average hours of electricity per day?', required: true, indicatorId: uid('iind', 2) },
    { id: uid('ques', 5), sectionId: uid('sect', 2), code: 'b3', type: QuestionType.MULTI, text: 'Which appliances do you own?', required: false },
    { id: uid('ques', 6), sectionId: uid('sect', 2), code: 'b4', type: QuestionType.DATE, text: 'Date of connection?', required: false },
    { id: uid('ques', 7), sectionId: uid('sect', 3), code: 'c1', type: QuestionType.SINGLE, text: 'Main drinking water source?', required: true, indicatorId: uid('iind', 3) },
    { id: uid('ques', 8), sectionId: uid('sect', 3), code: 'c2', type: QuestionType.DECIMAL, text: 'Monthly household income (ETB)?', required: true, indicatorId: uid('iind', 5) },
    { id: uid('ques', 9), sectionId: uid('sect', 3), code: 'c3', type: QuestionType.GPS, text: 'Household GPS point', required: false },
    { id: uid('ques', 10), sectionId: uid('sect', 3), code: 'c4', type: QuestionType.PHOTO, text: 'Photo of water point', required: false },
    { id: uid('ques', 11), sectionId: uid('sect', 3), code: 'c5', type: QuestionType.TEXT, text: 'Any complaints about services? Describe.', required: false },
    { id: uid('ques', 12), sectionId: uid('sect', 3), code: 'c6', type: QuestionType.CALCULATED, text: 'Income per capita (computed)', required: false },
    { id: uid('ques', 13), sectionId: uid('sect', 4), code: 'e1', type: QuestionType.TEXT, text: 'Enterprise name', required: true },
    { id: uid('ques', 14), sectionId: uid('sect', 4), code: 'e2', type: QuestionType.NUMERIC, text: 'Monthly revenue (ETB)', required: true }
  ];
  await prisma.question.createMany({
    data: qDefs.map((q, i) => ({
      questionId: q.id, sectionId: q.sectionId, code: q.code, type: q.type, text: q.text,
      required: q.required, orderNo: i, indicatorId: q.indicatorId ?? null,
      calculation: q.type === QuestionType.CALCULATED ? 'c2 / a1' : null
    }))
  });
  await prisma.questionOption.createMany({
    data: [
      { optionId: uid('qopt', 1), questionId: uid('ques', 2), code: '1', label: 'Male', value: 'MALE', orderNo: 1 },
      { optionId: uid('qopt', 2), questionId: uid('ques', 2), code: '2', label: 'Female', value: 'FEMALE', orderNo: 2 },
      { optionId: uid('qopt', 3), questionId: uid('ques', 3), code: '1', label: 'Grid', value: 'GRID', orderNo: 1 },
      { optionId: uid('qopt', 4), questionId: uid('ques', 3), code: '2', label: 'Solar home system', value: 'SHS', orderNo: 2 },
      { optionId: uid('qopt', 5), questionId: uid('ques', 3), code: '3', label: 'Kerosene', value: 'KEROSENE', orderNo: 3 },
      { optionId: uid('qopt', 6), questionId: uid('ques', 5), code: '1', label: 'Radio', value: 'RADIO', orderNo: 1 },
      { optionId: uid('qopt', 7), questionId: uid('ques', 5), code: '2', label: 'TV', value: 'TV', orderNo: 2 },
      { optionId: uid('qopt', 8), questionId: uid('ques', 5), code: '3', label: 'Phone charger', value: 'CHARGER', orderNo: 3 },
      { optionId: uid('qopt', 9), questionId: uid('ques', 7), code: '1', label: 'Piped yard connection', value: 'PIPES', orderNo: 1 },
      { optionId: uid('qopt', 10), questionId: uid('ques', 7), code: '2', label: 'Public tap', value: 'PTAP', orderNo: 2 },
      { optionId: uid('qopt', 11), questionId: uid('ques', 7), code: '3', label: 'Protected well', value: 'WELL', orderNo: 3 }
    ]
  });
  await prisma.skipLogic.createMany({
    data: [
      { logicId: uid('skip', 1), questionId: uid('ques', 3), condition: 'b3 == KEROSENE', action: SkipLogicAction.REQUIRE, targetQuestionId: uid('ques', 11) },
      { logicId: uid('skip', 2), questionId: uid('ques', 4), condition: 'b2 < 2', action: SkipLogicAction.SHOW, targetQuestionId: uid('ques', 6) }
    ]
  });
  console.log('  ✓ 2 surveys, 3 versions, 4 sections, 14 questions, 11 options, 2 skip rules');

  /* ── 14. Collectors, supervisors, assignments, submissions ────────────── */
  const collectorUsers = [user['dc.en01']!, user['dc.en02']!, user['demo.dc.en']!];
  await prisma.collector.createMany({
    data: collectorUsers.map((u, i) => ({
      collectorId: uid('col', i + 1), userId: u, orgId: org.MOWE!,
      employeeCode: `EN-${100 + i}`, region: i === 2 ? 'Amhara' : 'Oromia',
      woreda: i === 2 ? 'Kewet' : 'Bora', deviceId: `DEV-${i + 1}`,
      trainingDate: day('2026-01-10'), status: CollectorStatus.ACTIVE
    }))
  });
  await prisma.supervisor.createMany({
    data: [user['dc.sv01']!, user['demo.dc.sv']!].map((u, i) => ({
      supervisorId: uid('supv', i + 1), userId: u, orgId: org.MOWE!,
      teamId: `TEAM-${i + 1}`, region: i === 0 ? 'Oromia' : 'Amhara', status: 'ACTIVE'
    }))
  });
  const asgRows = Array.from({ length: 6 }, (_, i) => ({
    assignmentId: uid('asgn', i + 1), waveId: i < 4 ? wave(1) : wave(2),
    surveyVersionId: uid('sver', 1), collectorId: uid('col', i % 3 + 1),
    supervisorId: uid('supv', i % 2 + 1),
    region: i % 2 === 0 ? 'Oromia' : 'Amhara', woreda: i % 2 === 0 ? 'Bora' : 'Kewet',
    targetCount: 15, completedCount: i < 4 ? int(10, 15) : int(0, 5),
    status: i < 4 ? pick([AssignmentStatus.COMPLETED, AssignmentStatus.IN_PROGRESS] as AssignmentStatus[]) : AssignmentStatus.ASSIGNED,
    assignedAt: day('2026-02-01'), dueDate: day('2026-12-15')
  }));
  await prisma.assignment.createMany({ data: asgRows });
  const subStatuses = [SubmissionStatus.SYNCED, SubmissionStatus.SUBMITTED, SubmissionStatus.QA_CLEARED, SubmissionStatus.QA_REVIEW, SubmissionStatus.REJECTED, SubmissionStatus.DRAFT];
  const submRows = Array.from({ length: 24 }, (_, i) => ({
    submissionId: uid('subm', i + 1), assignmentId: uid('asgn', i % 6 + 1),
    collectorId: uid('col', i % 3 + 1), beneficiaryId: i % 3 === 0 ? ben(i + 1) : null,
    panelId: i % 4 === 0 ? uid('panel', i % 36 + 1) : null,
    waveId: i < 16 ? wave(1) : wave(2), surveyVersionId: uid('sver', 1), projectId: proj(1),
    startedAt: new Date(`2026-0${(i % 6) + 2}-1${i % 9}T09:0${i % 6}:00Z`),
    endedAt: new Date(`2026-0${(i % 6) + 2}-1${i % 9}T09:${30 + (i % 25)}:00Z`),
    durationSeconds: 900 + i * 137,
    gpsStartLat: 8.4 + rnd() / 10, gpsStartLon: 39.2 + rnd() / 10,
    gpsEndLat: 8.4 + rnd() / 10, gpsEndLon: 39.2 + rnd() / 10,
    deviceId: `DEV-${i % 3 + 1}`, consentGiven: i % 8 !== 7, consentVersion: 'v1.2',
    consentTypes: ['PARTICIPATION', 'DATA_USE'],
    status: subStatuses[i % 6]!, qaStatus: i % 6 === 4 ? QaStatus.REJECTED : i % 6 === 3 ? QaStatus.FLAGGED : i % 6 === 2 ? QaStatus.CLEARED : QaStatus.PENDING,
    syncedAt: i % 6 === 5 ? null : new Date(`2026-0${(i % 6) + 2}-1${i % 9}T12:00:00Z`),
    checksum: hex(64)
  }));
  await prisma.submission.createMany({ data: submRows });
  const ansRows: Array<{ answerId: string; submissionId: string; questionId: string; valueText: string | null; valueNumeric: string | null; valueDate: Date | null; valueGpsLat: number | null; valueGpsLon: number | null; answerType: AnswerType; answeredAt: Date }> = [];
  let an = 0;
  for (const s of submRows) {
    for (const q of qDefs.slice(0, 9)) {
      an += 1;
      const base = { answerId: uid('ans', an), submissionId: s.submissionId, questionId: q.id, answeredAt: s.startedAt };
      if (q.type === QuestionType.NUMERIC || q.type === QuestionType.DECIMAL) ansRows.push({ ...base, valueText: null, valueNumeric: String(int(1, 9000)), valueDate: null, valueGpsLat: null, valueGpsLon: null, answerType: AnswerType.NUMERIC });
      else if (q.type === QuestionType.SINGLE) ansRows.push({ ...base, valueText: pick(['1', '2', '3']), valueNumeric: null, valueDate: null, valueGpsLat: null, valueGpsLon: null, answerType: AnswerType.TEXT });
      else if (q.type === QuestionType.MULTI) ansRows.push({ ...base, valueText: null, valueNumeric: null, valueDate: null, valueGpsLat: null, valueGpsLon: null, answerType: AnswerType.JSON });
      else if (q.type === QuestionType.DATE) ansRows.push({ ...base, valueText: null, valueNumeric: null, valueDate: day('2025-11-03'), valueGpsLat: null, valueGpsLon: null, answerType: AnswerType.DATE });
      else if (q.type === QuestionType.GPS) ansRows.push({ ...base, valueText: null, valueNumeric: null, valueDate: null, valueGpsLat: 8.5 + rnd() / 10, valueGpsLon: 39.2 + rnd() / 10, answerType: AnswerType.GPS });
      else ansRows.push({ ...base, valueText: pick(['No complaints', 'Low water pressure in dry season', 'Voltage drops at night']), valueNumeric: null, valueDate: null, valueGpsLat: null, valueGpsLon: null, answerType: AnswerType.TEXT });
    }
  }
  await prisma.submissionAnswer.createMany({ data: ansRows });
  await prisma.paradata.createMany({
    data: submRows.flatMap((s, i) => [
      { paradataId: uid('para', i * 2 + 1), submissionId: s.submissionId, questionId: uid('ques', 4), timeSpentMs: int(4000, 60000), editCount: int(0, 4), firstAnswerAt: s.startedAt, lastAnswerAt: s.endedAt, interrupted: i % 5 === 0, deviceMeta: { battery: int(20, 100) } },
      { paradataId: uid('para', i * 2 + 2), submissionId: s.submissionId, questionId: uid('ques', 8), timeSpentMs: int(4000, 60000), editCount: int(0, 4), firstAnswerAt: s.startedAt, lastAnswerAt: s.endedAt, interrupted: false, deviceMeta: Prisma.DbNull }
    ])
  });
  await prisma.consent.createMany({
    data: submRows.map((s, i) => ({
      consentId: uid('cons', i + 1), submissionId: s.submissionId, beneficiaryId: s.beneficiaryId,
      consentType: ConsentType.PARTICIPATION, consentGiven: s.consentGiven, consentVersion: 'v1.2',
      consentText: 'I agree to participate in this survey and to the data use described.',
      language: i % 2 === 0 ? 'en' : 'am', givenAt: s.startedAt,
      witnessName: i % 3 === 0 ? fullName(i + 70) : null
    }))
  });
  await prisma.mediaAttachment.createMany({
    data: submRows.slice(0, 8).map((s, i) => ({
      mediaId: uid('med', i + 1), submissionId: s.submissionId, type: MediaType.PHOTO,
      filePath: `/media/${s.submissionId}/photo-${i}.jpg`, fileSize: BigInt(int(200_000, 4_000_000)),
      mimeType: 'image/jpeg', gpsLat: 8.5 + rnd() / 10, gpsLon: 39.2 + rnd() / 10,
      capturedAt: s.startedAt, checksum: hex(64)
    }))
  });
  console.log(`  ✓ 3 collectors, 2 supervisors, 6 assignments, 24 submissions, ${ansRows.length} answers`);

  /* ── 15. QA rules, flags, back-checks, scorecards ─────────────────────── */
  const qaRuleDefs = [
    { code: 'DURATION_SHORT', name: 'Interview too short', type: QaRuleType.DURATION_SHORT, threshold: { multiplier: 0.5 }, severity: Severity.HIGH },
    { code: 'DURATION_LONG', name: 'Interview too long', type: QaRuleType.DURATION_LONG, threshold: { multiplier: 3 }, severity: Severity.MEDIUM },
    { code: 'STRAIGHT_LINE', name: 'Straight-lining detected', type: QaRuleType.STRAIGHT_LINE, threshold: { minConsecutive: 15 }, severity: Severity.HIGH },
    { code: 'GPS_OUTSIDE', name: 'GPS outside target area', type: QaRuleType.GPS_OUTSIDE, threshold: { toleranceKm: 5 }, severity: Severity.HIGH },
    { code: 'DUPLICATE', name: 'Duplicate submission', type: QaRuleType.DUPLICATE, threshold: { windowDays: 1 }, severity: Severity.CRITICAL },
    { code: 'OUTLIER', name: 'Outlier value detected', type: QaRuleType.OUTLIER, threshold: { zScore: 3 }, severity: Severity.MEDIUM }
  ];
  await prisma.qaRule.createMany({ data: qaRuleDefs.map((r, i) => ({ ruleId: uid('qrule', i + 1), ...r, active: true })) });
  await prisma.qaFlag.createMany({
    data: Array.from({ length: 12 }, (_, i) => ({
      flagId: uid('qflag', i + 1), submissionId: uid('subm', i % 24 + 1), ruleId: uid('qrule', i % 6 + 1),
      severity: qaRuleDefs[i % 6]!.severity,
      details: { reason: 'threshold exceeded', value: int(2, 40) },
      status: ([QaFlagStatus.OPEN, QaFlagStatus.IN_REVIEW, QaFlagStatus.RESOLVED, QaFlagStatus.ESCALATED] as QaFlagStatus[])[i % 4]!,
      reviewedById: i % 4 >= 2 ? user['mowe.qa01']! : null,
      reviewedAt: i % 4 >= 2 ? day('2026-07-01') : null,
      resolution: i % 4 === 2 ? 'Reviewed with enumerator; accepted.' : null
    }))
  });
  await prisma.backCheck.createMany({
    data: Array.from({ length: 8 }, (_, i) => ({
      backcheckId: uid('bchk', i + 1), submissionId: uid('subm', i * 2 + 1), supervisorId: uid('supv', i % 2 + 1),
      date: day(`2026-0${(i % 5) + 3}-1${i % 9}`),
      result: ([BackCheckResult.PASS, BackCheckResult.PARTIAL, BackCheckResult.FAIL] as BackCheckResult[])[i % 3]!,
      mismatchPct: i % 3 === 0 ? '0.00' : (int(5, 45)).toFixed(2),
      notes: i % 3 === 2 ? 'Two answers differed on re-interview.' : null
    }))
  });
  await prisma.collectorScorecard.createMany({
    data: [1, 2, 3].map((c, i) => ({
      scorecardId: uid('score', i + 1), collectorId: uid('col', c), waveId: wave(1), projectId: proj(1),
      submissionsCount: int(8, 20), flaggedCount: int(0, 4),
      backcheckPassRate: (70 + rnd() * 30).toFixed(2), avgDurationSeconds: int(1200, 3600),
      compositeScore: (60 + rnd() * 39).toFixed(2)
    }))
  });
  console.log('  ✓ 6 QA rules, 12 flags, 8 back-checks, 3 scorecards');

  /* ── 16. Warehouse & research ─────────────────────────────────────────── */
  await prisma.waveDataset.createMany({
    data: [
      { datasetId: uid('wds', 1), waveId: wave(1), version: 1, recordCount: 480, buildStartedAt: day('2026-05-02'), buildCompletedAt: day('2026-05-02'), checksum: hex(64), storagePath: '/warehouse/w1/v1', status: WaveDatasetStatus.RELEASED },
      { datasetId: uid('wds', 2), waveId: wave(1), version: 2, recordCount: 512, buildStartedAt: day('2026-06-11'), buildCompletedAt: day('2026-06-11'), checksum: hex(64), storagePath: '/warehouse/w1/v2', status: WaveDatasetStatus.READY },
      { datasetId: uid('wds', 3), waveId: wave(3), version: 1, recordCount: 366, buildStartedAt: day('2026-07-01'), buildCompletedAt: day('2026-07-02'), checksum: hex(64), storagePath: '/warehouse/p2w1/v1', status: WaveDatasetStatus.RELEASED },
      { datasetId: uid('wds', 4), waveId: wave(2), version: 1, recordCount: 0, buildStartedAt: new Date(), buildCompletedAt: null, checksum: null, storagePath: null, status: WaveDatasetStatus.BUILDING }
    ]
  });
  await prisma.anonymizationMap.createMany({
    data: Array.from({ length: 12 }, (_, i) => ({
      mapId: uid('amap', i + 1), originalId: ben(i + 1), anonymizedId: uid('ben', 900 + i),
      level: ([AnonLevel.L1, AnonLevel.L2, AnonLevel.L3] as AnonLevel[])[i % 3]!
    }))
  });
  await prisma.researchDataset.createMany({
    data: [
      { datasetId: uid('rds', 1), waveId: wave(1), projectId: proj(1), anonymizationLevel: AnonLevel.L2, version: 2, formats: ['CSV', 'STATA'], recordCount: 512, releasedAt: day('2026-06-20'), codebookRef: '/research/w1-codebook.pdf', status: ResearchDatasetStatus.PUBLISHED },
      { datasetId: uid('rds', 2), waveId: wave(3), projectId: proj(2), anonymizationLevel: AnonLevel.L1, version: 1, formats: ['CSV'], recordCount: 366, releasedAt: day('2026-07-15'), codebookRef: null, status: ResearchDatasetStatus.PUBLISHED },
      { datasetId: uid('rds', 3), waveId: wave(1), projectId: proj(1), anonymizationLevel: AnonLevel.L0, version: 1, formats: ['PARQUET'], recordCount: 480, releasedAt: null, codebookRef: null, status: ResearchDatasetStatus.DRAFT },
      { datasetId: uid('rds', 4), waveId: wave(2), projectId: proj(1), anonymizationLevel: AnonLevel.L3, version: 1, formats: ['CSV', 'R'], recordCount: 0, releasedAt: null, codebookRef: null, status: ResearchDatasetStatus.DRAFT }
    ]
  });
  await prisma.dataRequest.createMany({
    data: Array.from({ length: 6 }, (_, i) => ({
      requestId: uid('dreq', i + 1), datasetId: uid('rds', i % 2 + 1),
      researcherName: fullName(i + 90), researcherEmail: `researcher${i + 1}@${i % 2 === 0 ? 'aau.edu.et' : 'uni.example'}`,
      institution: i % 2 === 0 ? 'Addis Ababa University' : 'International Growth Centre',
      purpose: 'Impact evaluation of rural electrification on household income.',
      status: ([DataRequestStatus.SUBMITTED, DataRequestStatus.UNDER_REVIEW, DataRequestStatus.APPROVED, DataRequestStatus.APPROVED, DataRequestStatus.REJECTED, DataRequestStatus.EXPIRED] as DataRequestStatus[])[i]!,
      submittedAt: day(`2026-0${(i % 6) + 2}-0${i + 1}`),
      approvedById: i === 2 || i === 3 ? user['mowe.dm01']! : null,
      approvedAt: i === 2 || i === 3 ? day('2026-08-01') : null,
      accessExpiresAt: i === 2 || i === 3 ? day('2027-08-01') : null,
      requesterId: i < 2 ? user['demo.rs.ex']! : null
    }))
  });
  await prisma.dataUseAgreement.createMany({
    data: [3, 4].map((n, i) => ({
      duaId: uid('dua', i + 1), requestId: uid('dreq', n), signedAt: day('2026-08-05'),
      signedByResearcher: true, signedByInstitution: true, signedByDataManager: i === 0,
      filePath: i === 0 ? '/research/dua-0003.pdf' : null, expiryDate: day('2027-08-01')
    }))
  });
  await prisma.researchProject.createMany({
    data: [
      { researchProjectId: uid('rproj', 1), title: 'Electrification & household welfare', leadResearcher: 'Prof. Selam Worku', institution: 'Addis Ababa University', status: ResearchProjectStatus.ACTIVE, datasetIds: [uid('rds', 1)], startDate: day('2026-08-15'), endDate: null, projectId: proj(1), createdById: user['demo.rs.ex']! },
      { researchProjectId: uid('rproj', 2), title: 'Water access and child health', leadResearcher: 'Dr. Paulos Girma', institution: 'International Growth Centre', status: ResearchProjectStatus.PUBLISHED, datasetIds: [uid('rds', 2)], startDate: day('2026-01-10'), endDate: day('2026-09-30'), projectId: proj(2), createdById: user['demo.rs.ex']! }
    ]
  });
  await prisma.publication.createMany({
    data: [
      { publicationId: uid('pub', 1), researchProjectId: uid('rproj', 2), title: 'Water access and child health outcomes: evidence from Ethiopia', authors: 'P. Girma, S. Worku', journal: 'Journal of Development Economics', year: 2026, doi: '10.1016/j.jdeveco.2026.103000', citation: 'Girma & Worku (2026). JDE 103000.' },
      { publicationId: uid('pub', 2), researchProjectId: uid('rproj', 2), title: 'Service delivery quality in rural WASH', authors: 'P. Girma', journal: null, year: 2026, doi: null, citation: 'Girma (2026). Working paper.' }
    ]
  });
  console.log('  ✓ 4 wave datasets, 12 anon maps, 4 research datasets, 6 requests, 2 DUAs, 2 research projects, 2 publications');

  /* ── 17. Inception reports + comments ─────────────────────────────────── */
  const incepDefs = [
    { pi: 1, v: 1, status: InceptionStatus.APPROVED, noObj: true },
    { pi: 2, v: 1, status: InceptionStatus.APPROVED, noObj: true },
    { pi: 3, v: 1, status: InceptionStatus.UNDER_REVIEW, noObj: false },
    { pi: 4, v: 1, status: InceptionStatus.SUBMITTED, noObj: false },
    { pi: 4, v: 2, status: InceptionStatus.REVISION_REQUIRED, noObj: false },
    { pi: 5, v: 1, status: InceptionStatus.DRAFT, noObj: false },
    { pi: 6, v: 1, status: InceptionStatus.SUBMITTED, noObj: false },
    { pi: 10, v: 1, status: InceptionStatus.REJECTED, noObj: false }
  ];
  await prisma.inceptionReport.createMany({
    data: incepDefs.map((d, i) => ({
      reportId: uid('incep', i + 1), projectId: proj(d.pi), version: d.v,
      templateId: null, submissionDate: d.status === InceptionStatus.DRAFT ? null : day(`2026-0${(i % 5) + 2}-1${i % 9}`),
      dueDate: day(`2026-${String((i % 9) + 2).padStart(2, '0')}-28`),
      status: d.status,
      submittedById: d.status === InceptionStatus.DRAFT ? null : user['mowe.piu01']!,
      reviewedById: d.status !== InceptionStatus.DRAFT && d.status !== InceptionStatus.SUBMITTED ? user['wb.ttl01']! : null,
      reviewedAt: d.status === InceptionStatus.APPROVED ? day('2026-05-05') : null,
      noObjection: d.noObj, noObjectionDate: d.noObj ? day('2026-05-06') : null,
      summary: `Inception report v${d.v} — methodology, workplan and procurement arrangements.`
    }))
  });
  await prisma.reviewComment.createMany({
    data: Array.from({ length: 10 }, (_, i) => ({
      commentId: uid('rvcmt', i + 1), reportId: uid('incep', i % 5 + 3),
      sectionId: i % 2 === 0 ? 'methodology' : 'workplan',
      authorId: user['wb.ttl01']!, text: pick(['Please clarify the sampling frame.', 'Workplan dates inconsistent with procurement plan.', 'Add safeguard risk mitigation table.', 'Budget breakdown missing for component 2.']),
      resolved: i % 3 === 0, resolvedById: i % 3 === 0 ? user['mowe.piu01']! : null,
      resolvedAt: i % 3 === 0 ? day('2026-06-01') : null, parentId: null
    }))
  });
  console.log(`  ✓ ${incepDefs.length} inception reports (all statuses), 10 review comments`);

  /* ── 18. Documents & versions ─────────────────────────────────────────── */
  const docTypes = [DocType.APPRAISAL, DocType.FEASIBILITY, DocType.CONTRACT, DocType.INVOICE, DocType.REPORT, DocType.INCEPTION, DocType.PROCUREMENT, DocType.LEGAL, DocType.TECHNICAL, DocType.OTHER];
  await prisma.document.createMany({
    data: Array.from({ length: 18 }, (_, i) => ({
      docId: uid('doc', i + 1), projectId: i < 14 ? proj(i % 6 + 1) : null,
      docType: docTypes[i % 10]!, title: `${docTypes[i % 10]} — ${projDefs[i % 12]!.name} (${i + 1})`,
      description: 'Seeded demonstration document.', version: i % 4 === 0 ? 2 : 1,
      filePath: `/documents/2026/${String(i + 1).padStart(3, '0')}.pdf`,
      fileSize: BigInt(int(80_000, 6_000_000)), mimeType: 'application/pdf', checksum: hex(64),
      accessLevel: ([AccessLevel.PUBLIC, AccessLevel.INTERNAL, AccessLevel.RESTRICTED] as AccessLevel[])[i % 3]!,
      tags: ['seed', i % 2 === 0 ? 'fy2026' : 'fy2025'],
      uploadedById: user['mowe.piu01']!
    }))
  });
  await prisma.documentVersion.createMany({
    data: [1, 5, 9, 13].flatMap((d, k) => [1, 2].map(v => ({
      versionId: uid('docv', k * 2 + v), docId: uid('doc', d), version: v,
      filePath: `/documents/2026/${String(d).padStart(3, '0')}-v${v}.pdf`,
      fileSize: BigInt(int(80_000, 6_000_000)), checksum: hex(64),
      notes: v === 1 ? 'Initial upload' : 'Revised after review',
      uploadedById: user['mowe.piu01']!
    })))
  });
  console.log('  ✓ 18 documents, 8 versions');

  /* ── 19. Reports & schedules ──────────────────────────────────────────── */
  await prisma.report.createMany({
    data: Array.from({ length: 12 }, (_, i) => ({
      reportId: uid('rep', i + 1), projectId: i < 9 ? proj(i % 6 + 1) : null,
      reportType: ([ReportType.INCEPTION, ReportType.PPMR, ReportType.ISR, ReportType.FINANCIAL, ReportType.PROCUREMENT, ReportType.BENEFICIARY, ReportType.GRIEVANCE, ReportType.IMPACT, ReportType.AD_HOC] as ReportType[])[i % 9]!,
      period: i % 2 === 0 ? '2026-Q2' : '2026-Q3',
      format: ([ReportFormat.PDF, ReportFormat.EXCEL, ReportFormat.CSV] as ReportFormat[])[i % 3]!,
      filePath: i % 5 === 4 ? null : `/reports/2026/rep-${i + 1}.pdf`,
      fileSize: i % 5 === 4 ? null : BigInt(int(100_000, 3_000_000)),
      parameters: { fiscalYear: 2026 },
      status: i % 5 === 4 ? 'QUEUED' : i % 7 === 6 ? 'FAILED' : 'COMPLETED',
      error: i % 7 === 6 ? 'Template rendering timeout' : null,
      generatedById: user['mowe.me01']!,
      generatedAt: day(`2026-0${(i % 8) + 1}-2${i % 8}`)
    }))
  });
  await prisma.reportSchedule.createMany({
    data: [
      { scheduleId: uid('reps', 1), reportType: ReportType.PPMR, cron: '0 6 1 */3 *', recipients: ['piu01@mowe.gov.et'], format: ReportFormat.PDF, active: true, lastRunAt: day('2026-07-01'), nextRunAt: day('2027-01-01') },
      { scheduleId: uid('reps', 2), reportType: ReportType.FINANCIAL, cron: '0 7 5 * *', recipients: ['bo01@mof.gov.et'], format: ReportFormat.EXCEL, active: true, lastRunAt: day('2026-10-05'), nextRunAt: day('2026-11-05') },
      { scheduleId: uid('reps', 3), reportType: ReportType.GRIEVANCE, cron: '0 8 * * 1', recipients: ['es@mowe.gov.et'], format: ReportFormat.CSV, active: false, lastRunAt: null, nextRunAt: null }
    ]
  });
  console.log('  ✓ 12 reports, 3 schedules');

  /* ── 20. Grievances & actions ─────────────────────────────────────────── */
  await prisma.grievance.createMany({
    data: Array.from({ length: 16 }, (_, i) => {
      const status = ([GrievanceStatus.OPEN, GrievanceStatus.IN_PROGRESS, GrievanceStatus.RESOLVED, GrievanceStatus.CLOSED, GrievanceStatus.ESCALATED] as GrievanceStatus[])[i % 5]!;
      const submitted = day(`2026-${String((i % 9) + 1).padStart(2, '0')}-${String((i % 26) + 2).padStart(2, '0')}`);
      return {
        grievanceId: uid('grv', i + 1), ticketNo: `GRV-2026-${String(i + 1).padStart(4, '0')}`,
        projectId: i % 7 === 6 ? null : proj(i % 4 + 1),
        beneficiaryId: i % 3 === 0 ? ben(i + 1) : null,
        category: ([GrievanceCategory.SERVICE_QUALITY, GrievanceCategory.DELAY, GrievanceCategory.PAYMENT, GrievanceCategory.SAFEGUARDS, GrievanceCategory.CONDUCT, GrievanceCategory.OTHER] as GrievanceCategory[])[i % 6]!,
        subcategory: i % 2 === 0 ? 'Installation quality' : null,
        description: pick(['Water point not functioning after installation.', 'Payment requested beyond contract terms.', 'Delayed response to service request.', 'Worker conduct complaint at site.', 'Safety concern near installation site.']),
        channel: ([GrievanceChannel.WEB, GrievanceChannel.SMS, GrievanceChannel.USSD, GrievanceChannel.PHONE, GrievanceChannel.IN_PERSON, GrievanceChannel.LETTER] as GrievanceChannel[])[i % 6]!,
        submittedAt: submitted,
        locationId: loc(i % 6), assignedToId: status === GrievanceStatus.OPEN && i % 4 === 0 ? null : user['mowe.piu01']!,
        assignedAt: status === GrievanceStatus.OPEN && i % 4 === 0 ? null : submitted,
        slaDue: new Date(submitted.getTime() + (i % 4 === 0 ? 3 : 20) * 86400000),
        severity: ([Severity.LOW, Severity.MEDIUM, Severity.HIGH, Severity.CRITICAL] as Severity[])[i % 4]!,
        status,
        resolution: status === GrievanceStatus.RESOLVED || status === GrievanceStatus.CLOSED ? 'Resolved on site with supplier; beneficiary confirmed.' : null,
        resolvedAt: status === GrievanceStatus.RESOLVED || status === GrievanceStatus.CLOSED ? day('2026-08-20') : null,
        escalatedToId: status === GrievanceStatus.ESCALATED ? user['mowe.admin']! : null,
        anonymous: i % 8 === 7
      };
    })
  });
  await prisma.grievanceAction.createMany({
    data: Array.from({ length: 22 }, (_, i) => ({
      actionId: uid('grva', i + 1), grievanceId: uid('grv', i % 16 + 1),
      actionType: ([GrievanceActionType.ASSIGN, GrievanceActionType.RESPOND, GrievanceActionType.ESCALATE, GrievanceActionType.RESOLVE, GrievanceActionType.CLOSE, GrievanceActionType.REOPEN] as GrievanceActionType[])[i % 6]!,
      actorId: user['mowe.piu01']!, notes: 'Action recorded during case handling.',
      createdAt: day(`2026-0${(i % 8) + 1}-1${i % 9}`)
    }))
  });
  console.log('  ✓ 16 grievances (all statuses/severities), 22 actions');

  /* ── 21. Notifications & templates ────────────────────────────────────── */
  await prisma.notificationTemplate.createMany({
    data: [
      { templateId: uid('ntpl', 1), code: 'WELCOME', channel: NotificationChannel.IN_APP, subject: 'Welcome to PIIMS', body: 'Your account {{username}} is ready.', language: 'en', active: true, orgId: null },
      { templateId: uid('ntpl', 2), code: 'SLA_BREACH', channel: NotificationChannel.EMAIL, subject: 'Grievance SLA breach', body: 'Ticket {{ticketNo}} breached SLA.', language: 'en', active: true, orgId: null },
      { templateId: uid('ntpl', 3), code: 'WAVE_PUBLISHED', channel: NotificationChannel.SMS, subject: null, body: 'Wave {{waveCode}} dataset published.', language: 'en', active: true, orgId: null },
      { templateId: uid('ntpl', 4), code: 'REPORT_READY', channel: NotificationChannel.IN_APP, subject: 'Report ready', body: 'Your report {{reportType}} is ready for download.', language: 'am', active: true, orgId: org.MOWE! }
    ]
  });
  await prisma.notification.createMany({
    data: Array.from({ length: 30 }, (_, i) => ({
      notificationId: uid('ntf', i + 1),
      userId: Object.values(user)[i % Object.keys(user).length]!,
      beneficiaryId: null, channel: ([NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.SMS] as NotificationChannel[])[i % 3]!,
      templateId: uid('ntpl', i % 4 + 1),
      subject: pick(['Report ready', 'Grievance SLA breach', 'Wave dataset published', 'Welcome to PIIMS']),
      body: pick(['Your Q3 PPMR is ready for download.', 'Ticket GRV-2026-0004 breached its SLA.', 'Baseline dataset v2 published to the warehouse.', 'Account provisioned — change password at first login.']),
      language: 'en',
      status: ([NotificationStatus.PENDING, NotificationStatus.SENT, NotificationStatus.DELIVERED, NotificationStatus.READ, NotificationStatus.FAILED] as NotificationStatus[])[i % 5]!,
      sentAt: i % 5 === 0 ? null : day('2026-09-01'),
      deliveredAt: i % 5 === 2 || i % 5 === 3 ? day('2026-09-01') : null,
      readAt: i % 5 === 3 ? day('2026-09-02') : null,
      error: i % 5 === 4 ? 'SMS gateway timeout' : null
    }))
  });
  console.log('  ✓ 4 templates, 30 notifications');

  /* ── 22. Integrations (sync jobs) ─────────────────────────────────────── */
  await prisma.syncJob.createMany({
    data: Array.from({ length: 10 }, (_, i) => ({
      jobId: uid('sync', i + 1),
      integrationCode: (['FMIS', 'SMS-GW', 'ODK', 'NBE-FX'] as const)[i % 4]!,
      direction: ([SyncJobDirection.INBOUND, SyncJobDirection.OUTBOUND, SyncJobDirection.BIDIRECTIONAL] as SyncJobDirection[])[i % 3]!,
      kind: (['budget-sync', 'disbursement-sync', 'sms-broadcast', 'submission-import'] as const)[i % 4]!,
      startedAt: day(`2026-09-${String((i % 27) + 1).padStart(2, '0')}`),
      completedAt: i % 6 === 5 ? null : day(`2026-09-${String((i % 27) + 1).padStart(2, '0')}`),
      durationMs: i % 6 === 5 ? null : int(800, 45000),
      status: ([SyncJobStatus.SUCCESS, SyncJobStatus.SUCCESS, SyncJobStatus.PARTIAL, SyncJobStatus.FAILED, SyncJobStatus.RUNNING] as SyncJobStatus[])[i % 5]!,
      recordsProcessed: int(0, 4200), recordsFailed: i % 4 === 2 ? int(1, 30) : 0,
      errorSummary: i % 5 === 3 ? 'Upstream 503 from FMIS gateway' : null,
      triggeredById: i % 2 === 0 ? user['demo.sys.ops']! : null
    }))
  });
  console.log('  ✓ 10 sync jobs across 4 integrations');

  /* ── 23. Audit log ────────────────────────────────────────────────────── */
  const usernames = Object.keys(user);
  await prisma.auditLog.createMany({
    data: Array.from({ length: 48 }, (_, i) => ({
      userId: i % 9 === 8 ? null : user[usernames[i % usernames.length]!]!,
      sessionId: null,
      entity: (['Project', 'Beneficiary', 'Document', 'Disbursement', 'Grievance', 'User', 'Auth'] as const)[i % 7]!,
      entityId: i % 7 === 6 ? null : uid('proj', i % 12 + 1),
      action: i % 7 === 6 ? AuditAction.LOGIN : ([AuditAction.CREATE, AuditAction.UPDATE, AuditAction.APPROVE, AuditAction.REJECT, AuditAction.EXPORT, AuditAction.DOWNLOAD, AuditAction.DELETE] as AuditAction[])[i % 7]!,
      oldValue: i % 3 === 1 ? { status: 'SUBMITTED' } : Prisma.DbNull,
      newValue: i % 3 === 1 ? { status: 'APPROVED' } : { changed: true },
      ipAddress: `10.0.${i % 4}.${(i * 7) % 250 + 1}`,
      userAgent: 'Mozilla/5.0 (PIIMS demo seed)',
      correlationId: null,
      prevHash: i === 0 ? null : hex(64),
      recordHash: hex(64),
      createdAt: new Date(Date.UTC(2026, 8, (i % 28) + 1, (i % 24), (i * 13) % 60))
    }))
  });
  console.log('  ✓ 48 audit log entries');

  /* ── 24. Master data & settings ───────────────────────────────────────── */
  const regions = ['Oromia', 'Amhara', 'Tigray', 'SNNP', 'Somali', 'Afar', 'Benishangul-Gumuz', 'Gambella', 'Harari', 'Addis Ababa', 'Dire Dawa', 'Sidama', 'South West Ethiopia'];
  await prisma.masterData.createMany({
    data: [
      ...regions.map((r, i) => ({ masterId: uid('mst', i + 1), category: 'REGION', code: r.toUpperCase().replace(/\s+/g, '_'), name: r, parentId: null, attributes: Prisma.DbNull, orderNo: i, active: true, createdById: null })),
      ...['WATER', 'ENERGY', 'BOTH', 'OTHER'].map((s, i) => ({ masterId: uid('mst', 20 + i), category: 'SECTOR', code: s, name: s[0]! + s.slice(1).toLowerCase(), parentId: null, attributes: Prisma.DbNull, orderNo: i, active: true, createdById: null })),
      ...['SHS', 'MINI_GRID', 'PUMP', 'LANTERN'].map((p, i) => ({ masterId: uid('mst', 30 + i), category: 'PRODUCT_TYPE', code: p, name: p.replace('_', ' '), parentId: null, attributes: Prisma.DbNull, orderNo: i, active: true, createdById: null }))
    ]
  });
  const settings = [
    { key: 'system.version', value: '2.0.0', category: 'system' },
    { key: 'system.locale.default', value: 'en', category: 'system' },
    { key: 'system.fiscal_year.current', value: 2026, category: 'system' },
    { key: 'consent.current_version', value: 'v1.2', category: 'safeguards' },
    { key: 'integrations.fmis.enabled', value: true, category: 'integrations' },
    { key: 'integrations.sms.enabled', value: true, category: 'integrations' }
  ];
  for (const s of settings) {
    await prisma.systemSetting.upsert({ where: { key: s.key }, update: { value: s.value }, create: { key: s.key, value: s.value, category: s.category } });
  }
  console.log(`  ✓ ${regions.length + 8} master-data rows, ${settings.length} settings`);

  /* ── Summary ──────────────────────────────────────────────────────────── */
  console.log('');
  console.log('✅ Seed complete!');
  console.log('');
  console.log('Test accounts (password for ALL: demo1234)');
  console.log('  Friendly aliases:');
  console.log('    mowe.admin  MW-SA   System Administrator (everything)');
  console.log('    mowe.piu01  MW-PIU  PIU Officer (projects, inception, beneficiaries…)');
  console.log('    mowe.me01   MW-ME   M&E Officer (results, reports)');
  console.log('    mowe.ie01   MW-IE   Impact Evaluation (surveys, impact, warehouse)');
  console.log('    mowe.dm01   MW-DM   Data Manager (warehouse, research approvals)');
  console.log('    mowe.qa01   MW-QA   Data Quality (QA flags, back-checks)');
  console.log('    mof.bo01    MF-BO   Budget Officer (budgets)');
  console.log('    dbe.lo01    DB-LO   Loan Officer (disbursements)');
  console.log('    wb.ttl01    WB-TTL  World Bank TTL (inception review, WB export)');
  console.log('    dc.en01/02  DC-EN   Data Collectors (field app)');
  console.log('    dc.sv01     DC-SV   Field Supervisor (QA review)');
  console.log('  One account per remaining role: demo.<role-code> e.g. demo.lg.ro,');
  console.log('  demo.sp.ad (supplier portal), demo.rs.ex (researcher), demo.au.ex …');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
