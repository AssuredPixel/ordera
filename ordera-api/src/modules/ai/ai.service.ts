import {
  Injectable,
  HttpStatus,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { AIQuery } from './schemas/ai-query.schema';
import { Order } from '../orders/schemas/order.schema';
import { Bill } from '../bills/schemas/bill.schema';
import { User } from '../users/user.schema';
import { MenuItem } from '../menu/schemas/menu-item.schema';
import { Branch } from '../branches/schemas/branch.schema';
import { OrderStatus } from '../../common/enums/order.enum';
import { BillStatus } from '../../common/enums/bill.enum';

@Injectable()
export class AIService {
  constructor(
    @InjectModel(AIQuery.name) private aiQueryModel: Model<AIQuery>,
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Bill.name) private billModel: Model<Bill>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(MenuItem.name) private menuItemModel: Model<MenuItem>,
    @InjectModel(Branch.name) private branchModel: Model<Branch>,
  ) {}

  async ask(userId: string, orgId: string, branchId: string, userRole: string, query: string) {
    const startTime = Date.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ─── STEP 1: Rate Limit Check (7 per user per day) ──────────────────────────
    const dailyCount = await this.aiQueryModel.countDocuments({
      userId,
      createdAt: { $gte: today },
    });

    if (dailyCount >= 7) {
      const rateLimitedQuery = new this.aiQueryModel({
        organizationId: orgId,
        branchId,
        userId,
        query,
        status: 'rate_limited',
        errorMessage: 'Daily limit of 7 queries exceeded',
      });
      await rateLimitedQuery.save();
      throw new HttpException(
        'Monthly/Daily AI query limit reached (7/day)',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // ─── STEP 2: Gather Context & User Info ─────────────────────────────────────
    const [rawContext, user] = await Promise.all([
      this.getBranchContext(orgId, branchId, userRole),
      this.userModel.findById(userId).lean(),
    ]);

    if (!user) throw new InternalServerErrorException('User profile not found');

    // ─── STEP 3: Apply Privacy Redaction Based on Role ──────────────────────────
    const maskedContext = this.maskContextForRole(rawContext, userRole as any);

    // ─── STEP 4: Initialize Query Record (Stores Masked Context only) ───────────
    const aiQuery = new this.aiQueryModel({
      organizationId: orgId,
      branchId,
      userId,
      query,
      context: maskedContext,
      status: 'success', 
    });

    try {
      // ─── STEP 5: Call OpenRouter ──────────────────────────────────────────────
      const response = await this.callOpenRouter(query, maskedContext, user);
      
      const endTime = Date.now();
      
      aiQuery.response = response.choices[0].message.content;
      aiQuery.aiModel = response.model;
      aiQuery.inputTokens = response.usage.prompt_tokens;
      aiQuery.outputTokens = response.usage.completion_tokens;
      aiQuery.totalTokens = response.usage.total_tokens;
      aiQuery.latencyMs = endTime - startTime;
      
      await aiQuery.save();

      return {
        response: aiQuery.response,
        queryId: aiQuery._id,
      };

    } catch (error) {
      aiQuery.status = error.response?.status === 429 ? 'rate_limited' : 'error';
      aiQuery.errorMessage = error.message;
      aiQuery.latencyMs = Date.now() - startTime;
      await aiQuery.save();
      
      throw new InternalServerErrorException(error.message || 'AI Query failed');
    }
  }

  // ─── Privacy Guard: Redact sensitive fields based on role Hierarchy ──────────
  private maskContextForRole(context: any, role: string) {
    const masked = { ...context };

    // 1. Revenue is strictly for Owner and Manager
    const canSeeRevenue = ['owner', 'manager'].includes(role);
    if (!canSeeRevenue) {
      masked.todayRevenue = { amount: 0, currency: context.todayRevenue.currency, hidden: true };
    }

    // 2. Staff Counts are for Owner, Manager, and Supervisor
    const canSeeStaff = ['owner', 'manager', 'supervisor'].includes(role);
    if (!canSeeStaff) {
      masked.staffOnShift = 0; // Redacted for Waiter/Kitchen
    }

    return masked;
  }

  // ─── GET /ai/usage logic ─────────────────────────────────────────────────────
  async getUsage(organizationId: string, branchId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);

    const [todayCount, monthCount, tokenStats] = await Promise.all([
      this.aiQueryModel.countDocuments({ branchId, createdAt: { $gte: today } }),
      this.aiQueryModel.countDocuments({ branchId, createdAt: { $gte: firstOfMonth } }),
      this.aiQueryModel.aggregate([
        { $match: { branchId: new (require('mongoose').Types.ObjectId)(branchId), status: 'success' } },
        { $group: { _id: null, total: { $sum: '$totalTokens' } } }
      ])
    ]);

    return {
      todayCount,
      monthCount,
      totalTokens: tokenStats[0]?.total || 0,
    };
  }

  private async getBranchContext(orgId: string, branchId: string, userRole: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [branch, revenueData, orderCounts, activeOrderCount, staffCount, lowStock, topItem] = await Promise.all([
      this.branchModel.findById(branchId).lean(),
      this.billModel.aggregate([
        { $match: { branchId: new (require('mongoose').Types.ObjectId)(branchId), status: BillStatus.PAID, createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: '$total.amount' }, currency: { $first: '$total.currency' } } }
      ]),
      this.orderModel.countDocuments({ branchId, createdAt: { $gte: today } }),
      this.orderModel.countDocuments({ branchId, status: OrderStatus.ACTIVE }),
      this.userModel.countDocuments({ branchId, currentShift: { $ne: null } }),
      this.menuItemModel.find({ branchId, inStock: false }).limit(5).lean(),
      this.billModel.aggregate([
        { $match: { branchId: new (require('mongoose').Types.ObjectId)(branchId), createdAt: { $gte: today } } },
        { $unwind: '$items' },
        { $group: { _id: '$items.name', count: { $sum: '$items.quantity' } } },
        { $sort: { count: -1 } },
        { $limit: 1 }
      ])
    ]);

    return {
      date: new Date(),
      userRole,
      branchName: branch?.name || 'Unknown',
      todayRevenue: {
        amount: revenueData[0]?.total || 0,
        currency: revenueData[0]?.currency || branch?.currency || 'NGN'
      },
      todayOrderCount: orderCounts,
      activeOrderCount,
      staffOnShift: staffCount,
      topItemToday: topItem[0]?._id || 'None',
      lowStockItems: lowStock.map(i => i.name)
    };
  }

  private async callOpenRouter(query: string, context: any, user: any) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    // Check if revenue is hidden for this role
    const revenueDisplay = context.todayRevenue.hidden 
      ? '[RESTRICTED]' 
      : `${context.todayRevenue.amount / 100} ${context.todayRevenue.currency === 'NGN' ? '₦' : context.todayRevenue.currency}`;

    const staffDisplay = (context.staffOnShift === 0 && !['owner', 'manager', 'supervisor'].includes(user.role))
      ? '[RESTRICTED]'
      : context.staffOnShift;

    const systemPrompt = `You are Ordera Intelligence, the AI assistant for ${context.branchName}.
You have access to real-time operational data for today.

Current data snapshot:
- Date: ${new Date().toLocaleDateString()}
- Revenue today: ${revenueDisplay}
- Orders today: ${context.todayOrderCount}
- Active orders: ${context.activeOrderCount}
- Staff on shift: ${staffDisplay}
- Top item today: ${context.topItemToday}
- Low stock items: ${context.lowStockItems.join(', ') || 'None'}

Current user: ${user.firstName}, role: ${user.role}

GUARDRAILS:
- If a data point shows [RESTRICTED], it means the user's role (${user.role}) is NOT authorized to see it.
- If the user asks for financial data (revenue, profit) or personnel counts and it is [RESTRICTED], politely explain that this information is only available to Managers and Owners.
- Never acknowledge the existence of the [RESTRICTED] tag itself; just speak as if you don't have access to that category of data for their role.
- Be concise (under 150 words), professional, and act as a knowledgeable operations colleague.
- Format money with ₦ for NGN.`;

    const res = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'anthropic/claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://ordera.app',
          'X-Title': 'Ordera',
          'Content-Type': 'application/json'
        }
      }
    );

    return res.data;
  }


}
