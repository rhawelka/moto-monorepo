import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { expect, test, type Page } from '@playwright/test';

const mockLocation = {
  label: 'Main Square, Krakow, Poland',
  latitude: 50.0614,
  longitude: 19.9366,
};

async function createPrismaClient(): Promise<PrismaClient> {
  const databaseUrl = process.env['E2E_DATABASE_URL'];
  if (!databaseUrl) {
    throw new Error('E2E_DATABASE_URL is required to run dashboard E2E tests.');
  }

  return new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });
}

async function installApiRoute(page: Page): Promise<void> {
  await page.route('http://localhost:3000/api/v1/**', (route) => {
    const apiUrl = new URL(route.request().url());
    apiUrl.hostname = '127.0.0.1';
    apiUrl.port = '3101';
    return route.continue({ url: apiUrl.toString() });
  });
}

async function installLocationSearchMock(page: Page): Promise<void> {
  await page.route('https://photon.komoot.io/api/**', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        features: [
          {
            geometry: {
              coordinates: [mockLocation.longitude, mockLocation.latitude],
            },
            properties: {
              name: 'Main Square',
              city: 'Krakow',
              country: 'Poland',
            },
          },
        ],
      }),
    }),
  );
}

async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email or username').fill('admin@test.pl');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard(?:\/|$)/);
}

async function selectMockLocation(page: Page): Promise<void> {
  await page.getByLabel('Location').fill('Main Square');
  await page
    .getByRole('option', { name: mockLocation.label })
    .getByRole('button')
    .click();
}

async function createIncidentRecord(
  prisma: PrismaClient,
  title: string,
  status: 'OPEN' | 'RESOLVED' = 'OPEN',
) {
  return prisma.incident.create({
    data: {
      title,
      description: 'A vehicle collision is blocking the eastbound lane.',
      location: 'Main Square, Krakow, Poland',
      latitude: mockLocation.latitude,
      longitude: mockLocation.longitude,
      status,
      severity: 'MEDIUM',
    },
  });
}

test.describe('dashboard-web incidents', () => {
  test('should create an incident and show it in the incident list', async ({
    page,
  }) => {
    const prisma = await createPrismaClient();
    const title = `e2e-incident-${randomUUID()}`;
    const incidentDetails = {
      title,
      description: 'A vehicle collision is blocking the eastbound lane.',
      location: mockLocation.label,
      latitude: mockLocation.latitude,
      longitude: mockLocation.longitude,
      status: 'OPEN',
      severity: 'HIGH',
    };

    try {
      await installApiRoute(page);
      await installLocationSearchMock(page);
      await loginAsAdmin(page);

      await page.goto('/dashboard/incidents');
      await page.getByRole('button', { name: 'Create incident' }).click();
      await page.getByLabel('Title').fill(title);
      await page.getByLabel('Description').fill(incidentDetails.description);
      await selectMockLocation(page);
      await page.getByLabel('Severity').selectOption(incidentDetails.severity);
      await page.getByLabel('Status').selectOption(incidentDetails.status);

      const createResponse = page.waitForResponse(
        (response) =>
          response.url().includes('/api/v1/incidents') &&
          response.request().method() === 'POST',
      );
      await page.getByRole('button', { name: 'Create incident' }).click();
      const response = await createResponse;
      expect(response.status()).toBe(201);
      await expect(page).toHaveURL(/\/dashboard\/incidents$/);
      await expect(
        page.getByRole('row').filter({ hasText: title }),
      ).toBeVisible();

      const createdIncident = await response.json();
      await expect
        .poll(async () => {
          const incident = await prisma.incident.findUnique({
            where: { id: createdIncident.id },
          });
          return (
            incident && {
              title: incident.title,
              description: incident.description,
              location: incident.location,
              latitude: incident.latitude,
              longitude: incident.longitude,
              status: incident.status,
              severity: incident.severity,
            }
          );
        })
        .toMatchObject(incidentDetails);
    } finally {
      try {
        await prisma.incident.deleteMany({ where: { title } });
      } finally {
        await prisma.$disconnect();
      }
    }
  });

  test('should prevent submitting an incident with invalid fields', async ({
    page,
  }) => {
    await installApiRoute(page);
    await installLocationSearchMock(page);
    await loginAsAdmin(page);
    await page.goto('/dashboard/incidents/new');

    let createRequestCount = 0;
    page.on('request', (request) => {
      if (
        request.url().includes('/api/v1/incidents') &&
        request.method() === 'POST'
      ) {
        createRequestCount += 1;
      }
    });

    await page.getByLabel('Title').fill('Bad');
    await page.getByLabel('Description').fill('Too short');
    await selectMockLocation(page);

    await expect(
      page.getByText('Title must be between 5 and 120 characters.'),
    ).toBeVisible();
    await expect(
      page.getByText('Description must be between 20 and 2000 characters.'),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Create incident' }),
    ).toBeDisabled();
    expect(createRequestCount).toBe(0);
  });

  test('should display an error and keep the form when incident creation fails', async ({
    page,
  }) => {
    await installApiRoute(page);
    await page.route('http://localhost:3000/api/v1/incidents', (route) =>
      route.request().method() === 'POST'
        ? route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Unexpected error' }),
          })
        : route.fallback(),
    );
    await installLocationSearchMock(page);
    await loginAsAdmin(page);
    await page.goto('/dashboard/incidents/new');

    const title = `e2e-failed-incident-${randomUUID()}`;
    await page.getByLabel('Title').fill(title);
    await page
      .getByLabel('Description')
      .fill('A vehicle collision is blocking the eastbound lane.');
    await selectMockLocation(page);

    const createResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/api/v1/incidents') &&
        response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Create incident' }).click();
    expect((await createResponse).status()).toBe(500);

    await expect(
      page
        .getByRole('alert')
        .getByText('Incident could not be created. Please try again.'),
    ).toBeVisible();
    await expect(page.getByLabel('Title')).toHaveValue(title);
    await expect(
      page.getByRole('button', { name: 'Create incident' }),
    ).toBeEnabled();
  });

  test('should update an incident and show the saved changes', async ({
    page,
  }) => {
    const prisma = await createPrismaClient();
    const originalTitle = `e2e-edit-${randomUUID()}`;
    const updatedTitle = `${originalTitle}-updated`;
    const incident = await createIncidentRecord(prisma, originalTitle);

    try {
      await installApiRoute(page);
      await installLocationSearchMock(page);
      await loginAsAdmin(page);
      await page.goto('/dashboard/incidents');
      const row = page.getByRole('row').filter({ hasText: originalTitle });
      await row.getByRole('button', { name: 'Edit' }).click();

      await page.getByLabel('Title').fill(updatedTitle);
      await page
        .getByLabel('Description')
        .fill('Emergency crews are clearing the blocked eastbound lane.');
      await selectMockLocation(page);
      await page.getByLabel('Severity').selectOption('HIGH');

      const updateResponse = page.waitForResponse(
        (response) =>
          response.url().includes(`/api/v1/incidents/${incident.id}`) &&
          response.request().method() === 'PATCH',
      );
      await page.getByRole('button', { name: 'Save changes' }).click();
      expect((await updateResponse).status()).toBe(200);
      await expect(page).toHaveURL(/\/dashboard\/incidents$/);
      await expect(
        page.getByRole('row').filter({ hasText: updatedTitle }),
      ).toBeVisible();

      await expect
        .poll(async () => {
          const updatedIncident = await prisma.incident.findUnique({
            where: { id: incident.id },
          });
          return (
            updatedIncident && {
              title: updatedIncident.title,
              description: updatedIncident.description,
              location: updatedIncident.location,
              latitude: updatedIncident.latitude,
              longitude: updatedIncident.longitude,
              severity: updatedIncident.severity,
            }
          );
        })
        .toMatchObject({
          title: updatedTitle,
          description:
            'Emergency crews are clearing the blocked eastbound lane.',
          location: mockLocation.label,
          latitude: mockLocation.latitude,
          longitude: mockLocation.longitude,
          severity: 'HIGH',
        });
    } finally {
      try {
        await prisma.incident.deleteMany({ where: { id: incident.id } });
      } finally {
        await prisma.$disconnect();
      }
    }
  });

  test('should filter incidents by search text and status', async ({
    page,
  }) => {
    const prisma = await createPrismaClient();
    const uniqueId = randomUUID();
    const matchingTitle = `e2e-search-${uniqueId}`;
    const otherTitle = `e2e-other-${uniqueId}`;
    const matchingIncident = await createIncidentRecord(
      prisma,
      matchingTitle,
      'RESOLVED',
    );
    const otherIncident = await createIncidentRecord(prisma, otherTitle);

    try {
      await installApiRoute(page);
      await loginAsAdmin(page);
      await page.goto('/dashboard/incidents');

      await page.getByLabel('Search').fill(matchingTitle);
      const matchingRow = page
        .getByRole('row')
        .filter({ hasText: matchingTitle });
      await expect(matchingRow).toBeVisible();
      await expect(
        page.getByRole('row').filter({ hasText: otherTitle }),
      ).toHaveCount(0);

      await page.getByLabel('Search').fill('');
      await page.getByLabel('Status').selectOption('RESOLVED');
      await expect(matchingRow).toBeVisible();
      await expect(
        page.getByRole('row').filter({ hasText: otherTitle }),
      ).toHaveCount(0);
    } finally {
      try {
        await prisma.incident.deleteMany({
          where: { id: { in: [matchingIncident.id, otherIncident.id] } },
        });
      } finally {
        await prisma.$disconnect();
      }
    }
  });

  test('should deny incident creation to non-admin users', async ({ page }) => {
    const prisma = await createPrismaClient();
    const id = randomUUID();
    const email = `e2e-user-${id}@example.com`;
    const username = `e2e-user-${id}`;
    const title = `e2e-forbidden-${id}`;

    try {
      const registrationResponse = await page.request.post(
        'http://127.0.0.1:3101/api/v1/auth/register',
        {
          data: { username, email, password: 'e2e-password-123' },
        },
      );
      expect(registrationResponse.status()).toBe(201);
      const registration = (await registrationResponse.json()) as {
        user: { id: string; email: string; role: 'USER' };
        access_token: string;
      };

      await installApiRoute(page);
      await page.addInitScript(
        ({ user, accessToken }) => {
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('access_token', accessToken);
        },
        { user: registration.user, accessToken: registration.access_token },
      );
      await page.goto('/dashboard/incidents');
      await expect(
        page.getByRole('button', { name: 'Create incident' }),
      ).toHaveCount(0);

      await page.goto('/dashboard/incidents/new');
      await expect(page).toHaveURL(/\/dashboard\/overview$/);

      const createResponse = await page.request.post(
        'http://127.0.0.1:3101/api/v1/incidents',
        {
          headers: {
            Authorization: `Bearer ${registration.access_token}`,
          },
          data: {
            title,
            description: 'An unauthorized attempt to create an incident.',
            location: mockLocation.label,
            latitude: mockLocation.latitude,
            longitude: mockLocation.longitude,
            status: 'OPEN',
            severity: 'LOW',
          },
        },
      );
      expect(createResponse.status()).toBe(403);
      await expect(
        prisma.incident.findFirst({ where: { title } }),
      ).resolves.toBeNull();
    } finally {
      try {
        await prisma.user.deleteMany({ where: { email } });
      } finally {
        await prisma.$disconnect();
      }
    }
  });

  test('should save a status change from the incident list', async ({
    page,
  }) => {
    const prisma = await createPrismaClient();
    const title = `e2e-status-${randomUUID()}`;
    const incident = await createIncidentRecord(prisma, title);

    try {
      await installApiRoute(page);
      await loginAsAdmin(page);
      await page.goto('/dashboard/incidents');

      const row = page.getByRole('row').filter({ hasText: title });
      await row.getByRole('button', { name: 'Change status' }).click();
      const dialog = page.getByRole('dialog', { name: 'Change status' });
      await dialog.getByLabel('Status').selectOption('RESOLVED');

      const updateResponse = page.waitForResponse(
        (response) =>
          response.url().includes(`/api/v1/incidents/${incident.id}`) &&
          response.request().method() === 'PATCH',
      );
      await dialog.getByRole('button', { name: 'Save changes' }).click();
      expect((await updateResponse).status()).toBe(200);
      await expect(row.getByText('Resolved', { exact: true })).toBeVisible();

      await expect
        .poll(async () => {
          const updatedIncident = await prisma.incident.findUnique({
            where: { id: incident.id },
          });
          return updatedIncident?.status;
        })
        .toBe('RESOLVED');
    } finally {
      try {
        await prisma.incident.deleteMany({ where: { id: incident.id } });
      } finally {
        await prisma.$disconnect();
      }
    }
  });
});
