import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { IsString, MinLength } from 'class-validator';

class SuspendUserDto {
  @IsString()
  @MinLength(5)
  reason!: string;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  getUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('role') userRole?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getUsers({
      page,
      limit: Math.min(limit, 100),
      search,
      role: userRole,
      status,
    });
  }

  @Get('users/:id')
  getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id/suspend')
  suspendUser(
    @CurrentUser() user: { id: string },
    @Param('id') userId: string,
    @Body() dto: SuspendUserDto,
  ) {
    return this.adminService.suspendUser(user.id, userId, dto.reason);
  }

  @Patch('users/:id/activate')
  activateUser(
    @CurrentUser() user: { id: string },
    @Param('id') userId: string,
  ) {
    return this.adminService.activateUser(user.id, userId);
  }

  @Get('listings')
  getListings(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getListings({
      page,
      limit: Math.min(limit, 100),
      search,
      status,
    });
  }

  @Patch('listings/:id/status')
  updateListingStatus(
    @CurrentUser() user: { id: string },
    @Param('id') listingId: string,
    @Body() body: { status: string },
  ) {
    return this.adminService.updateListingStatus(user.id, listingId, body.status);
  }

  @Delete('listings/:id')
  deleteListing(
    @CurrentUser() user: { id: string },
    @Param('id') listingId: string,
  ) {
    return this.adminService.deleteListing(user.id, listingId);
  }

  @Get('audit-logs')
  getAuditLogs(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.adminService.getAuditLogs({ page, limit: Math.min(limit, 100) });
  }

  @Get('transactions')
  getTransactionLogs(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.adminService.getTransactionLogs({ page, limit: Math.min(limit, 100) });
  }
}
