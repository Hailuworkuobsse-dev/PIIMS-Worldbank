
This:
- Applies all pending migrations
- Does NOT prompt
- Does NOT reset the DB
- Does NOT generate new migrations

Usually run automatically by the Docker entrypoint before `node dist/main.js`.

## How the Migration Runs in Docker

The `docker-compose.yml` overrides the backend command:
