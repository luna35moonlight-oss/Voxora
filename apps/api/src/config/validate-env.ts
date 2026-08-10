import { parseApiEnv } from '@voxora/config';

export function validateEnv(config: Record<string, unknown>) {
  return parseApiEnv(config as NodeJS.ProcessEnv);
}
