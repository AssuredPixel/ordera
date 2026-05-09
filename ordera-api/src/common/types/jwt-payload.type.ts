export interface JwtPayload {
  userId: string;
  role: string;
  organizationId: string | null;
  branchId: string | null;
  subdomain: string | null;
  sessionId: string; // Used for stateless session invalidation
  iat?: number;
  exp?: number;
}
