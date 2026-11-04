export const INCIDENT_STATUSES = [
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
] as const;

export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

export const DEFAULT_INCIDENT_STATUS: IncidentStatus = 'OPEN';
