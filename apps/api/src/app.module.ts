import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './common/database/database.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ListingModule } from './listing/listing.module';
import { ChatModule } from './chat/chat.module';
import { PaymentModule } from './payment/payment.module';
import { NotificationModule } from './notification/notification.module';
import { SearchModule } from './search/search.module';
import { ImageModule } from './image/image.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    DatabaseModule,
    HealthModule,
    AuthModule,
    UserModule,
    ListingModule,
    ChatModule,
    PaymentModule,
    NotificationModule,
    SearchModule,
    ImageModule,
    AdminModule,
  ],
})
export class AppModule {}
