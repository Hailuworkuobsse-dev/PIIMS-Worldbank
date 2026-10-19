import net from 'node:net';

/**
 * Returns true when a TCP connection to the test database (parsed from
 * DATABASE_URL) succeeds quickly. Integration/e2e suites use this to skip
 * themselves in environments without a database (e.g. CI verification runs).
 */
export async function isDatabaseAvailable(): Promise<boolean> {
  const url = process.env.DATABASE_URL ?? '';
  const m = url.match(/@([^:/?]+):(\d+)/);
  if (!m) return false;
  const host = m[1]!;
  const port = Number(m[2]);
  if (!Number.isFinite(port)) return false;
  return new Promise<boolean>((resolve) => {
    const socket = net.connect({ host, port });
    const done = (result: boolean): void => {
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(750);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
  });
}
