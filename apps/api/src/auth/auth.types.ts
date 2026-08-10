export type AuthUserPayload = {
  userId: string;
  email: string;
  roles: string[];
};

export type AuthenticatedRequest = {
  user?: AuthUserPayload;
  correlationId?: string;
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
};
