import { QUEUE_NAMES, registerWorker } from '@/config/queue.js';
import { processReportJob } from '@/modules/reports/report.service.js';
import { logger } from '@/config/logger.js';

/**
 * Report generation worker. Dequeues report jobs and runs the
 * PDF/Excel/CSV render pipeline. Registered at startup in main.ts.
 */
export function startReportWorker(): ReturnType<typeof registerWorker> {
  const worker = registerWorker<{ reportId: string }>(
    QUEUE_NAMES.REPORTS,
    async (job) => {
      const { reportId } = job.data;
      logger.info({ reportId, jobId: job.id }, 'report job started');
      await processReportJob(reportId);
      return { reportId, ok: true };
    },
    2
  );

  logger.info('report worker registered');
  return worker;
}