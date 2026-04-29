import {
  Injectable,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AIQuery } from './schemas/ai-query.schema';
import { Bill } from '../billing/schemas/bill.schema';
import { Order } from '../ordering/schemas/order.schema';
import { MenuItem } from '../menu/schemas/menu-item.schema';
import { User } from '../users/user.schema';
import { Shift } from '../scheduling/shift.schema';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { BillStatus } from '../../common/enums/bill-status.enum';
import { StockStatus } from '../../common/enums/stock-status.enum';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class IntelligenceService {
  constructor(
    @InjectModel(AIQuery.name) private readonly aiQueryModel: Model<AIQuery>,
    @InjectModel(Bill.name) private readonly billModel: Model<Bill>,
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(MenuItem.name) private readonly menuItemModel: Model<MenuItem>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Shift.name) private readonly shiftModel: Model<Shift>,
    private readonly configService: ConfigService,
  ) {}

  async query(user: any, question: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Rate Limit Check
    const queryCount = await this.aiQueryModel.countDocuments({
      userId: user.userId,
      createdAt: { $gte: today },
    });

    if (queryCount >= 30) {
      await this.aiQueryModel.create({
        organizationId: user.organizationId,
        branchId: user.branchId,
        userId: user.userId,
        query: question,
        context: { queryDate: new Date(), userRole: user.role, branchName: 'N/A' }, // Minimal context for rate limit log
        status: 'rate_limited',
      });
      throw new HttpException('Daily query limit reached (30 queries/day)', HttpStatus.TOO_MANY_REQUESTS);
    }

    const startTime = Date.now();

    try {
      // 2. Build Context
      const context = await this.buildContext(user);

      // 3. System Prompt
      const systemPrompt = `You are Ordera Intelligence, the AI assistant for ${context.branchName}.
Staff member: ${user.firstName}, Role: ${user.role}.

Current operational data:
Period: ${context.periodLabel}
Revenue: ₦${(context.todayRevenue.amount / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
Orders today: ${context.todayOrderCount}
Active orders: ${context.activeOrderCount}
Staff on shift: ${context.staffOnShift}
Top item today: ${context.topItemToday || 'None yet'}
Low stock items: ${context.lowStockItems.join(', ') || 'None'}
Out of stock items: ${context.finishedStockItems.join(', ') || 'None'}
Reconciliation pending: ${context.pendingReconciliation ? 'Yes' : 'No'}

Rules:
- Answer in under 150 words unless a table is needed
- Format money as ₦X,XXX.XX
- Never say 'As an AI' or 'I am an AI'
- Speak like a knowledgeable colleague, not a chatbot
- If you cannot answer from the data provided, say so directly`;

      // 4. Call OpenRouter
      const apiKey = this.configService.get<string>('OPENROUTER_API_KEY');
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'anthropic/claude-3.5-sonnet',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: question },
          ],
          max_tokens: 500,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://ordera.app',
            'X-Title': 'Ordera Intelligence',
          },
        },
      );

      const aiData = response.data.choices[0].message.content;
      const usage = response.data.usage;
      const latency = Date.now() - startTime;

      // 5. Cost Estimation (Naira)
      // Rates: $3/1M input, $15/1M output
      const costUsd = (usage.prompt_tokens * 0.000003) + (usage.completion_tokens * 0.000015);
      const conversionRate = this.configService.get<number>('NAIRA_USD_RATE') || 1550;
      const costNaira = costUsd * conversionRate;

      // 6. Save and Return
      const savedQuery = await this.aiQueryModel.create({
        organizationId: user.organizationId,
        branchId: user.branchId,
        userId: user.userId,
        query: question,
        context,
        response: aiData,
        aiModel: 'anthropic/claude-3.5-sonnet',
        inputTokens: usage.prompt_tokens,
        outputTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
        estimatedCostNaira: costNaira,
        latencyMs: latency,
        status: 'success',
      });

      return {
        response: aiData,
        queryId: savedQuery._id,
      };
    } catch (error) {
      console.error('AI Query Error:', error.response?.data || error.message);
      
      await this.aiQueryModel.create({
        organizationId: user.organizationId,
        branchId: user.branchId,
        userId: user.userId,
        query: question,
        context: { queryDate: new Date(), userRole: user.role, branchName: 'ErrorCtx' },
        status: 'error',
        errorMessage: error.message,
      });

      throw new InternalServerErrorException('Failed to process AI query');
    }
  }

  private async buildContext(user: any): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const matchFilter = {
      branchId: new Types.ObjectId(user.branchId),
      createdAt: { $gte: today },
    };

    // Revenue
    const revenueAggregation = await this.billModel.aggregate([
      { $match: { ...matchFilter, status: BillStatus.PAID } },
      { $group: { _id: null, total: { $sum: '$total.amount' } } },
    ]);
    const todayRevenue = { amount: revenueAggregation[0]?.total || 0, currency: 'NGN' };

    // Order Counts
    const todayOrderCount = await this.orderModel.countDocuments(matchFilter);
    const activeOrderCount = await this.orderModel.countDocuments({
      branchId: user.branchId,
      status: { $in: [OrderStatus.SENT_TO_KITCHEN, OrderStatus.IN_PREPARATION] },
    });

    // Staff on shift
    const staffOnShift = await this.userModel.countDocuments({
      branchId: user.branchId,
      currentShiftId: { $ne: null },
    });

    // Top Item Today
    const topItemAggregation = await this.orderModel.aggregate([
      { $match: matchFilter },
      { $unwind: '$items' },
      { $group: { _id: '$items.name', count: { $sum: '$items.quantity' } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);
    const topItemToday = topItemAggregation[0]?._id;

    // Stock Status
    const lowStockItems = await this.menuItemModel.find({
      branchId: user.branchId,
      stockStatus: StockStatus.LOW,
      isActive: true,
    }).distinct('name');

    const finishedStockItems = await this.menuItemModel.find({
      branchId: user.branchId,
      stockStatus: StockStatus.FINISHED,
      isActive: true,
    }).distinct('name');

    // Period Label (Current Shift)
    const activeShift = await this.shiftModel.findOne({
      branchId: user.branchId,
      status: 'open',
    });
    const periodLabel = activeShift ? `Active Shift: ${activeShift.name}` : `Day: ${today.toDateString()}`;

    // Pending Reconciliation
    // Basically any closed shift that has no reconciliation record
    const pendingReconciliation = false; // logic would involve querying reconciliations for closed shifts

    return {
      queryDate: new Date(),
      userRole: user.role,
      branchName: 'Current Branch', // In reality fetch from BranchModel
      periodLabel,
      todayRevenue,
      todayOrderCount,
      activeOrderCount,
      staffOnShift,
      topItemToday,
      lowStockItems,
      finishedStockItems,
      pendingReconciliation,
    };
  }

  async getUsage(branchId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [todayUsage, monthUsage] = await Promise.all([
      this.aiQueryModel.aggregate([
        { $match: { branchId: new Types.ObjectId(branchId), createdAt: { $gte: today }, status: 'success' } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            tokens: { $sum: '$totalTokens' },
            cost: { $sum: '$estimatedCostNaira' },
          },
        },
      ]),
      this.aiQueryModel.countDocuments({
        branchId: new Types.ObjectId(branchId),
        createdAt: { $gte: monthStart },
        status: 'success',
      }),
    ]);

    return {
      todayCount: todayUsage[0]?.count || 0,
      monthCount: monthUsage,
      totalTokens: todayUsage[0]?.tokens || 0,
      estimatedCostNaira: todayUsage[0]?.cost || 0,
    };
  }
}
