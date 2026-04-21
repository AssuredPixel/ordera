import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reconciliation } from './schemas/reconciliation.schema';
import { Bill } from './schemas/bill.schema';
import { BillStatus } from '../../common/enums/bill-status.enum';
import { ReconciliationStatus } from '../../common/enums/reconciliation-status.enum';
import { PaymentMethod } from '../../common/enums/payment-method.enum';

@Injectable()
export class ReconciliationService {
  constructor(
    @InjectModel(Reconciliation.name) private readonly reconModel: Model<Reconciliation>,
    @InjectModel(Bill.name) private readonly billModel: Model<Bill>,
  ) {}

  async openReconciliation(user: any, data: { shiftId?: string; businessDayId?: string }) {
    const { shiftId, businessDayId } = data;
    if (!shiftId && !businessDayId) throw new BadRequestException('Shift or Business Day ID required');

    // 1. Check for existing
    const filter: any = { branchId: user.branchId };
    if (shiftId) filter.shiftId = new Types.ObjectId(shiftId);
    else filter.businessDayId = new Types.ObjectId(businessDayId);

    const existing = await this.reconModel.findOne(filter);
    if (existing) throw new ConflictException('Reconciliation already exists for this period');

    // 2. Aggregate bills to auto-populate lines
    const billFilter: any = { 
      branchId: new Types.ObjectId(user.branchId), 
      status: BillStatus.PAID 
    };
    if (shiftId) billFilter.shiftId = new Types.ObjectId(shiftId);
    else billFilter.businessDayId = new Types.ObjectId(businessDayId);

    const aggregation = await this.billModel.aggregate([
      { $match: billFilter },
      {
        $group: {
          _id: '$waiterId',
          waiterName: { $first: '$waiterName' },
          cash: {
            $sum: {
              $cond: [{ $eq: ['$payment.method', PaymentMethod.CASH] }, '$payment.amountPaid.amount', 0]
            }
          },
          card: {
            $sum: {
              $cond: [{ $eq: ['$payment.method', PaymentMethod.CARD] }, '$payment.amountPaid.amount', 0]
            }
          },
          transfer: {
            $sum: {
              $cond: [{ $eq: ['$payment.method', PaymentMethod.TRANSFER] }, '$payment.amountPaid.amount', 0]
            }
          }
        }
      }
    ]);

    const lines = aggregation.map(item => {
      const expectedTotal = item.cash + item.card + item.transfer;
      const zeroMoney = { amount: 0, currency: 'NGN' };
      
      return {
        waiterId: item._id,
        waiterName: item.waiterName,
        expectedCash: { amount: item.cash, currency: 'NGN' },
        expectedCard: { amount: item.card, currency: 'NGN' },
        expectedTransfer: { amount: item.transfer, currency: 'NGN' },
        actualCash: zeroMoney,
        actualCard: zeroMoney,
        actualTransfer: zeroMoney,
        cashDiscrepancy: { amount: -item.cash, currency: 'NGN' },
        cardDiscrepancy: { amount: -item.card, currency: 'NGN' },
        transferDiscrepancy: { amount: -item.transfer, currency: 'NGN' },
        totalExpected: { amount: expectedTotal, currency: 'NGN' },
        totalActual: zeroMoney,
        totalDiscrepancy: { amount: -expectedTotal, currency: 'NGN' },
        hasDiscrepancy: expectedTotal > 0,
        status: 'pending'
      };
    });

    const totalExpectedAmount = lines.reduce((acc, l) => acc + l.totalExpected.amount, 0);

    const recon = await this.reconModel.create({
      organizationId: user.organizationId,
      branchId: user.branchId,
      period: shiftId ? 'shift' : 'day',
      shiftId: shiftId ? new Types.ObjectId(shiftId) : undefined,
      businessDayId: businessDayId ? new Types.ObjectId(businessDayId) : undefined,
      performedByUserId: user.userId,
      lines,
      totalExpected: { amount: totalExpectedAmount, currency: 'NGN' },
      totalActual: { amount: 0, currency: 'NGN' },
      totalDiscrepancy: { amount: -totalExpectedAmount, currency: 'NGN' },
      hasDiscrepancy: totalExpectedAmount > 0,
      status: ReconciliationStatus.OPEN
    });

    // Link bills to this reconciliation
    await this.billModel.updateMany(billFilter, { $set: { reconciliationId: recon._id } });

    return recon;
  }

  async enterActuals(id: string, branchId: string, data: { waiterId: string; actualCash?: number; actualCard?: number; actualTransfer?: number; note?: string }) {
    const recon = await this.reconModel.findOne({ _id: id, branchId });
    if (!recon) throw new NotFoundException('Reconciliation not found');
    if (recon.status === ReconciliationStatus.COMPLETED) throw new BadRequestException('Reconciliation is already completed');

    const line = recon.lines.find(l => l.waiterId.toString() === data.waiterId);
    if (!line) throw new NotFoundException('Waiter line not found in this reconciliation');

    if (data.actualCash !== undefined) line.actualCash.amount = data.actualCash;
    if (data.actualCard !== undefined) line.actualCard.amount = data.actualCard;
    if (data.actualTransfer !== undefined) line.actualTransfer.amount = data.actualTransfer;
    if (data.note) line.note = data.note;

    // Recalculate line discrepancies
    line.cashDiscrepancy.amount = line.actualCash.amount - line.expectedCash.amount;
    line.cardDiscrepancy.amount = line.actualCard.amount - line.expectedCard.amount;
    line.transferDiscrepancy.amount = line.actualTransfer.amount - line.expectedTransfer.amount;
    
    line.totalActual.amount = line.actualCash.amount + line.actualCard.amount + line.actualTransfer.amount;
    line.totalDiscrepancy.amount = line.totalActual.amount - line.totalExpected.amount;
    line.hasDiscrepancy = line.totalDiscrepancy.amount !== 0;

    // Recalculate global totals
    recon.totalActual.amount = recon.lines.reduce((acc, l) => acc + l.totalActual.amount, 0);
    recon.totalDiscrepancy.amount = recon.totalActual.amount - recon.totalExpected.amount;
    recon.hasDiscrepancy = recon.totalDiscrepancy.amount !== 0;

    recon.status = ReconciliationStatus.IN_REVIEW;
    return recon.save();
  }

  async verifyLine(id: string, branchId: string, waiterId: string, status: 'verified' | 'flagged', note?: string) {
    const recon = await this.reconModel.findOne({ _id: id, branchId });
    if (!recon) throw new NotFoundException('Reconciliation not found');
    
    const line = recon.lines.find(l => l.waiterId.toString() === waiterId);
    if (!line) throw new NotFoundException('Waiter line not found');

    line.status = status;
    if (note) line.note = note;
    
    return recon.save();
  }

  async complete(id: string, branchId: string) {
    const recon = await this.reconModel.findOne({ _id: id, branchId });
    if (!recon) throw new NotFoundException('Reconciliation not found');

    const hasFlagged = recon.lines.some(l => l.status === 'flagged');
    recon.status = hasFlagged ? ReconciliationStatus.FLAGGED : ReconciliationStatus.COMPLETED;
    recon.completedAt = new Date();

    return recon.save();
  }

  async findAll(branchId: string) {
    return this.reconModel.find({ branchId: new Types.ObjectId(branchId) }).sort({ createdAt: -1 });
  }
}
