import { Role } from '../enums/role.enum';

export interface JwtPayload {
  userId: string;
  role: Role;
  organizationId: string;
  branchId: string;
  subdomain: string; // org slug — scopes all queries in prod via host header
  sessionId: string; // validated against DB on every request
}
