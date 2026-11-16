import type { Locator, Page } from '@playwright/test';

export function getIncidentLocators(page: Page) {
  const incidentRow = (title: string): Locator =>
    page.getByRole('row').filter({ hasText: title });

  return {
    title: page.getByLabel('Title'),
    description: page.getByLabel('Description'),
    location: page.getByLabel('Location'),
    locationSuggestion: (label: string) =>
      page.getByRole('option', { name: label }).getByRole('button'),
    severity: page.getByLabel('Severity'),
    status: page.getByLabel('Status'),
    search: page.getByLabel('Search'),
    createButton: page.getByRole('button', { name: 'Create incident' }),
    saveButton: page.getByRole('button', { name: 'Save changes' }),
    row: incidentRow,
    editButton: (title: string) =>
      incidentRow(title).getByRole('button', { name: 'Edit' }),
    changeStatusButton: (title: string) =>
      incidentRow(title).getByRole('button', { name: 'Change status' }),
    titleValidation: page.getByText(
      'Title must be between 5 and 120 characters.',
    ),
    descriptionValidation: page.getByText(
      'Description must be between 20 and 2000 characters.',
    ),
    createError: page
      .getByRole('alert')
      .getByText('Incident could not be created. Please try again.'),
    statusDialog: page.getByRole('dialog', { name: 'Change status' }),
    statusDialogSelect: page
      .getByRole('dialog', { name: 'Change status' })
      .getByLabel('Status'),
    statusDialogSaveButton: page
      .getByRole('dialog', { name: 'Change status' })
      .getByRole('button', { name: 'Save changes' }),
    resolvedStatus: (title: string) =>
      incidentRow(title).getByText('Resolved', { exact: true }),
  };
}
