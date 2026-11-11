import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { expect, test } from '@playwright/test';

test.describe('dashboard-web incidents', () => {
  test('should create an incident and show it in the incident list', async ({
    page,
  }) => {
    const databaseUrl = process.env['E2E_DATABASE_URL'];
    if (!databaseUrl) {
      throw new Error(
        'E2E_DATABASE_URL is required to run dashboard E2E tests.',
      );
    }

    const prisma = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
    });
    const title = `e2e-incident-${randomUUID()}`;
    const incidentDetails = {
      title,
      description: 'A vehicle collision is blocking the eastbound lane.',
      location: 'Main Square, Krakow, Poland',
      latitude: 50.0614,
      longitude: 19.9366,
      status: 'OPEN',
      severity: 'HIGH',
    };

    try {
      await page.route('http://localhost:3000/api/v1/**', (route) => {
        const apiUrl = new URL(route.request().url());
        apiUrl.hostname = '127.0.0.1';
        apiUrl.port = '3101';
        return route.continue({ url: apiUrl.toString() });
      });
      await page.route('https://photon.komoot.io/api/**', (route) =>
        route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            features: [
              {
                geometry: { coordinates: [19.9366, 50.0614] },
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

      await page.goto('/login');
      await page.getByLabel('Email or username').fill('admin@test.pl');
      await page.getByRole('textbox', { name: 'Password' }).fill('admin');
      await page.getByRole('button', { name: 'Login', exact: true }).click();
      await expect(page).toHaveURL(/\/dashboard(?:\/|$)/);

      await page.goto('/dashboard/incidents');
      await page.getByRole('button', { name: 'Create incident' }).click();
      await page.getByLabel('Title').fill(title);
      await page.getByLabel('Description').fill(incidentDetails.description);
      await page.getByLabel('Location').fill('Main Square');
      await page
        .getByRole('option', { name: incidentDetails.location })
        .getByRole('button')
        .click();
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
});
