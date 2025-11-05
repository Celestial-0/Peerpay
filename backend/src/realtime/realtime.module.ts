import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RealtimeGateway } from './realtime.gateway';
import { FriendEventsService } from './services/friend-events.service';
import { TransactionEventsService } from './services/transaction-events.service';
import { NotificationEventsService } from './services/notification-events.service';
import { FriendModule } from '../friend/friend.module';
import { JWT_SECRET } from '../constants';

@Module({
  imports: [
    forwardRef(() => FriendModule),
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [
    RealtimeGateway,
    FriendEventsService,
    TransactionEventsService,
    NotificationEventsService,
  ],
  exports: [
    RealtimeGateway,
    FriendEventsService,
    TransactionEventsService,
    NotificationEventsService,
  ],
})
export class RealtimeModule {}
