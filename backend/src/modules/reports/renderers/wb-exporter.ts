/**
 * World Bank ISR / PPMR XML exporter.
 * Format follows the WB reporting schema for supervision missions.
 */
export interface WbProjectRow {
  projectCode: string;
  wbCreditNo: string;
  reportingPeriod: string;
  status: string;
  plannedDisbursement: string;
  actualDisbursement: string;
  currency: string;
  indicators: { code: string; baseline: string; target: string; actual: string; status: string }[];
  grievancesOpen: number;
  grievancesResolved: number;
}

export function renderWbXml(rows: WbProjectRow[]): Buffer {
  const xml = buildXml(rows);
  return Buffer.from(xml, 'utf-8');
}

function buildXml(rows: WbProjectRow[]): string {
  const projectXml = rows.map((r) => `
    <Project>
      <ProjectCode>${esc(r.projectCode)}</ProjectCode>
      <WBCreditNo>${esc(r.wbCreditNo)}</WBCreditNo>
      <ReportingPeriod>${esc(r.reportingPeriod)}</ReportingPeriod>
      <Status>${esc(r.status)}</Status>
      <Disbursement>
        <Planned>${esc(r.plannedDisbursement)}</Planned>
        <Actual>${esc(r.actualDisbursement)}</Actual>
        <Currency>${esc(r.currency)}</Currency>
      </Disbursement>
      <Indicators>
        ${r.indicators.map((i) => `
        <Indicator code="${esc(i.code)}">
          <Baseline>${esc(i.baseline)}</Baseline>
          <Target>${esc(i.target)}</Target>
          <Actual>${esc(i.actual)}</Actual>
          <Status>${esc(i.status)}</Status>
        </Indicator>`).join('')}
      </Indicators>
      <Safeguards>
        <GrievancesOpen>${r.grievancesOpen}</GrievancesOpen>
        <GrievancesResolved>${r.grievancesResolved}</GrievancesResolved>
      </Safeguards>
    </Project>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<ISR xmlns="http://worldbank.org/piims/isr/v1">
  <GeneratedAt>${new Date().toISOString()}</GeneratedAt>
  <ProjectCount>${rows.length}</ProjectCount>
  <Projects>${projectXml}
  </Projects>
</ISR>`;
}

function esc(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}