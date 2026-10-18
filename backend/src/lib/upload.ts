import multer, { type FileFilterCallback } from 'multer';
import type { Request } from 'express';
import { BadRequestError } from './errors.js';

/**
 * In-memory upload — files are streamed straight to S3 from memory.
 * 25 MB limit matches the frontend's FileUpload component.
 */
const MAX_SIZE_BYTES = 25 * 1024 * 1024;

export const uploadSingle = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_SIZE_BYTES,
    files: 1
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/png',
      'image/jpeg',
      'image/webp',
      'application/zip'
    ];
    if (!allowed.includes(file.mimetype)) {
      cb(
        new BadRequestError(
          `Unsupported file type: ${file.mimetype}. Allowed: PDF, Word, Excel, images, ZIP.`
        )
      );
      return;
    }
    cb(null, true);
  }
}).single('file');

/**
 * Verify the uploaded file exists and matches the limits.
 * Call at the top of any handler that expects req.file.
 */
export function requireUploadedFile(req: {
  file?: { buffer: Buffer; size: number; originalname: string; mimetype: string };
}): { buffer: Buffer; size: number; originalname: string; mimetype: string } {
  if (!req.file) {
    throw new BadRequestError('No file uploaded. Use field name "file".');
  }
  if (req.file.size === 0) {
    throw new BadRequestError('Uploaded file is empty.');
  }
  if (req.file.size > MAX_SIZE_BYTES) {
    throw new BadRequestError(`File exceeds ${MAX_SIZE_BYTES / 1024 / 1024} MB limit.`);
  }
  return req.file;
}

export const MAX_UPLOAD_BYTES = MAX_SIZE_BYTES;