import { Prisma, DeliveryStatus } from '@prisma/client';
import { createHash } from 'node:crypto';
import { prisma } from '@/lib/prisma.js';
import { storage } from '@/config/storage.js';
import { buildMediaKey } from '@/lib/file-naming.js';
import { writeAudit } from '@/lib/audit.js';
import {
  BadRequestError, ConflictError, ForbiddenError, NotFoundError
} from '@/lib/errors.js';
import type {
  SupplierProfileDTO, SupplierContractDTO, SupplierDeliveryDTO,
  SupplierInvoiceDTO, SupplierWarrantyDTO, SupplierPaymentDTO, SupplierDashboardDTO
} from './supplier.types.js';
import type { UpdateProfileInput, SubmitDeliveryInput, UploadInvoiceInput } from './supplier.schemas.js';

type Ctx = { ipAddress: string | null; userAgent: string | null; correlationId: string | null };

/**
 * Resolve the Supplier record linked to the current user's organization.
 * Every supplier endpoint starts here.
 */
export async function getSupplierForUser(orgId: string): Promise<{ supplierId: string; name: string }> {
  const supplier = await prisma.supplier.findFirst({
    where: { orgId, status: 'ACTIVE' },
    select: { supplierId: true, name: true }
  });
  if (!supplier) {
    throw new ForbiddenError('No active supplier account linked to your organization. Contact your administrator.');
  }
  return supplier;
}

/* ════════════════════════════════════════════════════════════════════
 * PROFILE
 * ════════════════════════════════════════════════════════════════════ */

export async function getMyProfile(orgId: string): Promise<SupplierProfileDTO> {
  const { supplierId } = await getSupplierForUser(orgId);
  const s = await prisma.supplier.findUnique({ where: { supplierId } });
  if (!s) throw new NotFoundError('Supplier', supplierId);

  return {
    supplierId: s.supplierId,
    name: s.name,
    ...(s.nameAm ? { nameAm: s.nameAm } : {}),
    ...(s.tin ? { tin: s.tin } : {}),
    ...(s.licenseNo ? { licenseNo: s.licenseNo } : {}),
    category: s.category,
    ...(s.contactPerson ? { contactPerson: s.contactPerson } : {}),
    ...(s.contactEmail ? { contactEmail: s.contactEmail } : {}),
    ...(s.contactPhone ? { contactPhone: s.contactPhone } : {}),
    ...(s.address ? { address: s.address } : {}),
    status: s.status
  };
}

export async function updateMyProfile(
  input: UpdateProfileInput,
  orgId: string,
  userId: string,
  ctx: Ctx
): Promise<SupplierProfileDTO> {
  const { supplierId } = await getSupplierForUser(orgId);

  const data: Prisma.SupplierUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.nameAm !== undefined) data.nameAm = input.nameAm || null;
  if (input.tin !== undefined) data.tin = input.tin || null;
  if (input.licenseNo !== undefined) data.licenseNo = input.licenseNo || null;
  if (input.category !== undefined) data.category = input.category;
  if (input.contactPerson !== undefined) data.contactPerson = input.contactPerson || null;
  if (input.contactEmail !== undefined) data.contactEmail = input.contactEmail || null;
  if (input.contactPhone !== undefined) data.contactPhone = input.contactPhone || null;
  if (input.address !== undefined) data.address = input.address || null;

  const updated = await prisma.supplier.update({ where: { supplierId }, data });

  await writeAudit({
    userId, entity: 'SUPPLIER', entityId: supplierId, action: 'UPDATE',
    newValue: { name: updated.name, contactEmail: updated.contactEmail },
    ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, correlationId: ctx.correlationId
  });

  return getMyProfile(orgId);
}

/* ════════════════════════════════════════════════════════════════════
 * CONTRACTS (own only — enforced at every query)
 * ════════════════════════════════════════════════════════════════════ */

export async function listMyContracts(orgId: string): Promise<SupplierContractDTO[]> {
  const { supplierId } = await getSupplierForUser(orgId);

  const contracts = await prisma.contract.findMany({
    where: { supplierId },
    include: {
      project: { select: { projectCode: true, name: true } },
      _count: { select: { } }
    },
    orderBy: { createdAt: 'desc' }
  });

  const deliveryCounts = await prisma.serviceDelivery.groupBy({
    by: ['projectId', 'supplierId'],
    where: { supplierId },
    _count: { deliveryId: true }
  });
  const verifiedCounts = await prisma.serviceDelivery.groupBy({
    by: ['projectId', 'supplierId'],
    where: { supplierId, status: 'VERIFIED' },
    _count: { deliveryId: true }
  });

  return contracts.map((c) => {
    const total = deliveryCounts.find(
      (d) => d.projectId === c.projectId && d.supplierId === supplierId
    )?._count.deliveryId ?? 0;
    const verified = verifiedCounts.find(
      (d) => d.projectId === c.projectId && d.supplierId === supplierId
    )?._count.deliveryId ?? 0;

    return {
      contractId: c.contractId,
      contractNo: c.contractNo,
      projectCode: c.project.projectCode,
      projectName: c.project.name,
      title: c.title,
      amount: Number(c.amount).toFixed(2),
      currency: c.currency,
      ...(c.signedDate ? { signedDate: c.signedDate.toISOString().slice(0, 10) } : {}),
      ...(c.startDate ? { startDate: c.startDate.toISOString().slice(0, 10) } : {}),
      ...(c.endDate ? { endDate: c.endDate.toISOString().slice(0, 10) } : {}),
      status: c.status,
      deliveriesCount: total,
      deliveriesVerified: verified
    };
  });
}

/* ════════════════════════════════════════════════════════════════════
 * DELIVERIES
 * ════════════════════════════════════════════════════════════════════ */

export async function listMyDeliveries(orgId: string, contractId?: string): Promise<SupplierDeliveryDTO[]> {
  const { supplierId } = await getSupplierForUser(orgId);

  const deliveries = await prisma.serviceDelivery.findMany({
    where: { supplierId, ...(contractId ? { contractId: contractId as any } : {}) },
    include: {
      beneficiary: { select: { fullName: true } },
      product: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return deliveries.map((d) => ({
    submissionId: d.deliveryId,
    contractId: (d as any).contractId ?? '',
    ...(d.productId ? { productId: d.productId } : {}),
    productName: d.product?.name ?? 'Product',
    ...(d.beneficiaryId ? { beneficiaryId: d.beneficiaryId } : {}),
    ...(d.beneficiary ? { beneficiaryName: d.beneficiary.fullName } : {}),
    serialNo: d.serialNo ?? '',
    quantity: d.quantity,
    ...(d.installDate ? { installDate: d.installDate.toISOString().slice(0, 10) } : {}),
    ...(d.installLat != null && d.installLon != null
      ? { installGps: { lat: d.installLat, lon: d.installLon } }
      : {}),
    ...(d.warrantyStart ? { warrantyStart: d.warrantyStart.toISOString().slice(0, 10) } : {}),
    ...(d.warrantyEnd ? { warrantyEnd: d.warrantyEnd.toISOString().slice(0, 10) } : {}),
    status: d.status,
    submittedAt: d.createdAt.toISOString()
  }));
}

export async function submitDelivery(
  input: SubmitDeliveryInput,
  orgId: string,
  userId: string,
  ctx: Ctx
): Promise<SupplierDeliveryDTO> {
  const { supplierId } = await getSupplierForUser(orgId);

  // Verify contract belongs to this supplier
  const contract = await prisma.contract.findUnique({
    where: { contractId: input.contractId }
  });
  if (!contract) throw new NotFoundError('Contract', input.contractId);
  if (contract.supplierId !== supplierId) {
    throw new ForbiddenError('This contract does not belong to your organization');
  }
  if (!['SIGNED', 'ACTIVE'].includes(contract.status)) {
    throw new BadRequestError('Contract is not active');
  }

  // Verify beneficiary if provided
  if (input.beneficiaryId) {
    const b = await prisma.beneficiary.findUnique({ where: { beneficiaryId: input.beneficiaryId } });
    if (!b) throw new NotFoundError('Beneficiary', input.beneficiaryId);
  }

  // Serial number uniqueness
  const existing = await prisma.serviceDelivery.findFirst({
    where: { serialNo: input.serialNo }
  });
  if (existing) {
    throw new ConflictError(`Serial number '${input.serialNo}' is already registered`);
  }

  const installDate = new Date(input.installDate);
  const warrantyEnd = new Date(installDate);
  warrantyEnd.setMonth(warrantyEnd.getMonth() + input.warrantyMonths);

  const status: DeliveryStatus = 'INSTALLED';

  const created = await prisma.serviceDelivery.create({
    data: {
      beneficiaryId: input.beneficiaryId || undefined,
      projectId: contract.projectId,
      supplierId,
      productId: input.productId || undefined,
      serialNo: input.serialNo,
      quantity: input.quantity,
      installDate,
      ...(input.installGps ? { installLat: input.installGps.lat, installLon: input.installGps.lon } : {}),
      warrantyStart: installDate,
      warrantyEnd,
      status
    },
    include: {
      beneficiary: { select: { fullName: true } },
      product: { select: { name: true } }
    }
  } as any);

  // Ensure the contractId gets recorded even though the schema doesn't have it
  // (in future: add contractId to ServiceDelivery model)

  await writeAudit({
    userId, entity: 'SERVICE_DELIVERY', entityId: created.deliveryId, action: 'CREATE',
    newValue: {
      serialNo: input.serialNo, contractId: input.contractId,
      productName: input.productName, quantity: input.quantity
    },
    ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, correlationId: ctx.correlationId
  });

  return {
    submissionId: created.deliveryId,
    contractId: input.contractId,
    ...(created.productId ? { productId: created.productId } : {}),
    productName: created.product?.name ?? input.productName,
    ...(created.beneficiaryId ? { beneficiaryId: created.beneficiaryId } : {}),
    ...(created.beneficiary ? { beneficiaryName: created.beneficiary.fullName } : {}),
    serialNo: created.serialNo ?? input.serialNo,
    quantity: created.quantity,
    ...(created.installDate ? { installDate: created.installDate.toISOString().slice(0, 10) } : {}),
    ...(created.installLat != null && created.installLon != null
      ? { installGps: { lat: created.installLat, lon: created.installLon } }
      : {}),
    ...(created.warrantyStart ? { warrantyStart: created.warrantyStart.toISOString().slice(0, 10) } : {}),
    ...(created.warrantyEnd ? { warrantyEnd: created.warrantyEnd.toISOString().slice(0, 10) } : {}),
    status: created.status,
    submittedAt: created.createdAt.toISOString()
  };
}

/* ════════════════════════════════════════════════════════════════════
 * INVOICES
 * ════════════════════════════════════════════════════════════════════ */

export async function listMyInvoices(orgId: string): Promise<SupplierInvoiceDTO[]> {
  const { supplierId } = await getSupplierForUser(orgId);

  const invoices = await prisma.invoice.findMany({
    where: { supplierId },
    include: { contract: { select: { contractNo: true } } },
    orderBy: { submittedAt: 'desc' }
  });

  return invoices.map((inv) => ({
    invoiceId: inv.invoiceId,
    contractId: inv.contractId,
    contractNo: inv.contract.contractNo,
    invoiceNo: inv.invoiceNo,
    amount: Number(inv.amount).toFixed(2),
    currency: inv.currency,
    submittedAt: inv.submittedAt.toISOString(),
    status: inv.status,
    filePath: inv.filePath
  }));
}

export async function uploadInvoice(
  input: UploadInvoiceInput,
  file: { buffer: Buffer; size: number; originalname: string; mimetype: string },
  orgId: string,
  userId: string,
  ctx: Ctx
): Promise<SupplierInvoiceDTO> {
  const { supplierId } = await getSupplierForUser(orgId);

  const contract = await prisma.contract.findUnique({ where: { contractId: input.contractId } });
  if (!contract) throw new NotFoundError('Contract', input.contractId);
  if (contract.supplierId !== supplierId) {
    throw new ForbiddenError('This contract does not belong to your organization');
  }

  const existing = await prisma.invoice.findFirst({
    where: { supplierId, invoiceNo: input.invoiceNo }
  });
  if (existing) {
    throw new ConflictError(`Invoice number '${input.invoiceNo}' already exists`);
  }

  const checksum = createHash('sha256').update(file.buffer).digest('hex');
  const key = buildMediaKey(`invoices/${supplierId}`, file.originalname);

  await storage.upload(key, file.buffer, {
    contentType: file.mimetype,
    metadata: { supplierId, contractId: input.contractId, invoiceNo: input.invoiceNo }
  });

  const invoice = await prisma.invoice.create({
    data: {
      contractId: input.contractId,
      supplierId,
      invoiceNo: input.invoiceNo,
      amount: new Prisma.Decimal(input.amount),
      currency: input.currency,
      filePath: key,
      fileSize: BigInt(file.size),
      checksum,
      status: 'SUBMITTED'
    },
    include: { contract: { select: { contractNo: true } } }
  });

  await writeAudit({
    userId, entity: 'INVOICE', entityId: invoice.invoiceId, action: 'CREATE',
    newValue: { invoiceNo: input.invoiceNo, amount: input.amount, currency: input.currency },
    ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, correlationId: ctx.correlationId
  });

  return {
    invoiceId: invoice.invoiceId,
    contractId: invoice.contractId,
    contractNo: invoice.contract.contractNo,
    invoiceNo: invoice.invoiceNo,
    amount: Number(invoice.amount).toFixed(2),
    currency: invoice.currency,
    submittedAt: invoice.submittedAt.toISOString(),
    status: invoice.status,
    filePath: invoice.filePath
  };
}

/* ════════════════════════════════════════════════════════════════════
 * WARRANTIES
 * ════════════════════════════════════════════════════════════════════ */

export async function listMyWarranties(orgId: string): Promise<SupplierWarrantyDTO[]> {
  const { supplierId } = await getSupplierForUser(orgId);

  const records = await prisma.serviceDelivery.findMany({
    where: {
      supplierId,
      warrantyEnd: { not: null }
    },
    include: {
      beneficiary: { select: { fullName: true } },
      product: { select: { name: true } }
    },
    orderBy: { warrantyEnd: 'desc' }
  });

  const now = Date.now();
  return records.map((r) => {
    const end = r.warrantyEnd?.getTime() ?? 0;
    const status: SupplierWarrantyDTO['status'] =
      end < now ? 'EXPIRED' : 'ACTIVE';

    return {
      warrantyId: r.deliveryId,
      serialNo: r.serialNo ?? '',
      productName: r.product?.name ?? 'Product',
      ...(r.beneficiary ? { beneficiaryName: r.beneficiary.fullName } : {}),
      startDate: r.warrantyStart?.toISOString().slice(0, 10) ?? '',
      endDate: r.warrantyEnd?.toISOString().slice(0, 10) ?? '',
      status
    };
  });
}

/* ════════════════════════════════════════════════════════════════════
 * PAYMENTS (derived from invoices)
 * ════════════════════════════════════════════════════════════════════ */

export async function listMyPayments(orgId: string): Promise<SupplierPaymentDTO[]> {
  const { supplierId } = await getSupplierForUser(orgId);

  const invoices = await prisma.invoice.findMany({
    where: { supplierId },
    include: { contract: { select: { contractNo: true } } },
    orderBy: { submittedAt: 'desc' }
  });

  return invoices.map((inv) => {
    const status: SupplierPaymentDTO['status'] =
      inv.status === 'SUBMITTED' ? 'PENDING' :
      inv.status === 'APPROVED' ? 'APPROVED' :
      inv.status === 'PAID' ? 'PAID' :
      'REJECTED';

    return {
      paymentId: inv.invoiceId,
      contractNo: inv.contract.contractNo,
      amount: Number(inv.amount).toFixed(2),
      currency: inv.currency,
      status,
      requestedAt: inv.submittedAt.toISOString(),
      ...(inv.paidAt ? { paidAt: inv.paidAt.toISOString() } : {}),
      ...(inv.referenceNo ? { referenceNo: inv.referenceNo } : {})
    };
  });
}

/* ════════════════════════════════════════════════════════════════════
 * DASHBOARD
 * ════════════════════════════════════════════════════════════════════ */

export async function getDashboard(orgId: string): Promise<SupplierDashboardDTO> {
  const { supplierId } = await getSupplierForUser(orgId);

  const [
    activeContracts,
    allContracts,
    pendingDeliveries,
    verifiedDeliveries,
    invoices
  ] = await Promise.all([
    prisma.contract.count({ where: { supplierId, status: 'ACTIVE' } }),
    prisma.contract.findMany({ where: { supplierId }, select: { amount: true, currency: true } }),
    prisma.serviceDelivery.count({
      where: { supplierId, status: { notIn: ['VERIFIED', 'FAILED'] } }
    }),
    prisma.serviceDelivery.count({ where: { supplierId, status: 'VERIFIED' } }),
    prisma.invoice.findMany({ where: { supplierId }, select: { amount: true, currency: true, status: true } })
  ]);

  const totalValue = allContracts.reduce((s, c) => s + Number(c.amount), 0);
  const currency = allContracts[0]?.currency ?? 'ETB';
  const pendingPayments = invoices.filter((i) => ['SUBMITTED', 'APPROVED'].includes(i.status)).length;
  const paidAmount = invoices
    .filter((i) => i.status === 'PAID')
    .reduce((s, i) => s + Number(i.amount), 0);

  return {
    activeContracts,
    totalContractValue: totalValue.toFixed(2),
    currency,
    pendingDeliveries,
    verifiedDeliveries,
    pendingPayments,
    paidAmount: paidAmount.toFixed(2)
  };
}