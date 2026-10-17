import { describe, it, expect } from "vitest";
import { deliveryFormSchema, supplierProfileSchema } from "../supplier.schema";

describe("deliveryFormSchema", () => {
  it("accepts a valid delivery", () => {
    const r = deliveryFormSchema.safeParse({
      contractId: "00000000-0000-0000-0000-000000000001",
      productId: "",
      productName: "Solar Home System 100W",
      beneficiaryId: "",
      serialNo: "SN-2026-000123",
      quantity: 1,
      installDate: "2026-10-15",
      warrantyMonths: 24,
    });
    expect(r.success).toBe(true);
  });

  it("rejects zero quantity", () => {
    const r = deliveryFormSchema.safeParse({
      contractId: "00000000-0000-0000-0000-000000000001",
      productName: "X",
      serialNo: "SN-1",
      quantity: 0,
      installDate: "2026-10-15",
      warrantyMonths: 12,
    });
    expect(r.success).toBe(false);
  });
});

describe("supplierProfileSchema", () => {
  it("rejects invalid email", () => {
    const r = supplierProfileSchema.safeParse({
      name: "Test",
      tin: "12345",
      licenseNo: "LIC1",
      category: "INSTALLER",
      contactPerson: "John",
      contactEmail: "not-an-email",
      contactPhone: "+251911234567",
      address: "Addis",
    });
    expect(r.success).toBe(false);
  });
});