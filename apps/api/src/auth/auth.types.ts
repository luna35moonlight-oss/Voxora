import type { AuthLevel } from './session-assurance';

export type AuthUserPayload = {
  userId: string;
  email: string;
  roles: string[];
  authLevel: AuthLevel;
};

export type AuthenticatedRequest = {
  user?: AuthUserPayload;
  correlationId?: string;
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
};
