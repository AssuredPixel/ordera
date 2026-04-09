import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MenuModule } from './modules/menu/menu.module';
import { OrdersModule } from './modules/orders/orders.module';
import { BillsModule } from './modules/bills/bills.module';
import { MessagesModule } from './modules/messages/messages.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { BranchesModule } from './modules/branches/branches.module';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ordera',
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
        connectionFactory: (connection) => {
          connection.on('connected', () => {
            console.log('[Mongoose] Successfully connected to MongoDB Atlas');
          });
          connection.on('error', (error) => {
            console.error('[Mongoose] Connection error:', error);
          });
          connection.on('disconnected', () => {
            console.warn('[Mongoose] Disconnected from MongoDB');
          });
          return connection;
        },
      }),
    }),


    AuthModule,
    UsersModule,
    MenuModule,
    OrdersModule,
    BillsModule,
    MessagesModule,
    DashboardModule,
    BranchesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
