import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { OrganizationsService } from '../../modules/organizations/organizations.service';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      subdomain?: string;
      organization?: any;
    }
  }
}

@Injectable()
export class SubdomainMiddleware implements NestMiddleware {
  constructor(private readonly orgService: OrganizationsService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const host = req.headers.host || '';
    
    // Logic: Extract first part of host if not localhost base
    // e.g. healthymeals.ordera.app -> healthymeals
    // e.g. localhost:3001 -> no subdomain
    const parts = host.split('.');
    
    let subdomain: string | null = null;
    
    // Basic heuristic: if 3+ parts, first is subdomain (e.g. sub.domain.com)
    // For localhost dev: if 2+ parts and not starting with 'localhost', first is subdomain (e.g. sub.localhost)
    if (parts.length >= 2 && !host.includes('localhost')) {
      subdomain = parts[0];
    } else if (parts.length >= 2 && host.includes('localhost') && parts[0] !== 'localhost') {
      subdomain = parts[0];
    }

    if (subdomain) {
      req.subdomain = subdomain;
      try {
        const org = await this.orgService.findBySubdomain(subdomain);
        req.organization = org;
      } catch (e) {
        // If subdomain provided but org not found, we might want to throw or just proceed
        // and let guards handle it. For now, just attach null.
        req.organization = null;
      }
    }

    next();
  }
}
