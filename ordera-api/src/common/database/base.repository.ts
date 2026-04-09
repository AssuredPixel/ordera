import { Document, FilterQuery, Model, UpdateQuery } from 'mongoose';

export abstract class BaseRepository<T extends Document> {
  constructor(protected readonly model: Model<T>) {}

  /**
   * Generates a tenant-aware filter.
   * If a user is provided, filters by organizationId and branchId (unless owner).
   */
  protected getTenantFilter(user?: any): FilterQuery<T> {
    if (!user) return {};
    
    const filter: FilterQuery<T> = { organizationId: user.organizationId };
    
    // Owners might access all branches in their organization
    if (user.role !== 'owner' && user.branchId) {
      (filter as any).branchId = user.branchId;
    }
    
    return filter;
  }

  async find(filter: FilterQuery<T> = {}, user?: any): Promise<T[]> {
    const tenantFilter = this.getTenantFilter(user);
    return this.model.find({ ...filter, ...tenantFilter }).exec();
  }

  async findOne(filter: FilterQuery<T>, user?: any): Promise<T | null> {
    const tenantFilter = this.getTenantFilter(user);
    return this.model.findOne({ ...filter, ...tenantFilter }).exec();
  }

  async create(doc: Partial<T>, user?: any): Promise<T> {
    const tenantData = user ? { 
      organizationId: user.organizationId, 
      branchId: user.branchId 
    } : {};
    
    const newDoc = new this.model({ ...tenantData, ...doc });
    return newDoc.save();
  }

  async updateOne(filter: FilterQuery<T>, update: UpdateQuery<T>, user?: any): Promise<T | null> {
    const tenantFilter = this.getTenantFilter(user);
    return this.model.findOneAndUpdate(
      { ...filter, ...tenantFilter },
      update,
      { new: true }
    ).exec();
  }

  async deleteOne(filter: FilterQuery<T>, user?: any): Promise<any> {
    const tenantFilter = this.getTenantFilter(user);
    return this.model.deleteOne({ ...filter, ...tenantFilter }).exec();
  }
}
