/**
 * Ambient declarations for Node.js globals that TypeScript strict mode
 * sometimes complains about, plus project-specific augmentations.
 */

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly NODE_ENV?: "development" | "test" | "staging" | "production";
      readonly DATABASE_URL?: string;
      readonly REDIS_URL?: string;
      readonly JWT_SECRET?: string;
      readonly JWT_REFRESH_SECRET?: string;
    }
  }
}

export {};
