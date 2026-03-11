import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AvatarService } from './avatar.service';

@Module({
  controllers: [UserController],
  providers: [UserService, AvatarService],
  exports: [UserService, AvatarService],
})
export class UserModule {}
