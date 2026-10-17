import type { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '@/lib/errors.js';
import { sendSuccess, sendCreated, sendNoContent } from '@/lib/response.js';
import * as projectService from './project.service.js';
import type {
  CreateProjectInput, UpdateProjectInput, StageAdvanceInput, ListProjectsQuery
} from './project.schemas.js';

function getContext(req: Request) {
  return {
    ipAddress: req.ip ?? null,
    userAgent: req.header('user-agent') ?? null,
    correlationId: (req.res?.locals?.correlationId as string | undefined) ?? null
  };
}

function getUser(req: Request) {
  if (!req.user) throw new UnauthorizedError();
  return req.user;
}

/* ════════════════════════════════════════════════════════════════════
 * GET /v1/projects
 * ════════════════════════════════════════════════════════════════════ */

export async function listHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = getUser(req);
    const query = (res.locals.query ?? req.query) as ListProjectsQuery;
    const result = await projectService.listProjects(
      query,
      user.scope,
      user.orgId,
      user.userId
    );
    sendSuccess(res, result.data, 200, result.pagination);
  } catch (err) {
    next(err);
  }
}

/* ════════════════════════════════════════════════════════════════════
 * GET /v1/projects/:idOrCode
 * ════════════════════════════════════════════════════════════════════ */

export async function getHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = getUser(req);
    const project = await projectService.getProjectByCodeOrId(
      req.params.idOrCode!,
      user.scope,
      user.orgId,
      user.userId
    );
    sendSuccess(res, project);
  } catch (err) {
    next(err);
  }
}

/* ════════════════════════════════════════════════════════════════════
 * POST /v1/projects
 * ════════════════════════════════════════════════════════════════════ */

export async function createHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = getUser(req);
    const input = req.body as CreateProjectInput;
    const project = await projectService.createProject(
      input,
      user.scope,
      user.orgId,
      user.userId,
      getContext(req)
    );
    sendCreated(res, project);
  } catch (err) {
    next(err);
  }
}

/* ════════════════════════════════════════════════════════════════════
 * PUT /v1/projects/:id
 * ════════════════════════════════════════════════════════════════════ */

export async function updateHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = getUser(req);
    const input = req.body as UpdateProjectInput;
    const project = await projectService.updateProject(
      req.params.id!,
      input,
      user.scope,
      user.orgId,
      user.userId,
      getContext(req)
    );
    sendSuccess(res, project);
  } catch (err) {
    next(err);
  }
}

/* ════════════════════════════════════════════════════════════════════
 * DELETE /v1/projects/:id
 * ════════════════════════════════════════════════════════════════════ */

export async function deleteHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = getUser(req);
    const version = Number(req.query.version);
    if (!version || !Number.isInteger(version)) {
      return next(
        Object.assign(new Error('version query parameter required'), { statusCode: 400 })
      );
    }
    await projectService.deleteProject(
      req.params.id!,
      version,
      user.scope,
      user.orgId,
      user.userId,
      getContext(req)
    );
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}

/* ════════════════════════════════════════════════════════════════════
 * POST /v1/projects/:id/advance
 * ════════════════════════════════════════════════════════════════════ */

export async function advanceHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = getUser(req);
    const input = req.body as StageAdvanceInput;
    const result = await projectService.advanceStage(
      req.params.id!,
      input,
      user.scope,
      user.orgId,
      user.userId,
      getContext(req)
    );
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

/* ════════════════════════════════════════════════════════════════════
 * GET /v1/pipeline
 * ════════════════════════════════════════════════════════════════════ */

export async function pipelineHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = getUser(req);
    const counts = await projectService.getPipelineCounts(
      user.scope,
      user.orgId,
      user.userId
    );
    sendSuccess(res, counts);
  } catch (err) {
    next(err);
  }
}