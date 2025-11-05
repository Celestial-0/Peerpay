import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { NotificationController } from './notification.controller';
import { Notification } from './entities/notification.entity';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { RealtimeModule } from '../realtime/realtime.module';

/**
 * 📬 NotificationModule
 *
 * Manages all real-time and system notifications between backend, web app, and native app.
 *
 * Features:
 * - WebSocket Gateway for real-time push notifications
 * - REST API for notification CRUD operations
 * - TypeORM entity for persistent storage
 * - Integration with AuthModule for authentication
 * - Integration with UserModule for user associations
 * - Zod validation for data consistency
 * - Scalable architecture for future email/Firebase support
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    forwardRef(() => AuthModule),
    forwardRef(() => UserModule),
    forwardRef(() => RealtimeModule),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationGateway],
  exports: [NotificationService, NotificationGateway],
})
export class NotificationModule {}
