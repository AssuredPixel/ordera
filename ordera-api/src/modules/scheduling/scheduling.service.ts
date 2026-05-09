import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ShiftTemplate } from './shift-template.schema';
import { Shift } from './shift.schema';
import { BusinessDay } from './business-day.schema';
import { ShiftStatus } from '../../common/enums/shift-status.enum';
import { JwtPayload } from '../../common/types/jwt-payload.type';
import { Role } from '../../common/enums/role.enum';
import { ForbiddenException } from '@nestjs/common';

// ──────────────────────────────────── HELPER ────────────────────────────────────
function buildDateFromTimeString(base: Date, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const d = new Date(base);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

// ─────────────────────────────── SHIFT TEMPLATES ────────────────────────────────
@Injectable()
export class ShiftTemplatesService {
  constructor(
    @InjectModel(ShiftTemplate.name) private templateModel: Model<ShiftTemplate>,
  ) {}

  findAll(branchId: string) {
    return this.templateModel.find({ branchId: new Types.ObjectId(branchId), isActive: true });
  }

  create(branchId: string, organizationId: string, data: Partial<ShiftTemplate>) {
    return this.templateModel.create({
      ...data,
      branchId: new Types.ObjectId(branchId),
      organizationId: new Types.ObjectId(organizationId),
    });
  }

  async update(id: string, user: JwtPayload, data: Partial<ShiftTemplate>) {
    const template = await this.templateModel.findById(id);
    if (!template) throw new NotFoundException('ShiftTemplate not found');

    if (user.role !== Role.OWNER && user.branchId !== template.branchId.toString()) {
      throw new ForbiddenException('Access denied to this branch');
    }

    Object.assign(template, data);
    return template.save();
  }

  async softDelete(id: string, user: JwtPayload) {
    const template = await this.templateModel.findById(id);
    if (!template) throw new NotFoundException('ShiftTemplate not found');

    if (user.role !== Role.OWNER && user.branchId !== template.branchId.toString()) {
      throw new ForbiddenException('Access denied to this branch');
    }

    template.isActive = false;
    return template.save();
  }
}

// ────────────────────────────────── SHIFTS ──────────────────────────────────────
@Injectable()
export class ShiftsService {
  constructor(
    @InjectModel(ShiftTemplate.name) private templateModel: Model<ShiftTemplate>,
    @InjectModel(Shift.name) private shiftModel: Model<Shift>,
  ) {}

  findByDate(branchId: string, date: string) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return this.shiftModel.find({
      branchId: new Types.ObjectId(branchId),
      date: { $gte: start, $lte: end },
    });
  }

  async generateFromTemplates(branchId: string, organizationId: string, date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const templates = await this.templateModel.find({
      branchId: new Types.ObjectId(branchId),
      isActive: true,
    });

    if (!templates.length) {
      throw new BadRequestException('No active shift templates found for this branch');
    }

    const created: Shift[] = [];
    for (const tpl of templates) {
      // Avoid duplicates for the same template+date
      const exists = await this.shiftModel.findOne({
        branchId: new Types.ObjectId(branchId),
        templateId: tpl._id,
        date: targetDate,
      });
      if (exists) continue;

      const scheduledStart = buildDateFromTimeString(targetDate, tpl.startTime);
      let scheduledEnd = buildDateFromTimeString(targetDate, tpl.endTime);
      if (tpl.crossesMidnight) {
        scheduledEnd.setDate(scheduledEnd.getDate() + 1);
      }

      const shift = await this.shiftModel.create({
        organizationId: new Types.ObjectId(organizationId),
        branchId: new Types.ObjectId(branchId),
        templateId: tpl._id,
        name: tpl.name,
        date: targetDate,
        scheduledStart,
        scheduledEnd,
      });
      created.push(shift);
    }

    return { generated: created.length, shifts: created };
  }

  async open(id: string, user: JwtPayload) {
    const shift = await this.shiftModel.findById(id);
    if (!shift) throw new NotFoundException('Shift not found');

    if (user.role !== Role.OWNER && user.branchId !== shift.branchId.toString()) {
      throw new ForbiddenException('Access denied to this branch');
    }

    if (shift.status !== ShiftStatus.SCHEDULED) {
      throw new BadRequestException(`Shift is already ${shift.status}`);
    }
    shift.status = ShiftStatus.OPEN;
    shift.actualStart = new Date();
    shift.openedByUserId = new Types.ObjectId(user.userId);
    return shift.save();
  }

  async close(id: string, user: JwtPayload) {
    const shift = await this.shiftModel.findById(id);
    if (!shift) throw new NotFoundException('Shift not found');

    if (user.role !== Role.OWNER && user.branchId !== shift.branchId.toString()) {
      throw new ForbiddenException('Access denied to this branch');
    }

    if (shift.status !== ShiftStatus.OPEN) {
      throw new BadRequestException('Shift is not open');
    }
    shift.status = ShiftStatus.CLOSED;
    shift.actualEnd = new Date();
    shift.closedByUserId = new Types.ObjectId(user.userId);
    return shift.save();
  }
}

// ─────────────────────────────── BUSINESS DAYS ──────────────────────────────────
@Injectable()
export class BusinessDaysService {
  constructor(
    @InjectModel(BusinessDay.name) private businessDayModel: Model<BusinessDay>,
  ) {}

  findByDate(branchId: string, date: string) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return this.businessDayModel.find({
      branchId: new Types.ObjectId(branchId),
      date: { $gte: start, $lte: end },
    });
  }

  async open(branchId: string, organizationId: string, userId: string, data?: Partial<BusinessDay>) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.businessDayModel.findOne({
      branchId: new Types.ObjectId(branchId),
      date: today,
    });
    if (existing && existing.status !== ShiftStatus.SCHEDULED) {
      throw new ConflictException('A business day is already open or closed for today');
    }

    if (existing) {
      existing.status = ShiftStatus.OPEN;
      existing.actualOpen = new Date();
      existing.openedByUserId = new Types.ObjectId(userId);
      return existing.save();
    }

    return this.businessDayModel.create({
      ...data,
      branchId: new Types.ObjectId(branchId),
      organizationId: new Types.ObjectId(organizationId),
      date: today,
      status: ShiftStatus.OPEN,
      actualOpen: new Date(),
      openedByUserId: new Types.ObjectId(userId),
    });
  }

  async close(id: string, user: JwtPayload) {
    const day = await this.businessDayModel.findById(id);
    if (!day) throw new NotFoundException('BusinessDay not found');

    if (user.role !== Role.OWNER && user.branchId !== day.branchId.toString()) {
      throw new ForbiddenException('Access denied to this branch');
    }

    if (day.status !== ShiftStatus.OPEN) {
      throw new BadRequestException('BusinessDay is not currently open');
    }
    day.status = ShiftStatus.CLOSED;
    day.actualClose = new Date();
    day.closedByUserId = new Types.ObjectId(user.userId);
    return day.save();
  }
}
