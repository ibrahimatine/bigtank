import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Headers,
  ForbiddenException,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { IsString, MinLength } from 'class-validator';

class SuspendUserDto {
  @IsString()
  @MinLength(5)
  reason!: string;
}

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Garde ADMIN — vérifie le header injecté par le gateway
  private requireAdmin(role: string | undefined) {
    if (role !== 'ADMIN') {
      throw new ForbiddenException('Accès réservé aux administrateurs');
    }
  }

  // ── Stats ──────────────────────────────────────
  @Get('stats')
  getStats(@Headers('x-user-role') role: string) {
    this.requireAdmin(role);
    return this.adminService.getStats();
  }

  // ── Users ──────────────────────────────────────
  @Get('users')
  getUsers(
    @Headers('x-user-role') role: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('role') userRole?: string,
    @Query('status') status?: string,
  ) {
    this.requireAdmin(role);
    return this.adminService.getUsers({
      page,
      limit: Math.min(limit, 100),
      search,
      role: userRole,
      status,
    });
  }

  @Get('users/:id')
  getUserById(
    @Headers('x-user-role') role: string,
    @Param('id') id: string,
  ) {
    this.requireAdmin(role);
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id/suspend')
  suspendUser(
    @Headers('x-user-role') role: string,
    @Headers('x-user-id') adminId: string,
    @Param('id') userId: string,
    @Body() dto: SuspendUserDto,
  ) {
    this.requireAdmin(role);
    return this.adminService.suspendUser(adminId, userId, dto.reason);
  }

  @Patch('users/:id/activate')
  activateUser(
    @Headers('x-user-role') role: string,
    @Headers('x-user-id') adminId: string,
    @Param('id') userId: string,
  ) {
    this.requireAdmin(role);
    return this.adminService.activateUser(adminId, userId);
  }

  // ── Listings ───────────────────────────────────
  @Get('listings')
  getListings(
    @Headers('x-user-role') role: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    this.requireAdmin(role);
    return this.adminService.getListings({
      page,
      limit: Math.min(limit, 100),
      search,
      status,
    });
  }

  @Patch('listings/:id/status')
  updateListingStatus(
    @Headers('x-user-role') role: string,
    @Headers('x-user-id') adminId: string,
    @Param('id') listingId: string,
    @Body() body: { status: string },
  ) {
    this.requireAdmin(role);
    return this.adminService.updateListingStatus(adminId, listingId, body.status);
  }

  @Delete('listings/:id')
  deleteListing(
    @Headers('x-user-role') role: string,
    @Headers('x-user-id') adminId: string,
    @Param('id') listingId: string,
  ) {
    this.requireAdmin(role);
    return this.adminService.deleteListing(adminId, listingId);
  }

  // ── Audit Logs ─────────────────────────────────
  @Get('audit-logs')
  getAuditLogs(
    @Headers('x-user-role') role: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    this.requireAdmin(role);
    return this.adminService.getAuditLogs({ page, limit: Math.min(limit, 100) });
  }
}
