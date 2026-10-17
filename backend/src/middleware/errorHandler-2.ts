  // ── Multer upload errors ───────────────────────────────────────
  if (err instanceof Error && err.name === 'MulterError') {
    const code = (err as { code?: string }).code;
    const message =
      code === 'LIMIT_FILE_SIZE'
        ? `File exceeds the maximum size of 25 MB`
        : code === 'LIMIT_FILE_COUNT'
          ? 'Only one file may be uploaded per request'
          : err.message;
    sendError(
      res,
      422,
      'https://api.piims.gov.et/errors/upload',
      'Upload Failed',
      message
    );
    logger.warn({ correlationId, code }, 'upload error');
    return;
  }