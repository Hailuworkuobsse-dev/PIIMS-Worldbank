import { describe, it, expect } from 'vitest';
import { submitDeliverySchema, uploadInvoiceSchema } from '../supplier.schemas.js';

describe('submitDeliverySchema', () => {
  it('accepts a valid delivery', () => {
    expect(
      submitDeliverySchema.safeParse({
        contractId: '00000000-0000-4000-8000-000000000001',
        productName: 'Solar Home System 100W',
        serialNo: 'SN-2026-000123',
        quantity: 1,
        installDate: '2026-10-15',
        warrantyMonths: 24
      }).success
    ).toBe(true);
  });

  it('rejects zero quantity', () => {
    expect(
      submitDeliverySchema.safeParse({
        contractId: '00000000-0000-4000-8000-000000000001',
        productName: 'X', serialNo: 'SN-1', quantity: 0, installDate: '2026-10-15'
      }).success
    ).toBe(false);
  });
});

describe('uploadInvoiceSchema', () => {
  it('accepts a valid invoice', () => {
    expect(
      uploadInvoiceSchema.safeParse({
        contractId: '00000000-0000-4000-8000-000000000001',
        invoiceNo: 'INV-2026-001',
        amount: '150000.00',
        currency: 'ETB'
      }).success
    ).toBe(true);
  });

  it('rejects invalid amount', () => {
    expect(
      uploadInvoiceSchema.safeParse({
        contractId: '00000000-0000-4000-8000-000000000001',
        invoiceNo: 'INV-001', amount: 'abc', currency: 'ETB'
      }).success
    ).toBe(false);
  });
});