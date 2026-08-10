/** Shared test helpers for Phase 1 foundation. */

export function expectNeverFakeSuccess(label: string): void {
  const forbidden = [
    'Connected',
    'Verified',
    'Sent',
    'Synced',
    'Paid',
    'Scheduled',
    'Uploaded',
    'Completed',
  ];
  if (forbidden.includes(label)) {
    throw new Error(`Forbidden fake-success label used in tests/fixtures: ${label}`);
  }
}

export function createCorrelationId(prefix = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
