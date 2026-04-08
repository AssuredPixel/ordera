import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MenuModule } from './menu/menu.module';
import { OrdersModule } from './orders/orders.module';
import { BillsModule } from './bills/bills.module';
import { MessagesModule } from './messages/messages.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { IdentityModule } from './identity/identity.module';

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
    IdentityModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
