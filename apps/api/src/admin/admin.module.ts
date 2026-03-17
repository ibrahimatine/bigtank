import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SearchModule } from '../search/search.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [SearchModule, NotificationModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
