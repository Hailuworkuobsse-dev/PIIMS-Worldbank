# PIIMS Backend

**Project Inception Information Management System** — Node.js backend for the World Bank–financed project management system of the Ministry of Water and Energy, Ethiopia.

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 LTS |
| Framework | Express 4 |
| Language | TypeScript 5 (strict) |
| Database | MySQL 8.4 (port **3307** in development) |
| ORM | Prisma 5 |
| Cache | Redis 7 |
| Queue | BullMQ |
| Storage | S3-compatible (MinIO for dev) |
| Auth | JWT + TOTP MFA + Argon2id |
| Validation | Zod |
| Logging | Pino |
| Tests | Vitest + Supertest |

## Quick Start

### Prerequisites
- Node.js 20.11+ (`nvm use`)
- Docker & Docker Compose

### 1. Start infrastructure
