import { z } from 'zod';
import {
  IndicatorType, IndicatorFrequency, IndicatorDirection, TrafficLight
} from '@prisma/client';

const indicatorTypeValues = Object.values(IndicatorType) as [IndicatorType, ...IndicatorType[]];
const indicatorFreqValues = Object.values(IndicatorFrequency) as [IndicatorFrequency, ...IndicatorFrequency[]];
const indicatorDirValues = Object.values(IndicatorDirection) as [IndicatorDirection, ...IndicatorDirection[]];
const trafficLightValues = Object.values(TrafficLight) as [TrafficLight, ...TrafficLight[]];

/* ─── Components ─────────────────────────────────────────────────── */

export const createComponentSchema = z.object({
  code: z.string().trim().min(1).max(20),
  name: z.string().trim().min(3).max(200),
  nameAm: z.string().trim().max(200).optional().or(z.literal('')),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  budget: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().or(z.literal('')),
  responsibleOrgId: z.string().uuid().optional().or(z.literal('')),
  orderNo: z.coerce.number().int().min(0).default(0)
});
export type CreateComponentInput = z.infer<typeof createComponentSchema>;

export const updateComponentSchema = createComponentSchema.partial();
export type UpdateComponentInput = z.infer<typeof updateComponentSchema>;

/* ─── Subcomponents ──────────────────────────────────────────────── */

export const createSubcomponentSchema = z.object({
  code: z.string().trim().min(1).max(20),
  name: z.string().trim().min(3).max(200),
  nameAm: z.string().trim().max(200).optional().or(z.literal('')),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  budget: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().or(z.literal('')),
  responsibleOrgId: z.string().uuid().optional().or(z.literal('')),
  orderNo: z.coerce.number().int().min(0).default(0)
});
export type CreateSubcomponentInput = z.infer<typeof createSubcomponentSchema>;

export const updateSubcomponentSchema = createSubcomponentSchema.partial();
export type UpdateSubcomponentInput = z.infer<typeof updateSubcomponentSchema>;

/* ─── Indicators ─────────────────────────────────────────────────── */

export const createIndicatorSchema = z.object({
  subcomponentId: z.string().uuid('Select a subcomponent'),
  code: z.string().trim().min(1).max(30),
  name: z.string().trim().min(3).max(300),
  nameAm: z.string().trim().max(300).optional().or(z.literal('')),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  indicatorType: z.enum(indicatorTypeValues),
  unit: z.string().trim().min(1).max(50),
  baseline: z.coerce.number().optional(),
  baselineDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  target: z.coerce.number().optional(),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  frequency: z.enum(indicatorFreqValues),
  direction: z.enum(indicatorDirValues),
  method: z.string().trim().max(500).optional().or(z.literal('')),
  disaggregation: z.array(z.string()).optional().default([])
});
export type CreateIndicatorInput = z.infer<typeof createIndicatorSchema>;

export const updateIndicatorSchema = createIndicatorSchema.omit({ subcomponentId: true }).partial();
export type UpdateIndicatorInput = z.infer<typeof updateIndicatorSchema>;

export const listIndicatorsQuerySchema = z.object({
  project_id: z.string().uuid().optional(),
  component_id: z.string().uuid().optional(),
  subcomponent_id: z.string().uuid().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
  q: z.string().optional()
});
export type ListIndicatorsQuery = z.infer<typeof listIndicatorsQuerySchema>;

/* ─── Indicator values ───────────────────────────────────────────── */

export const recordValueSchema = z.object({
  period: z.string().trim().min(1).max(20),
  fiscalYear: z.coerce.number().int().min(2000).max(3000),
  value: z.coerce.number(),
  target: z.coerce.number().optional(),
  dataSource: z.string().trim().max(200).optional().or(z.literal('')),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
  disaggregation: z.record(z.record(z.number())).optional()
});
export type RecordValueInput = z.infer<typeof recordValueSchema>;

/* ─── Aggregation ────────────────────────────────────────────────── */

export const aggregateQuerySchema = z.object({
  project_id: z.string().uuid('project_id is required'),
  group_by: z.enum(['component', 'region', 'gender']).default('component')
});
export type AggregateQuery = z.infer<typeof aggregateQuerySchema>;

export const TRAFFIC_LIGHT_VALUES = trafficLightValues;