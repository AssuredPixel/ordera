import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AIUsage } from './ai-usage.schema';

@Injectable()
export class AIUsageService {
  constructor(
    @InjectModel(AIUsage.name) private aiUsageModel: Model<AIUsage>,
  ) {}

  async logUsage(organizationId: string, tokens: number, estimatedCost: number = 0) {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    return this.aiUsageModel.findOneAndUpdate(
      { organizationId: new Types.ObjectId(organizationId), month, year },
      { 
        $inc: { 
          queryCount: 1, 
          totalTokens: tokens,
          estimatedCost: estimatedCost 
        } 
      },
      { upsert: true, new: true }
    );
  }

  async getPlatformStats(page: number = 1, limit: number = 10, search?: string) {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const skip = (page - 1) * limit;

    const pipeline: any[] = [
      { $match: { month, year } },
      {
        $lookup: {
          from: 'organizations',
          localField: 'organizationId',
          foreignField: '_id',
          as: 'organization'
        }
      },
      { $unwind: '$organization' }
    ];

    if (search) {
      pipeline.push({
        $match: { 'organization.name': { $regex: search, $options: 'i' } }
      });
    }

    const [results, total] = await Promise.all([
      this.aiUsageModel.aggregate([
        ...pipeline,
        { $sort: { totalTokens: -1 } },
        { $skip: skip },
        { $limit: Number(limit) }
      ]),
      this.aiUsageModel.aggregate([...pipeline, { $count: 'count' }])
    ]);

    return {
      data: results,
      total: total[0]?.count || 0,
      page: Number(page),
      limit: Number(limit)
    };
  }

  async getOrgTotalUsage(organizationId: string) {
    const stats = await this.aiUsageModel.find({ organizationId: new Types.ObjectId(organizationId) });
    return {
      totalQueries: stats.reduce((acc, curr) => acc + curr.queryCount, 0),
      totalTokens: stats.reduce((acc, curr) => acc + curr.totalTokens, 0),
      totalCost: stats.reduce((acc, curr) => acc + curr.estimatedCost, 0),
    };
  }
}
