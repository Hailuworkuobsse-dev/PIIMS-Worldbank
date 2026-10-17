import { z } from "zod";
import { DOC_TYPES, ACCESS_LEVELS } from "./document.types";

export const MAX_FILE_SIZE_MB = 25;
const ACCEPTED_MIMES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
  "application/zip",
];

export const documentUploadSchema = z.object({
  projectId: z.string().uuid().optional().or(z.literal("")),
  docType: z.enum(DOC_TYPES),
  title: z.string().trim().min(3, "Title is required").max(300),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  accessLevel: z.enum(ACCESS_LEVELS).default("INTERNAL"),
  tags: z.array(z.string()).optional(),
});
export type DocumentUploadFormData = z.infer<typeof documentUploadSchema>;

export function validateFile(file: File): string | null {
  if (file.size / 1024 / 1024 > MAX_FILE_SIZE_MB)
    return `File exceeds ${MAX_FILE_SIZE_MB} MB`;
  if (!ACCEPTED_MIMES.includes(file.type))
    return `Unsupported file type: ${file.type || "unknown"}`;
  return null;
}