import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShiftTemplate, ShiftTemplateSchema } from './shift-template.schema';
import { Shift, ShiftSchema } from './shift.schema';
import { BusinessDay, BusinessDaySchema } from './business-day.schema';
import {
  ShiftTemplatesService,
  ShiftsService,
  BusinessDaysService,
} from './scheduling.service';
import {
  ShiftTemplatesController,
  ShiftTemplatesMutationController,
  ShiftsController,
  ShiftsMutationController,
  BusinessDaysController,
  BusinessDaysMutationController,
} from './scheduling.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ShiftTemplate.name, schema: ShiftTemplateSchema },
      { name: Shift.name, schema: ShiftSchema },
      { name: BusinessDay.name, schema: BusinessDaySchema },
    ]),
  ],
  controllers: [
    ShiftTemplatesController,
    ShiftTemplatesMutationController,
    ShiftsController,
    ShiftsMutationController,
    BusinessDaysController,
    BusinessDaysMutationController,
  ],
  providers: [ShiftTemplatesService, ShiftsService, BusinessDaysService],
  exports: [ShiftTemplatesService, ShiftsService, BusinessDaysService],
})
export class SchedulingModule {}
