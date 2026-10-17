import { describe, it, expect, beforeAll } from "vitest";
import { writeAudit, verifyAuditChain } from "../audit.js";
import { prisma } from "../prisma.js";

describe("audit log", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  it("writes an audit entry", async () => {
    const before = await prisma.auditLog.count({ where: { entity: "TEST_AUDIT_ENTITY" } });

    await writeAudit({
      entity: "TEST_AUDIT_ENTITY",
      entityId: "00000000-0000-4000-8000-000000000001",
      action: "CREATE",
      newValue: { test: "value", timestamp: Date.now() }
    });

    const after = await prisma.auditLog.count({ where: { entity: "TEST_AUDIT_ENTITY" } });
    expect(after).toBe(before + 1);
  });

  it("chains records with prevHash", async () => {
    const entries = await prisma.auditLog.findMany({
      where: { entity: "TEST_AUDIT_ENTITY" },
      orderBy: { logId: "desc" },
      take: 2
    });

    if (entries.length >= 2) {
      expect(entries[0]!.prevHash).toBe(entries[1]!.recordHash);
    }
  });

  it("verifyAuditChain returns valid for intact chain", async () => {
    const result = await verifyAuditChain();
    expect(result.valid).toBe(true);
  });
});
