import { Module, MiddlewareConsumer, RequestMethod, Controller, Get } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PlatformModule } from './modules/platform/platform.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { BranchesModule } from './modules/branches/branches.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { SchedulingModule } from './modules/scheduling/scheduling.module';
import { OwnerModule } from './modules/owner/owner.module';
import { BillingModule } from './modules/billing/billing.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { MenuModule } from './modules/menu/menu.module';
import { OrderingModule } from './modules/ordering/ordering.module';
import { IntelligenceModule } from './modules/intelligence/intelligence.module';
import { MessagesModule } from './modules/messages/messages.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportsModule } from './modules/reports/reports.module';
import { WaiterModule } from './modules/waiter/waiter.module';
import { SubdomainMiddleware } from './common/middleware/subdomain.middleware';
import { ReconciliationModule } from './modules/reconciliation/reconciliation.module';

@Controller('ping')
class PingController {
  @Get()
  ping() {
    return { status: 'ok', time: new Date().toISOString() };
  }
}

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    PlatformModule,
    OrganizationsModule,
    UsersModule,
    AuthModule,
    BranchesModule,
    InvitationsModule,
    SchedulingModule,
    OwnerModule,
    BillingModule,
    NotificationsModule,
    MenuModule,
    OrderingModule,
    IntelligenceModule,
    MessagesModule,
    DashboardModule,
    ReportsModule,
    WaiterModule,
    ReconciliationModule,
  ],
  controllers: [PingController],
  providers: [],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SubdomainMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
