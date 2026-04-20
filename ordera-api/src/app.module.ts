import { Module, MiddlewareConsumer, RequestMethod, Controller, Get } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PlatformModule } from './modules/platform/platform.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { SubdomainMiddleware } from './common/middleware/subdomain.middleware';

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
