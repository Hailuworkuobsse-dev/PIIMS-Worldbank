import { describe, it, expect } from "vitest";
import { documentUploadSchema, validateFile } from "../document.schema";

describe("documentUploadSchema", () => {
  it("accepts valid upload", () => {
    const r = documentUploadSchema.safeParse({
      projectId: "",
      docType: "REPORT",
      title: "Q3 Financial Report",
      accessLevel: "INTERNAL",
    });
    expect(r.success).toBe(true);
  });

  it("rejects short title", () => {
    const r = documentUploadSchema.safeParse({
      docType: "REPORT",
      title: "Q3",
      accessLevel: "INTERNAL",
    });
    expect(r.success).toBe(false);
  });
});

describe("validateFile", () => {
  it("rejects file over 25 MB", () => {
    const f = new File([new Uint8Array(26 * 1024 * 1024)], "big.pdf", {
      type: "application/pdf",
    });
    expect(validateFile(f)).toMatch(/exceeds/);
  });

  it("rejects unknown MIME", () => {
    const f = new File([new Uint8Array(100)], "x.bin", {
      type: "application/octet-stream",
    });
    expect(validateFile(f)).toMatch(/Unsupported/);
  });

  it("accepts valid PDF", () => {
    const f = new File([new Uint8Array(100)], "x.pdf", {
      type: "application/pdf",
    });
    expect(validateFile(f)).toBeNull();
  });
});