import { describe, it, expect, vi, beforeEach } from "vitest";
import * as notificationService from "../notification.service.js";
import { prisma } from "@/lib/prisma.js";
import { getQueue } from "@/config/queue.js";

vi.mock("@/lib/prisma.js", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    beneficiary: { findUnique: vi.fn() },
    notificationTemplate: { findUnique: vi.fn() },
    notification: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn()
    },
    systemSetting: { findUnique: vi.fn(), upsert: vi.fn() }
  }
}));

vi.mock("@/config/queue.js", () => ({
  getQueue: vi.fn(() => ({ add: vi.fn().mockResolvedValue(undefined) })),
  QUEUE_NAMES: { NOTIFY: "notify", REPORTS: "reports", SYNC: "sync", ANONYMIZE: "anonymize", IMPORT: "import" }
}));

describe("notification.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.notificationTemplate.findUnique as any).mockResolvedValue(null);
    (prisma.notification.create as any).mockResolvedValue({ notificationId: "n1" });
  });

  it("rejects unknown template code", async () => {
    await expect(
      notificationService.notify({
        recipients: { userIds: ["00000000-0000-4000-8000-000000000001"] },
        templateCode: "NONEXISTENT_TEMPLATE" as any,
        variables: {}
      })
    ).rejects.toThrow();
  });

  it("creates notifications for each user × channel", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ userId: "u1", locale: "en" });

    const result = await notificationService.notify({
      recipients: { userIds: ["u1"] },
      templateCode: "USER_INVITE",
      variables: {
        fullName: "Test User",
        username: "testuser",
        temporaryPassword: "Temp!Pass1",
        loginUrl: "https://piims.gov.et/login"
      }
    });

    expect(result.created).toBeGreaterThan(0);
    expect(prisma.notification.create).toHaveBeenCalled();
    expect(getQueue).toHaveBeenCalled();
  });

  it("respects Amharic locale for users with AM preference", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ userId: "u1", locale: "am" });

    await notificationService.notify({
      recipients: { userIds: ["u1"] },
      templateCode: "USER_INVITE",
      variables: {
        fullName: "Test",
        username: "test",
        temporaryPassword: "pass",
        loginUrl: "https://x"
      }
    });

    const createCall = (prisma.notification.create as any).mock.calls[0][0];
    expect(createCall.data.language).toBe("am");
  });
});
