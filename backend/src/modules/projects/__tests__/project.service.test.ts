import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma.js';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '@/lib/errors.js';
import * as service from '../project.service.js';

vi.mock('@/lib/prisma.js', () => ({
  prisma: {
    project: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    },
    organization: { findUnique: vi.fn() },
    location: { create: vi.fn() },
    auditLog: { create: vi.fn(), findFirst: vi.fn() },
    $transaction: vi.fn()
  }
}));

vi.mock('@/lib/audit.js', () => ({
  writeAudit: vi.fn().mockResolvedValue(undefined)
}));

const federalScope = { orgLevel: 'FEDERAL' as const };
const ctx = { ipAddress: '127.0.0.1', userAgent: 'test', correlationId: null };

const mockProject = {
  projectId: 'p1',
  projectCode: 'PIIMS-2026-0001',
  name: 'Test Project',
  nameAm: null,
  description: null,
  sector: 'ENERGY',
  subsector: null,
  status: 'IDEA',
  stageGate: null,
  ownerOrgId: 'o1',
  locationId: 'l1',
  totalBudget: 15000000,
  currency: 'ETB',
  wbCreditNo: null,
  approvalDate: null,
  startDate: null,
  endDate: null,
  actualStart: null,
  actualEnd: null,
  implementationArrangement: 'PIU',
  financingSource: null,
  createdById: 'u1',
  updatedById: null,
  deletedAt: null,
  version: 1,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ownerOrg: { orgId: 'o1', name: 'MoWE', level: 'FEDERAL', code: 'MOWE' },
  location: {
    locationId: 'l1',
    region: 'Oromia',
    regionCode: 'OR',
    zone: 'East Shewa',
    woreda: 'Bora',
    kebele: 'K1',
    latitude: null,
    longitude: null,
    altitude: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }
};

describe('project.service.getProjectById', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns project for federal scope', async () => {
    (prisma.project.findFirst as any).mockResolvedValue(mockProject);
    const result = await service.getProjectById('p1', federalScope, 'o1', 'u1');
    expect(result.projectId).toBe('p1');
    expect(result.totalBudget.amount).toBe('15000000');
    expect(result.ownerOrgName).toBe('MoWE');
  });

  it('throws NotFoundError for missing project', async () => {
    (prisma.project.findFirst as any).mockResolvedValue(null);
    await expect(service.getProjectById('pX', federalScope, 'o1', 'u1'))
      .rejects.toThrow(NotFoundError);
  });

  it('throws ForbiddenError for out-of-scope user', async () => {
    (prisma.project.findFirst as any).mockResolvedValue(mockProject);
    const woredaScope = {
      orgLevel: 'WOREDA' as const,
      woredas: ['NonExistent']
    };
    await expect(service.getProjectById('p1', woredaScope, 'oX', 'uX'))
      .rejects.toThrow(ForbiddenError);
  });
});

describe('project.service.updateProject', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects version mismatch with ConflictError', async () => {
    (prisma.project.findFirst as any).mockResolvedValue(mockProject);
    await expect(
      service.updateProject('p1', { version: 99, name: 'New' }, federalScope, 'o1', 'u1', ctx)
    ).rejects.toThrow(ConflictError);
  });

  it('updates with matching version', async () => {
    (prisma.project.findFirst as any).mockResolvedValue(mockProject);
    (prisma.project.update as any).mockResolvedValue({ ...mockProject, name: 'Updated', version: 2 });

    const result = await service.updateProject(
      'p1',
      { version: 1, name: 'Updated' },
      federalScope,
      'o1',
      'u1',
      ctx
    );
    expect(result.name).toBe('Updated');
    expect(result.version).toBe(2);
  });
});

describe('project.service.advanceStage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('advances to the next stage', async () => {
    (prisma.project.findFirst as any).mockResolvedValue(mockProject);
    (prisma.project.update as any).mockResolvedValue({ ...mockProject, status: 'PROFILE' });

    const result = await service.advanceStage(
      'p1',
      { targetStage: 'PROFILE', checklist: { identification_complete: true } },
      federalScope,
      'o1',
      'u1',
      ctx
    );
    expect(result.newStatus).toBe('PROFILE');
    expect(result.previousStatus).toBe('IDEA');
  });

  it('rejects skipping stages', async () => {
    (prisma.project.findFirst as any).mockResolvedValue(mockProject);
    await expect(
      service.advanceStage(
        'p1',
        { targetStage: 'FEASIBILITY', checklist: {} },
        federalScope,
        'o1',
        'u1',
        ctx
      )
    ).rejects.toThrow(BadRequestError);
  });

  it('rejects going backwards', async () => {
    (prisma.project.findFirst as any).mockResolvedValue({
      ...mockProject,
      status: 'APPROVED'
    });
    await expect(
      service.advanceStage(
        'p1',
        { targetStage: 'IDEA', checklist: {} },
        federalScope,
        'o1',
        'u1',
        ctx
      )
    ).rejects.toThrow(BadRequestError);
  });
});