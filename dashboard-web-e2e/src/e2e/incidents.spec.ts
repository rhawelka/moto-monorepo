import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { expect, test, type Page } from '@playwright/test';
import { getIncidentLocators } from './locators/incidents';
import { getAuthenticationLocators } from './locators/authentication';
import { installApiRoute, withPrisma } from './helpers';

function getLocators(page: Page) {
  return {
    authentication: getAuthenticationLocators(page),
    incidents: getIncidentLocators(page),
  };
}

const mockLocation = {
  label: 'Main Square, Krakow, Poland',
  latitude: 50.0614,
  longitude: 19.9366,
};

const incidentDescription =
  'A vehicle collision is blocking the eastbound lane.';

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
  const locators = getLocators(page);
  await page.goto('/login');
  await locators.authentication.emailOrUsername.fill('admin@test.pl');
  await locators.authentication.loginPassword.fill('admin');
  await locators.authentication.loginButton.click();
  await expect(page).toHaveURL(/\/dashboard(?:\/|$)/);
}

async function setupAdminPage(
  page: Page,
  mockLocationSearch = false,
): Promise<void> {
  await installApiRoute(page);
  if (mockLocationSearch) {
    await installLocationSearchMock(page);
  }
  await loginAsAdmin(page);
}

function waitForIncidentResponse(
  page: Page,
  method: 'POST' | 'PATCH' | 'DELETE',
  incidentId?: string,
) {
  return page.waitForResponse(
    (response) =>
      response
        .url()
        .includes(
          incidentId ? `/api/v1/incidents/${incidentId}` : '/api/v1/incidents',
        ) && response.request().method() === method,
  );
}

async function selectMockLocation(page: Page): Promise<void> {
  const locators = getLocators(page);
  await locators.incidents.location.fill('Main Square');
  await locators.incidents.locationSuggestion(mockLocation.label).click();
}

async function createIncidentRecord(
  prisma: PrismaClient,
  title: string,
  status: 'OPEN' | 'RESOLVED' = 'OPEN',
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM',
) {
  return prisma.incident.create({
    data: {
      title,
      description: incidentDescription,
      location: 'Main Square, Krakow, Poland',
      latitude: mockLocation.latitude,
      longitude: mockLocation.longitude,
      status,
      severity,
    },
  });
}

async function openIncidentDetailFromList(
  page: Page,
  title: string,
  incidentId: string,
): Promise<void> {
  const { incidents } = getLocators(page);
  await page.goto('/dashboard/incidents');
  await incidents.row(title).click();
  await expect(page).toHaveURL(
    new RegExp(`/dashboard/incidents/${incidentId}$`),
  );
}

test.describe('dashboard-web incidents', () => {
  test('should create an incident and show it in the incident list', async ({
    page,
  }) => {
    const locators = getLocators(page);
    const title = `e2e-incident-${randomUUID()}`;
    const incidentDetails = {
      title,
      description: incidentDescription,
      location: mockLocation.label,
      latitude: mockLocation.latitude,
      longitude: mockLocation.longitude,
      status: 'OPEN',
      severity: 'HIGH',
    };

    await withPrisma(
      async (prisma) => {
        await setupAdminPage(page, true);

        await page.goto('/dashboard/incidents');
        await locators.incidents.createButton.click();
        await locators.incidents.title.fill(title);
        await locators.incidents.description.fill(incidentDetails.description);
        await selectMockLocation(page);
        await locators.incidents.severity.selectOption(
          incidentDetails.severity,
        );
        await locators.incidents.status.selectOption(incidentDetails.status);

        const createResponse = waitForIncidentResponse(page, 'POST');
        await locators.incidents.createButton.click();
        const response = await createResponse;
        expect(response.status()).toBe(201);
        await expect(page).toHaveURL(/\/dashboard\/incidents$/);
        await expect(locators.incidents.row(title)).toBeVisible();

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
      },
      (prisma) => prisma.incident.deleteMany({ where: { title } }),
    );
  });

  test('should prevent submitting an incident with invalid fields', async ({
    page,
  }) => {
    const locators = getLocators(page);
    await setupAdminPage(page, true);
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

    await locators.incidents.title.fill('Bad');
    await locators.incidents.description.fill('Too short');
    await selectMockLocation(page);

    await expect(locators.incidents.titleValidation).toBeVisible();
    await expect(locators.incidents.descriptionValidation).toBeVisible();
    await expect(locators.incidents.createButton).toBeDisabled();
    expect(createRequestCount).toBe(0);
  });

  test('should display an error and keep the form when incident creation fails', async ({
    page,
  }) => {
    const locators = getLocators(page);
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
    await locators.incidents.title.fill(title);
    await locators.incidents.description.fill(incidentDescription);
    await selectMockLocation(page);

    const createResponse = waitForIncidentResponse(page, 'POST');
    await locators.incidents.createButton.click();
    expect((await createResponse).status()).toBe(500);

    await expect(locators.incidents.createError).toBeVisible();
    await expect(locators.incidents.title).toHaveValue(title);
    await expect(locators.incidents.createButton).toBeEnabled();
  });

  test('should update an incident and show the saved changes', async ({
    page,
  }) => {
    const locators = getLocators(page);
    const originalTitle = `e2e-edit-${randomUUID()}`;
    const updatedTitle = `${originalTitle}-updated`;

    await withPrisma(
      async (prisma) => {
        const incident = await createIncidentRecord(prisma, originalTitle);
        await setupAdminPage(page, true);
        await page.goto('/dashboard/incidents');
        await locators.incidents.editButton(originalTitle).click();

        await locators.incidents.title.fill(updatedTitle);
        await locators.incidents.description.fill(
          'Emergency crews are clearing the blocked eastbound lane.',
        );
        await selectMockLocation(page);
        await locators.incidents.severity.selectOption('HIGH');

        const updateResponse = waitForIncidentResponse(
          page,
          'PATCH',
          incident.id,
        );
        await locators.incidents.saveButton.click();
        expect((await updateResponse).status()).toBe(200);
        await expect(page).toHaveURL(/\/dashboard\/incidents$/);
        await expect(locators.incidents.row(updatedTitle)).toBeVisible();

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
      },
      (prisma) =>
        prisma.incident.deleteMany({
          where: { title: { in: [originalTitle, updatedTitle] } },
        }),
    );
  });

  test('should open incident details from the incident list', async ({
    page,
  }) => {
    const locators = getLocators(page);
    const title = `e2e-detail-${randomUUID()}`;

    await withPrisma(
      async (prisma) => {
        const incident = await createIncidentRecord(prisma, title);
        await setupAdminPage(page);
        await openIncidentDetailFromList(page, title, incident.id);

        await expect(locators.incidents.detailTitle(title)).toBeVisible();
        await expect(
          page.getByText(incidentDescription, { exact: true }),
        ).toBeVisible();
        await expect(
          page.getByText(mockLocation.label, { exact: true }),
        ).toBeVisible();
        await expect(page.getByText('Open', { exact: true })).toBeVisible();
        await expect(page.getByText('Medium', { exact: true })).toBeVisible();
      },
      (prisma) => prisma.incident.deleteMany({ where: { title } }),
    );
  });

  test('should cancel incident deletion from its details', async ({ page }) => {
    const locators = getLocators(page);
    const title = `e2e-delete-cancel-${randomUUID()}`;

    await withPrisma(
      async (prisma) => {
        const incident = await createIncidentRecord(prisma, title);
        await setupAdminPage(page);
        await openIncidentDetailFromList(page, title, incident.id);

        let deleteRequestCount = 0;
        page.on('request', (request) => {
          if (
            request.url().includes(`/api/v1/incidents/${incident.id}`) &&
            request.method() === 'DELETE'
          ) {
            deleteRequestCount += 1;
          }
        });

        await locators.incidents.deleteButton.click();
        await expect(locators.incidents.deleteConfirmationTitle).toBeVisible();
        await locators.incidents.deleteCancelButton.click();

        await expect(
          locators.incidents.deleteConfirmationTitle,
        ).toHaveCount(0);
        await expect(locators.incidents.deleteButton).toBeVisible();
        expect(deleteRequestCount).toBe(0);
        await expect(
          prisma.incident.findUnique({ where: { id: incident.id } }),
        ).resolves.not.toBeNull();
      },
      (prisma) => prisma.incident.deleteMany({ where: { title } }),
    );
  });

  test('should delete an incident after confirmation', async ({ page }) => {
    const locators = getLocators(page);
    const title = `e2e-delete-${randomUUID()}`;

    await withPrisma(
      async (prisma) => {
        const incident = await createIncidentRecord(prisma, title);
        await setupAdminPage(page);
        await openIncidentDetailFromList(page, title, incident.id);

        await locators.incidents.deleteButton.click();
        await expect(locators.incidents.deleteConfirmationTitle).toBeVisible();

        const deleteResponse = waitForIncidentResponse(
          page,
          'DELETE',
          incident.id,
        );
        await locators.incidents.deleteConfirmButton.click();
        expect((await deleteResponse).status()).toBe(204);

        await expect(page).toHaveURL(/\/dashboard\/incidents$/);
        await expect(locators.incidents.row(title)).toHaveCount(0);
        await expect
          .poll(() =>
            prisma.incident.findUnique({ where: { id: incident.id } }),
          )
          .toBeNull();
      },
      (prisma) => prisma.incident.deleteMany({ where: { title } }),
    );
  });

  test('should keep the incident and show an error when deletion fails', async ({
    page,
  }) => {
    const locators = getLocators(page);
    const title = `e2e-delete-failed-${randomUUID()}`;

    await withPrisma(
      async (prisma) => {
        const incident = await createIncidentRecord(prisma, title);
        await setupAdminPage(page);
        await page.route(
          `http://localhost:3000/api/v1/incidents/${incident.id}`,
          (route) =>
            route.request().method() === 'DELETE'
              ? route.fulfill({
                  status: 500,
                  contentType: 'application/json',
                  body: JSON.stringify({ message: 'Unexpected error' }),
                })
              : route.fallback(),
        );
        await openIncidentDetailFromList(page, title, incident.id);

        await locators.incidents.deleteButton.click();
        const deleteResponse = waitForIncidentResponse(
          page,
          'DELETE',
          incident.id,
        );
        await locators.incidents.deleteConfirmButton.click();
        expect((await deleteResponse).status()).toBe(500);

        await expect(locators.incidents.deleteError).toBeVisible();
        await expect(
          locators.incidents.deleteConfirmationTitle,
        ).toBeVisible();
        await expect(locators.incidents.detailTitle(title)).toBeVisible();
        await expect(
          prisma.incident.findUnique({ where: { id: incident.id } }),
        ).resolves.not.toBeNull();
      },
      (prisma) => prisma.incident.deleteMany({ where: { title } }),
    );
  });

  test('should filter incidents by search text and status', async ({
    page,
  }) => {
    const locators = getLocators(page);
    const uniqueId = randomUUID();
    const matchingTitle = `e2e-search-${uniqueId}`;
    const otherTitle = `e2e-other-${uniqueId}`;

    await withPrisma(
      async (prisma) => {
        await createIncidentRecord(prisma, matchingTitle, 'RESOLVED');
        await createIncidentRecord(prisma, otherTitle);
        await setupAdminPage(page);
        await page.goto('/dashboard/incidents');

        await locators.incidents.search.fill(matchingTitle);
        const matchingRow = locators.incidents.row(matchingTitle);
        await expect(matchingRow).toBeVisible();
        await expect(locators.incidents.row(otherTitle)).toHaveCount(0);

        await locators.incidents.search.fill('');
        await locators.incidents.status.selectOption('RESOLVED');
        await expect(matchingRow).toBeVisible();
        await expect(locators.incidents.row(otherTitle)).toHaveCount(0);
      },
      (prisma) =>
        prisma.incident.deleteMany({
          where: { title: { in: [matchingTitle, otherTitle] } },
        }),
    );
  });

  test('should sort incidents by title', async ({ page }) => {
    const locators = getLocators(page);
    const prefix = `e2e-sort-${randomUUID()}`;
    const firstTitle = `${prefix}-a`;
    const secondTitle = `${prefix}-b`;
    const thirdTitle = `${prefix}-c`;
    const titles = [firstTitle, secondTitle, thirdTitle];

    await withPrisma(
      async (prisma) => {
        await Promise.all(
          titles.map((title) => createIncidentRecord(prisma, title)),
        );
        await setupAdminPage(page);
        await page.goto('/dashboard/incidents');
        await locators.incidents.search.fill(prefix);
        await expect(locators.incidents.row(firstTitle)).toBeVisible();
        await expect(page.getByText('3 results', { exact: true })).toBeVisible();

        await locators.incidents.titleSortButton.click();
        await expect(locators.incidents.firstIncidentRow).toContainText(
          firstTitle,
        );
        await locators.incidents.titleSortButton.click();
        await expect(locators.incidents.firstIncidentRow).toContainText(
          thirdTitle,
        );
      },
      (prisma) =>
        prisma.incident.deleteMany({
          where: { title: { in: titles } },
        }),
    );
  });

  test('should paginate and reset to the first page when filtering by severity', async ({
    page,
  }) => {
    const locators = getLocators(page);
    const prefix = `e2e-pagination-${randomUUID()}`;
    const criticalTitle = `${prefix}-critical`;
    const titles = Array.from(
      { length: 11 },
      (_, index) => `${prefix}-${index}`,
    );
    titles.push(criticalTitle);

    await withPrisma(
      async (prisma) => {
        await Promise.all(
          titles.map((title) =>
            createIncidentRecord(
              prisma,
              title,
              'OPEN',
              title === criticalTitle ? 'CRITICAL' : 'MEDIUM',
            ),
          ),
        );
        await setupAdminPage(page);
        await page.goto('/dashboard/incidents');
        await locators.incidents.search.fill(prefix);
        await expect(locators.incidents.pageIndicator(1, 2)).toBeVisible();
        await expect(page.getByText('12 results', { exact: true })).toBeVisible();

        await locators.incidents.nextPageButton.click();
        await expect(locators.incidents.pageIndicator(2, 2)).toBeVisible();
        await expect(locators.incidents.previousPageButton).toBeEnabled();

        await locators.incidents.severity.selectOption('CRITICAL');

        await expect(locators.incidents.pageIndicator(1, 1)).toBeVisible();
        await expect(locators.incidents.row(criticalTitle)).toBeVisible();
        await expect(locators.incidents.row(titles[0])).toHaveCount(0);
        await expect(locators.incidents.nextPageButton).toBeDisabled();
        await expect(locators.incidents.previousPageButton).toBeDisabled();
      },
      (prisma) =>
        prisma.incident.deleteMany({
          where: { title: { startsWith: prefix } },
        }),
    );
  });

  test('should deny incident creation to non-admin users', async ({ page }) => {
    const locators = getLocators(page);
    const id = randomUUID();
    const email = `e2e-user-${id}@example.com`;
    const username = `e2e-user-${id}`;
    const title = `e2e-forbidden-${id}`;

    await withPrisma(
      async (prisma) => {
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
        await expect(locators.incidents.createButton).toHaveCount(0);

        await page.goto('/dashboard/incidents/new');
        await expect(page).toHaveURL(/\/access-denied$/);

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
      },
      (prisma) => prisma.user.deleteMany({ where: { email } }),
    );
  });

  test('should save a status change from the incident list', async ({
    page,
  }) => {
    const locators = getLocators(page);
    const title = `e2e-status-${randomUUID()}`;

    await withPrisma(
      async (prisma) => {
        const incident = await createIncidentRecord(prisma, title);
        await setupAdminPage(page);
        await page.goto('/dashboard/incidents');

        await locators.incidents.changeStatusButton(title).click();
        await locators.incidents.statusDialogSelect.selectOption('RESOLVED');

        const updateResponse = waitForIncidentResponse(
          page,
          'PATCH',
          incident.id,
        );
        await locators.incidents.statusDialogSaveButton.click();
        expect((await updateResponse).status()).toBe(200);
        await expect(locators.incidents.resolvedStatus(title)).toBeVisible();

        await expect
          .poll(async () => {
            const updatedIncident = await prisma.incident.findUnique({
              where: { id: incident.id },
            });
            return updatedIncident?.status;
          })
          .toBe('RESOLVED');
      },
      (prisma) => prisma.incident.deleteMany({ where: { title } }),
    );
  });

  test('should cancel a status change from the incident list', async ({
    page,
  }) => {
    const locators = getLocators(page);
    const title = `e2e-status-cancel-${randomUUID()}`;

    await withPrisma(
      async (prisma) => {
        const incident = await createIncidentRecord(prisma, title);
        await setupAdminPage(page);
        await page.goto('/dashboard/incidents');

        let updateRequestCount = 0;
        page.on('request', (request) => {
          if (
            request.url().includes(`/api/v1/incidents/${incident.id}`) &&
            request.method() === 'PATCH'
          ) {
            updateRequestCount += 1;
          }
        });

        await locators.incidents.changeStatusButton(title).click();
        await expect(locators.incidents.statusDialog).toBeVisible();
        await locators.incidents.statusDialogSelect.selectOption('RESOLVED');
        await locators.incidents.statusDialogCancelButton.click();

        await expect(locators.incidents.statusDialog).toHaveCount(0);
        await expect(locators.incidents.openStatus(title)).toBeVisible();
        expect(updateRequestCount).toBe(0);
        await expect(
          prisma.incident.findUnique({ where: { id: incident.id } }),
        ).resolves.toMatchObject({ status: 'OPEN' });
      },
      (prisma) => prisma.incident.deleteMany({ where: { title } }),
    );
  });

  test('should keep the status dialog open when saving a status change fails', async ({
    page,
  }) => {
    const locators = getLocators(page);
    const title = `e2e-status-failed-${randomUUID()}`;

    await withPrisma(
      async (prisma) => {
        const incident = await createIncidentRecord(prisma, title);
        await setupAdminPage(page);
        await page.route(
          `http://localhost:3000/api/v1/incidents/${incident.id}`,
          (route) =>
            route.request().method() === 'PATCH'
              ? route.fulfill({
                  status: 500,
                  contentType: 'application/json',
                  body: JSON.stringify({ message: 'Unexpected error' }),
                })
              : route.fallback(),
        );
        await page.goto('/dashboard/incidents');

        await locators.incidents.changeStatusButton(title).click();
        await locators.incidents.statusDialogSelect.selectOption('RESOLVED');
        const updateResponse = waitForIncidentResponse(
          page,
          'PATCH',
          incident.id,
        );
        await locators.incidents.statusDialogSaveButton.click();
        expect((await updateResponse).status()).toBe(500);

        await expect(locators.incidents.statusDialogSaveError).toHaveText(
          'Changes could not be saved. Please try again.',
        );
        await expect(locators.incidents.statusDialog).toBeVisible();
        await expect(
          prisma.incident.findUnique({ where: { id: incident.id } }),
        ).resolves.toMatchObject({ status: 'OPEN' });
      },
      (prisma) => prisma.incident.deleteMany({ where: { title } }),
    );
  });
});
