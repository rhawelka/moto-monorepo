export const INCIDENT_SEVERITIES = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
] as const;

export type IncidentSeverity = (typeof INCIDENT_SEVERITIES)[number];

export const DEFAULT_INCIDENT_SEVERITY: IncidentSeverity = 'MEDIUM';
