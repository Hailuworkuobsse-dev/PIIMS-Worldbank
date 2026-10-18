import type { SupplierCategory, ContractStatus, DeliveryStatus } from '@prisma/client';

export interface SupplierProfileDTO {
  supplierId: string;
  name: string;
  nameAm?: string;
  tin?: string;
  licenseNo?: string;
  category: SupplierCategory;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  status: string;
}

export interface SupplierContractDTO {
  contractId: string;
  contractNo: string;
  projectCode: string;
  projectName: string;
  title: string;
  amount: string;
  currency: string;
  signedDate?: string;
  startDate?: string;
  endDate?: string;
  status: ContractStatus;
  deliveriesCount: number;
  deliveriesVerified: number;
}

export interface SupplierDeliveryDTO {
  submissionId: string;
  contractId: string;
  productId?: string;
  productName: string;
  beneficiaryId?: string;
  beneficiaryName?: string;
  serialNo: string;
  quantity: number;
  installDate?: string;
  installGps?: { lat: number; lon: number };
  warrantyStart?: string;
  warrantyEnd?: string;
  status: DeliveryStatus;
  submittedAt: string;
}

export interface SupplierInvoiceDTO {
  invoiceId: string;
  contractId: string;
  contractNo: string;
  invoiceNo: string;
  amount: string;
  currency: string;
  submittedAt: string;
  status: string;
  filePath: string;
}

export interface SupplierWarrantyDTO {
  warrantyId: string;
  serialNo: string;
  productName: string;
  beneficiaryName?: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CLAIMED';
}

export interface SupplierPaymentDTO {
  paymentId: string;
  contractNo: string;
  amount: string;
  currency: string;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';
  requestedAt: string;
  paidAt?: string;
  referenceNo?: string;
}

export interface SupplierDashboardDTO {
  activeContracts: number;
  totalContractValue: string;
  currency: string;
  pendingDeliveries: number;
  verifiedDeliveries: number;
  pendingPayments: number;
  paidAmount: string;
}