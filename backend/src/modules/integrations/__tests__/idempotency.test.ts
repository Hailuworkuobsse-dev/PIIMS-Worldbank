import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getIdempotencyKey,
  saveIdempotencyKey,
  checkAndSetIdempotency
} from "../utils/idempotency.js";
import { redis } from "@/config/redis.js";

vi.mock("@/config/redis.js", () => ({
  redis: { get: vi.fn(), set: vi.fn() }
}));

describe("integration idempotency", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null when key is missing", async () => {
    (redis.get as any).mockResolvedValue(null);
    const result = await getIdempotencyKey("FMIS", "ref-1");
    expect(result).toBeNull();
  });

  it("returns parsed value when key exists", async () => {
    (redis.get as any).mockResolvedValue(JSON.stringify({ ok: true, id: 42 }));
    const result = await getIdempotencyKey<any>("FMIS", "ref-1");
    expect(result).toEqual({ ok: true, id: 42 });
  });

  it("saves value with TTL", async () => {
    (redis.set as any).mockResolvedValue("OK");
    await saveIdempotencyKey("FMIS", "ref-1", { x: 1 });
    expect(redis.set).toHaveBeenCalledWith(
      expect.stringContaining("FMIS"),
      expect.any(String),
      "EX",
      expect.any(Number)
    );
  });

  it("fails silently when Redis is down", async () => {
    (redis.set as any).mockRejectedValue(new Error("Redis down"));
    await expect(saveIdempotencyKey("FMIS", "ref-1", {})).resolves.toBeUndefined();
  });

  it("checkAndSetIdempotency caches first call result", async () => {
    (redis.get as any).mockResolvedValue(null);
    (redis.set as any).mockResolvedValue("OK");

    let executions = 0;
    const executor = async () => {
      executions++;
      return { result: "computed" };
    };

    const first = await checkAndSetIdempotency("FMIS", "ref-1", executor);
    expect(first).toEqual({ result: "computed" });
    expect(executions).toBe(1);

    (redis.get as any).mockResolvedValue(JSON.stringify({ result: "computed" }));
    const second = await checkAndSetIdempotency("FMIS", "ref-1", executor);
    expect(second).toEqual({ result: "computed" });
    expect(executions).toBe(1); // not called again
  });
});
