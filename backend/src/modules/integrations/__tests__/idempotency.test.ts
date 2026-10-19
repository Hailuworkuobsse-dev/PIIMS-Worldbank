import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getIdempotencyKey,
  saveIdempotencyKey,
  checkAndSetIdempotency
} from "../utils/idempotency.js";
import { prisma } from "@/lib/prisma.js";

vi.mock("@/lib/prisma.js", () => ({
  prisma: {
    idempotencyKey: {
      findUnique: vi.fn(),
      upsert: vi.fn()
    }
  }
}));

describe("integration idempotency (mysql-backed)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null when key is missing", async () => {
    (prisma.idempotencyKey.findUnique as any).mockResolvedValue(null);
    const result = await getIdempotencyKey("FMIS", "ref-1");
    expect(result).toBeNull();
  });

  it("returns parsed value when key exists and not expired", async () => {
    (prisma.idempotencyKey.findUnique as any).mockResolvedValue({
      response: JSON.stringify({ ok: true, id: 42 }),
      expiresAt: new Date(Date.now() + 60_000)
    });
    const result = await getIdempotencyKey<any>("FMIS", "ref-1");
    expect(result).toEqual({ ok: true, id: 42 });
  });

  it("saves value with expiry", async () => {
    (prisma.idempotencyKey.upsert as any).mockResolvedValue(undefined);
    await saveIdempotencyKey("FMIS", "ref-1", { x: 1 });
    expect(prisma.idempotencyKey.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { key: expect.stringContaining("FMIS") },
        create: expect.objectContaining({
          response: expect.any(String),
          expiresAt: expect.any(Date)
        })
      })
    );
  });

  it("fails silently when the write fails", async () => {
    (prisma.idempotencyKey.upsert as any).mockRejectedValue(new Error("db down"));
    await expect(saveIdempotencyKey("FMIS", "ref-1", {})).resolves.toBeUndefined();
  });

  it("checkAndSetIdempotency caches first call result", async () => {
    (prisma.idempotencyKey.findUnique as any).mockResolvedValue(null);
    (prisma.idempotencyKey.upsert as any).mockResolvedValue(undefined);

    let executions = 0;
    const executor = async () => {
      executions++;
      return { result: "computed" };
    };

    const first = await checkAndSetIdempotency("FMIS", "ref-1", executor);
    expect(first).toEqual({ result: "computed" });
    expect(executions).toBe(1);

    (prisma.idempotencyKey.findUnique as any).mockResolvedValue({
      response: JSON.stringify({ result: "computed" }),
      expiresAt: new Date(Date.now() + 60_000)
    });
    const second = await checkAndSetIdempotency("FMIS", "ref-1", executor);
    expect(second).toEqual({ result: "computed" });
    expect(executions).toBe(1); // not called again
  });
});
