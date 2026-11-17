import { PrismaClient } from '@prisma/client';
import type { Page } from '@playwright/test';

async function createPrismaClient(): Promise<PrismaClient> {
  const databaseUrl = process.env['E2E_DATABASE_URL'];
  if (!databaseUrl) {
    throw new Error('E2E_DATABASE_URL is required to run dashboard E2E tests.');
  }

  return new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });
}

export async function withPrisma<T>(
  run: (prisma: PrismaClient) => Promise<T>,
  cleanup: (prisma: PrismaClient) => Promise<unknown>,
): Promise<T> {
  const prisma = await createPrismaClient();

  try {
    return await run(prisma);
  } finally {
    try {
      await cleanup(prisma);
    } finally {
      await prisma.$disconnect();
    }
  }
}

export async function installApiRoute(page: Page): Promise<void> {
  await page.route('http://localhost:3000/api/v1/**', (route) => {
    const apiUrl = new URL(route.request().url());
    apiUrl.hostname = '127.0.0.1';
    apiUrl.port = '3101';
    return route.continue({ url: apiUrl.toString() });
  });
}
