import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reconciliation } from './reconciliation.schema';
import { BusinessDay } from '../scheduling/business-day.schema';
import { Bill } from '../billing/schemas/bill.schema';
import { ReconciliationStatus } from '../../common/enums/reconciliation-status.enum';
import { ReconciliationLineStatus } from '../../common/enums/reconciliation-line-status.enum';
import { BillStatus } from '../../common/enums/bill-status.enum';
import { PaymentMethod } from '../../common/enums/payment-method.enum';
import { format } from 'date-fns';

@Injectable()
export class ReconciliationService {
  constructor(
    @InjectModel(Reconciliation.name) private readonly reconModel: Model<Reconciliation>,
    @InjectModel(BusinessDay.name) private readonly businessDayModel: Model<BusinessDay>,
    @InjectModel(Bill.name) private readonly billModel: Model<Bill>,
  ) {}

  async openReconciliation(branchId: string, organizationId: string, userId: string) {
    // 1. Find active business day
    const businessDay = await this.businessDayModel.findOne({
      branchId: new Types.ObjectId(branchId),
      status: 'OPEN',
    });

    if (!businessDay) {
      throw new NotFoundException('No active business day found for this branch');
    }

    // Check if reconciliation already exists for this business day
    const existing = await this.reconModel.findOne({
      businessDayId: businessDay._id,
    });

    if (existing) {
      return existing;
    }

    // 2. Fetch all PAID bills for today in this branch
    const bills = await this.billModel.find({
      branchId: new Types.ObjectId(branchId),
      status: BillStatus.PAID,
      createdAt: { $gte: businessDay.actualOpen || businessDay.date },
    });

    // 3. Group by Waiter
    const waiterMap = new Map<string, any>();

    bills.forEach((bill) => {
      const waiterId = bill.waiterId.toString();
      if (!waiterMap.has(waiterId)) {
        waiterMap.set(waiterId, {
          waiterId: bill.waiterId,
          waiterName: bill.waiterName,
          expectedCash: 0,
          expectedCard: 0,
          expectedTransfer: 0,
        });
      }

      const entry = waiterMap.get(waiterId);
      const amount = bill.total.amount;

      if (bill.payment?.method === PaymentMethod.CASH) entry.expectedCash += amount;
      if (bill.payment?.method === PaymentMethod.CARD) entry.expectedCard += amount;
      if (bill.payment?.method === PaymentMethod.TRANSFER) entry.expectedTransfer += amount;
    });

    const lines = Array.from(waiterMap.values()).map((w) => ({
      ...w,
      expectedCash: { amount: w.expectedCash, currency: 'NGN' },
      expectedCard: { amount: w.expectedCard, currency: 'NGN' },
      expectedTransfer: { amount: w.expectedTransfer, currency: 'NGN' },
      expectedTotal: { amount: w.expectedCash + w.expectedCard + w.expectedTransfer, currency: 'NGN' },
      actualCash: { amount: 0, currency: 'NGN' },
      actualCard: { amount: 0, currency: 'NGN' },
      actualTransfer: { amount: 0, currency: 'NGN' },
      actualTotal: { amount: 0, currency: 'NGN' },
      discrepancy: { amount: -(w.expectedCash + w.expectedCard + w.expectedTransfer), currency: 'NGN' },
      status: ReconciliationLineStatus.PENDING,
    }));

    const totalExpected = lines.reduce((acc, l) => acc + l.expectedTotal.amount, 0);

    const recon = new this.reconModel({
      organizationId: new Types.ObjectId(organizationId),
      branchId: new Types.ObjectId(branchId),
      businessDayId: businessDay._id,
      businessDayName: format(businessDay.date, 'MMMM do, yyyy'),
      status: ReconciliationStatus.OPEN,
      lines,
      totalExpected: { amount: totalExpected, currency: 'NGN' },
      totalActual: { amount: 0, currency: 'NGN' },
      totalDiscrepancy: { amount: -totalExpected, currency: 'NGN' },
      openedByUserId: new Types.ObjectId(userId),
    });

    return recon.save();
  }

  async getActiveReconciliation(branchId: string) {
    return this.reconModel.findOne({
      branchId: new Types.ObjectId(branchId),
      status: { $in: [ReconciliationStatus.OPEN, ReconciliationStatus.IN_REVIEW] },
    }).sort({ createdAt: -1 });
  }

  async verifyLine(id: string, waiterId: string, actuals: { cash: number; card: number; transfer: number }) {
    const recon = await this.reconModel.findById(id);
    if (!recon) throw new NotFoundException('Reconciliation not found');

    const line = recon.lines.find((l) => l.waiterId.toString() === waiterId);
    if (!line) throw new NotFoundException('Waiter line not found');

    line.actualCash.amount = actuals.cash;
    line.actualCard.amount = actuals.card;
    line.actualTransfer.amount = actuals.transfer;
    line.actualTotal.amount = actuals.cash + actuals.card + actuals.transfer;
    line.discrepancy.amount = line.actualTotal.amount - line.expectedTotal.amount;
    line.status = ReconciliationLineStatus.VERIFIED;

    this.calculateTotals(recon);
    return recon.save();
  }

  async flagLine(id: string, waiterId: string, reason: string) {
    const recon = await this.reconModel.findById(id);
    if (!recon) throw new NotFoundException('Reconciliation not found');

    const line = recon.lines.find((l) => l.waiterId.toString() === waiterId);
    if (!line) throw new NotFoundException('Waiter line not found');

    line.status = ReconciliationLineStatus.FLAGGED;
    line.flagReason = reason;

    return recon.save();
  }

  async completeReconciliation(id: string, userId: string) {
    const recon = await this.reconModel.findById(id);
    if (!recon) throw new NotFoundException('Reconciliation not found');

    const allProcessed = recon.lines.every((l) => l.status !== ReconciliationLineStatus.PENDING);
    if (!allProcessed) {
      throw new BadRequestException('All lines must be verified or flagged before completing');
    }

    const hasFlags = recon.lines.some((l) => l.status === ReconciliationLineStatus.FLAGGED);
    recon.status = hasFlags ? ReconciliationStatus.FLAGGED : ReconciliationStatus.COMPLETED;
    recon.closedByUserId = new Types.ObjectId(userId);

    return recon.save();
  }

  async getHistory(branchId: string) {
    return this.reconModel.find({
      branchId: new Types.ObjectId(branchId),
      status: { $in: [ReconciliationStatus.COMPLETED, ReconciliationStatus.FLAGGED] },
    }).sort({ createdAt: -1 }).limit(20);
  }

  private calculateTotals(recon: Reconciliation) {
    const totalActual = recon.lines.reduce((acc, l) => acc + l.actualTotal.amount, 0);
    recon.totalActual.amount = totalActual;
    recon.totalDiscrepancy.amount = totalActual - recon.totalExpected.amount;
  }
}
