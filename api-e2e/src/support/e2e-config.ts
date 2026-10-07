export const E2E_HOST = '127.0.0.1';
export const E2E_PORT = 3101;

const e2eDatabaseUrl = process.env['E2E_DATABASE_URL'];

if (!e2eDatabaseUrl) {
  throw new Error(
    'E2E_DATABASE_URL is required. Copy .env.example to .env first.',
  );
}

export const E2E_DATABASE_URL = e2eDatabaseUrl;
