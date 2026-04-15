export interface JwtPayload {
  userId: string;
  role: string; // Changed from Role enum to string as per Step 4
  organizationId: string | null;
  branchId: string | null;
  subdomain: string | null;
  iat?: number;
  exp?: number;
}
