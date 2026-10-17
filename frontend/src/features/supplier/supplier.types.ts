export interface SupplierProfile {
  supplierId: string;
  name: string;
  nameAm?: string;
  tin: string;
  licenseNo: string;
  category: "MANUFACTURER" | "IMPORTER" | "INSTALLER" | "DISTRIBUTOR" | "OTHER";
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  status: "ACTIVE" | "INACTIVE" | "BLACKLISTED";
}

export interface SupplierContract {
  contractId: string;
  contractNo: string;
  projectCode: string;
  projectName: string;
  title: string;
  amount: string;
  currency: "ETB" | "USD" | "EUR";
  signedDate?: string;
  startDate?: string;
  endDate?: string;
  status: "DRAFT" | "SIGNED" | "ACTIVE" | "COMPLETED" | "TERMINATED";
  deliveriesCount: number;
  deliveriesVerified: number;
}

export interface DeliverySubmission {
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
  status: "SUBMITTED" | "VERIFIED" | "REJECTED";
  submittedAt: string;
}

export interface SupplierInvoice {
  invoiceId: string;
  contractId: string;
  contractNo: string;
  invoiceNo: string;
  amount: string;
  currency: "ETB" | "USD" | "EUR";
  submittedAt: string;
  status: "SUBMITTED" | "APPROVED" | "REJECTED" | "PAID";
  filePath: string;
}

export interface WarrantyRecord {
  warrantyId: string;
  serialNo: string;
  productName: string;
  beneficiaryName?: string;
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "EXPIRED" | "CLAIMED";
}

export interface PaymentStatus {
  paymentId: string;
  contractNo: string;
  amount: string;
  currency: "ETB" | "USD" | "EUR";
  status: "PENDING" | "APPROVED" | "PAID" | "REJECTED";
  requestedAt: string;
  paidAt?: string;
  referenceNo?: string;
}

export interface SupplierDashboard {
  activeContracts: number;
  totalContractValue: string;
  currency: "ETB";
  pendingDeliveries: number;
  verifiedDeliveries: number;
  pendingPayments: number;
  paidAmount: string;
}