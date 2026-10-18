/**
 * Ambient declarations for Node.js globals that TypeScript strict mode
 * sometimes complains about, plus project-specific augmentations.
 */

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: "development" | "test" | "staging" | "production";
      DATABASE_URL?: string;
      JWT_SECRET?: string;
      JWT_REFRESH_SECRET?: string;
    }
  }
}

export {};
