import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('seller/:id')
  async getPublicSellerProfile(@Param('id') id: string) {
    return this.userService.getPublicSellerProfile(id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getUserById(@Param('id') id: string) {
    return this.userService.getUserProfile(id);
  }
}
