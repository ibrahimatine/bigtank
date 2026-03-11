import { Module } from '@nestjs/common';
import { ListingController } from './listing.controller';
import { ListingService } from './listing.service';
import { ListingCronService } from './listing-cron.service';
import { ImageModule } from '../image/image.module';
import { SearchModule } from '../search/search.module';
import { NotificationModule } from '../notification/notification.module';
import { ListingRateLimitService } from '../common/services/rate-limit.service';

@Module({
  imports: [ImageModule, SearchModule, NotificationModule],
  controllers: [ListingController],
  providers: [ListingService, ListingCronService, ListingRateLimitService],
  exports: [ListingService],
})
export class ListingModule {}
