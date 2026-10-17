import { beforeEach, describe, expect, it, vi } from "vitest";

const { put } = vi.hoisted(() => ({ put: vi.fn() }));

vi.mock("@/lib/api/client", () => ({ api: { put } }));

import { projectApi } from "../project.api";

describe("projectApi.update", () => {
  beforeEach(() => {
    put.mockResolvedValue({ data: { data: {} } });
  });

  it("sends the optimistic-lock version in the request body", async () => {
    await projectApi.update("project-1", { name: "Updated project" }, 3);

    expect(put).toHaveBeenCalledWith("/projects/project-1", {
      name: "Updated project",
      version: 3,
    });
  });
});