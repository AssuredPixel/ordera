import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Branch } from '../branches/branch.schema';
import { User } from '../users/user.schema';
import { Role } from '../../common/enums/role.enum';
import { UsersService } from '../users/users.service';
import { OrganizationsService } from '../organizations/organizations.service';

@Injectable()
export class OwnerService {
  constructor(
    @InjectModel(Branch.name) private branchModel: Model<Branch>,
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly usersService: UsersService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  async getDashboardStats(organizationId: string) {
    const orgObjectId = new Types.ObjectId(organizationId);

    const [branches, staffCount] = await Promise.all([
      this.branchModel.find({ organizationId: orgObjectId }).lean(),
      this.userModel.countDocuments({
        organizationId: orgObjectId,
        role: { $in: [Role.BRANCH_MANAGER, Role.CASHIER, Role.WAITER, Role.KITCHEN_STAFF] },
        isActive: true,
      }),
    ]);

    const totalBranches = branches.length;
    const activeBranches = branches.filter((b) => b.isActive).length;

    // Per-branch summaries. Revenue/orders are ₦0 / 0 until Phase 3 (ordering domain).
    const branchSummaries = branches.map((b) => ({
      branchId: b._id,
      name: b.name,
      slug: b.slug,
      isHeadquarters: b.isHeadquarters,
      isActive: b.isActive,
      operatingMode: b.operatingMode,
      address: b.address,
      phone: b.phone,
      settings: b.settings,
      revenue: { amount: 0, currency: 'NGN' }, // Phase 3
      orders: 0,                                // Phase 3
    }));

    return {
      totalBranches,
      activeBranches,
      totalStaff: staffCount,
      totalRevenueToday: { amount: 0, currency: 'NGN' }, // Phase 3
      totalOrdersToday: 0,                                // Phase 3
      branchSummaries,
    };
  }

  // --- STAFF MANAGEMENT ---

  async getStaff(organizationId: string) {
    return this.usersService.findByOrganization(organizationId);
  }

  async updateStaffRole(userId: string, orgId: string, role: Role) {
    const user = await this.usersService.findById(userId);
    if (!user || user.organizationId.toString() !== orgId) {
      throw new Error('User not found or unauthorized');
    }
    return this.usersService.update(userId, { role });
  }

  async transferStaff(userId: string, orgId: string, branchId: string) {
    const user = await this.usersService.findById(userId);
    if (!user || user.organizationId.toString() !== orgId) {
      throw new Error('User not found or unauthorized');
    }
    return this.usersService.transferToBranch(userId, branchId);
  }

  async deactivateStaff(userId: string, orgId: string) {
    const user = await this.usersService.findById(userId);
    if (!user || user.organizationId.toString() !== orgId) {
      throw new Error('User not found or unauthorized');
    }
    return this.usersService.deactivate(userId);
  }

  // --- SETTINGS ---

  async getSettings(organizationId: string, ownerId: string) {
    const [org, owner] = await Promise.all([
      this.organizationsService.findById(organizationId),
      this.usersService.findById(ownerId),
    ]);
    return { organization: org, profile: owner };
  }

  async updateOrganization(orgId: string, data: any) {
    return this.organizationsService.update(orgId, data);
  }

  async updateProfile(userId: string, data: any) {
    return this.usersService.update(userId, data);
  }
}
