import {
  Controller,
  Get,
  Post,
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
import { IsString, MinLength, IsOptional, IsEnum } from 'class-validator';

class SuspendUserDto {
  @IsString()
  @MinLength(5)
  reason!: string;
}

class BanUserDto {
  @IsString()
  @MinLength(5)
  reason!: string;
}

class ReviewReportDto {
  @IsString()
  @IsEnum(['DELETE_LISTING', 'BAN_SELLER', 'REVIEW_ONLY'])
  action!: string;
}

class MassEmailDto {
  @IsString()
  @MinLength(3)
  subject!: string;

  @IsString()
  @MinLength(10)
  body!: string;
}

class BanIpDto {
  @IsString()
  ip!: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
  ) {}

  // ============ Stats ============

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  // ============ Users ============

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

  @Get('users/:id/listings')
  getUserListings(
    @Param('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.adminService.getUserListings(userId, { page, limit: Math.min(limit, 100) });
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

  @Patch('users/:id/ban')
  banUser(
    @CurrentUser() user: { id: string },
    @Param('id') userId: string,
    @Body() dto: BanUserDto,
  ) {
    return this.adminService.banUser(user.id, userId, dto.reason);
  }

  @Patch('users/:id/unban')
  unbanUser(
    @CurrentUser() user: { id: string },
    @Param('id') userId: string,
  ) {
    return this.adminService.unbanUser(user.id, userId);
  }

  @Delete('users/:id')
  deleteUser(
    @CurrentUser() user: { id: string },
    @Param('id') userId: string,
  ) {
    return this.adminService.deleteUser(user.id, userId);
  }

  // ============ Listings ============

  @Get('listings')
  getListings(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    return this.adminService.getListings({
      page,
      limit: Math.min(limit, 100),
      search,
      status,
      includeDeleted: includeDeleted === 'true',
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

  @Patch('listings/:id/restore')
  restoreListing(
    @CurrentUser() user: { id: string },
    @Param('id') listingId: string,
  ) {
    return this.adminService.restoreListing(user.id, listingId);
  }

  @Patch('listings/:id/feature')
  toggleFeatureListing(
    @CurrentUser() user: { id: string },
    @Param('id') listingId: string,
  ) {
    return this.adminService.toggleFeatureListing(user.id, listingId);
  }

  @Delete('listings/:id')
  deleteListing(
    @CurrentUser() user: { id: string },
    @Param('id') listingId: string,
  ) {
    return this.adminService.deleteListing(user.id, listingId);
  }

  // ============ Reports ============

  @Get('reports')
  getReports(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ) {
    return this.adminService.getReports({ page, limit: Math.min(limit, 100), status });
  }

  @Patch('reports/:id/review')
  reviewReport(
    @CurrentUser() user: { id: string },
    @Param('id') reportId: string,
    @Body() dto: ReviewReportDto,
  ) {
    return this.adminService.reviewReport(user.id, reportId, dto.action);
  }

  @Patch('reports/:id/dismiss')
  dismissReport(
    @CurrentUser() user: { id: string },
    @Param('id') reportId: string,
  ) {
    return this.adminService.dismissReport(user.id, reportId);
  }

  // ============ Tools ============

  @Post('tools/mass-email')
  sendMassEmail(
    @CurrentUser() user: { id: string },
    @Body() dto: MassEmailDto,
  ) {
    return this.adminService.sendMassEmail(user.id, dto.subject, dto.body);
  }

  @Get('tools/banned-ips')
  getBannedIps() {
    return this.adminService.getBannedIps();
  }

  @Post('tools/ban-ip')
  banIp(
    @CurrentUser() user: { id: string },
    @Body() dto: BanIpDto,
  ) {
    return this.adminService.banIp(user.id, dto.ip, dto.reason);
  }

  @Delete('tools/ban-ip/:id')
  unbanIp(@Param('id') id: string) {
    return this.adminService.unbanIp(id);
  }

  @Post('tools/cleanup-inactive')
  cleanupInactive(
    @Body() body: { confirm?: boolean },
  ) {
    return this.adminService.cleanupInactive(body.confirm || false);
  }

  // ============ Search / Audit ============

  @Post('reindex')
  async reindexSearch() {
    return { message: 'Reindexation non necessaire — recherche via PostgreSQL' };
  }

  @Post('reindex/:listingId')
  async reindexOneListing(@Param('listingId') listingId: string) {
    return { message: `Reindexation non necessaire pour ${listingId} — recherche via PostgreSQL` };
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
