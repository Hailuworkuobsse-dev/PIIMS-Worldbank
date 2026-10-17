import { describe, it, expect } from "vitest";
import { requireUploadedFile, MAX_UPLOAD_BYTES } from "../upload.js";
import { BadRequestError } from "../errors.js";

describe("requireUploadedFile", () => {
  it("throws BadRequestError when no file is present", () => {
    expect(() => requireUploadedFile({})).toThrow(BadRequestError);
  });

  it("throws when file is empty", () => {
    expect(() =>
      requireUploadedFile({
        file: {
          buffer: Buffer.alloc(0),
          size: 0,
          originalname: "empty.pdf",
          mimetype: "application/pdf"
        }
      })
    ).toThrow(/empty/i);
  });

  it("returns the file when valid", () => {
    const file = {
      buffer: Buffer.from("hello"),
      size: 5,
      originalname: "test.pdf",
      mimetype: "application/pdf"
    };
    const result = requireUploadedFile({ file });
    expect(result).toBe(file);
  });

  it("exposes MAX_UPLOAD_BYTES = 25 MB", () => {
    expect(MAX_UPLOAD_BYTES).toBe(25 * 1024 * 1024);
  });
});
