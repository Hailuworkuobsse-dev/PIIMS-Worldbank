declare global {
  namespace Express {
    interface Request {
      /** Correlation ID set by correlationId middleware */
      correlationId?: string;
      /** Authenticated user (populated in Step 3 by auth middleware) */
      user?: {
        userId: string;
        username: string;
        orgId: string;
        role: string;
        permissions: string[];
        scope: {
          orgLevel: string;
          regions?: string[];
          zones?: string[];
          woredas?: string[];
          kebeles?: string[];
          ownRecordsOnly?: boolean;
        };
      };
    }
  }
}

export {};