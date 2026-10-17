import { z } from 'zod';

const bboxRegex = /^-?\d+(\.\d+)?(,-?\d+(\.\d+)?){3}$/;

export const markersQuerySchema = z.object({
  bbox: z.string().regex(bboxRegex, 'bbox must be w,s,e,n').optional(),
  region: z.string().optional(),
  woreda: z.string().optional(),
  status: z.string().optional(),
  project_id: z.string().uuid().optional()
});
export type MarkersQuery = z.infer<typeof markersQuerySchema>;

export const geoVerifySchema = z.object({
  entityType: z.enum(['BENEFICIARY', 'SERVICE_DELIVERY']),
  entityId: z.string().uuid(),
  claimedLocation: z.object({
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180)
  }),
  toleranceMeters: z.coerce.number().min(1).max(50000).default(500)
});
export type GeoVerifyInput = z.infer<typeof geoVerifySchema>;