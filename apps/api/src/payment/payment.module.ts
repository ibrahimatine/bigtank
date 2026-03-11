import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { ListingModule } from '../listing/listing.module';

@Module({
  imports: [ListingModule],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
