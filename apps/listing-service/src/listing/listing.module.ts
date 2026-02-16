import { Module } from '@nestjs/common';
import { ListingController } from './listing.controller';
import { ListingService } from './listing.service';
import { ImageModule } from '../image/image.module';
import { SearchModule } from '../search/search.module';
import { ListingRateLimitService } from '../common/services/rate-limit.service';

@Module({
  imports: [ImageModule, SearchModule],
  controllers: [ListingController],
  providers: [ListingService, ListingRateLimitService],
})
export class ListingModule {}
