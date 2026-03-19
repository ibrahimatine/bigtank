import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Inject,
  UseGuards,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ListingService } from './listing.service';
import { ImageService } from '../image/image.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { EmailVerifiedGuard } from '../common/guards/email-verified.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ListingFiltersDto } from './dto/listing-filters.dto';
import { PresignRequestDto } from '../image/dto/presign-request.dto';
import { ConfirmImageDto } from '../image/dto/confirm-image.dto';
import { IsString, IsOptional, IsEnum } from 'class-validator';

class ReportListingDto {
  @IsString()
  @IsEnum(['FRAUD', 'FAKE_PRODUCT', 'SPAM', 'OTHER'])
  reason!: string;

  @IsString()
  @IsOptional()
  description?: string;
}

@Controller('listings')
export class ListingController {
  constructor(
    private listingService: ListingService,
    private imageService: ImageService,
    @Inject('PRISMA') private readonly prisma: PrismaClient,
  ) {}

  @Get('search')
  async search(@Query() filters: ListingFiltersDto) {
    return this.listingService.search(filters);
  }

  @Get('sales-history')
  @UseGuards(JwtAuthGuard)
  async salesHistory(
    @CurrentUser() user: { id: string },
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.listingService.findSalesHistory(
      user.id,
      cursor,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Get('purchase-history')
  @UseGuards(JwtAuthGuard)
  async purchaseHistory(
    @CurrentUser() user: { id: string },
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.listingService.findPurchaseHistory(
      user.id,
      cursor,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Get('my/stats')
  @UseGuards(JwtAuthGuard)
  async myStats(@CurrentUser() user: { id: string }) {
    return this.listingService.getMyStats(user.id);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async myListings(
    @CurrentUser() user: { id: string },
    @Query() filters: ListingFiltersDto,
  ) {
    return this.listingService.findMyListings(user.id, filters);
  }

  @Get('my/:id')
  @UseGuards(JwtAuthGuard)
  async myListingById(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    const listing = await this.listingService.findById(id);
    if (listing.sellerId !== user.id) {
      throw new ForbiddenException('Cette annonce ne vous appartient pas');
    }
    return listing;
  }

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.listingService.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard, RolesGuard)
  @Roles('SELLER', 'ADMIN')
  async create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateListingDto,
  ) {
    return this.listingService.create(user.id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateListingDto,
  ) {
    return this.listingService.update(id, user.id, dto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateStatusDto,
  ) {
    return this.listingService.updateStatus(id, user.id, dto.status);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.listingService.softDelete(id, user.id, user.role);
  }

  @Post(':id/images/presign')
  @UseGuards(JwtAuthGuard)
  async getPresignedUrl(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: PresignRequestDto,
  ) {
    const listing = await this.listingService.findById(id);
    if (listing.sellerId !== user.id) {
      throw new ForbiddenException(
        'Vous ne pouvez ajouter des images que sur vos propres annonces',
      );
    }
    return this.imageService.generatePresignedUrl(
      id,
      dto.fileName,
      dto.contentType,
    );
  }

  @Post(':id/images/confirm')
  @UseGuards(JwtAuthGuard)
  async confirmImage(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: ConfirmImageDto,
  ) {
    const listing = await this.listingService.findById(id);
    if (listing.sellerId !== user.id) {
      throw new ForbiddenException(
        'Vous ne pouvez ajouter des images que sur vos propres annonces',
      );
    }
    const result = await this.imageService.confirmImage(
      id,
      dto.key,
      dto.order,
      dto.width,
      dto.height,
    );

    this.listingService.reindexListing(id).catch(() => {});

    return result;
  }

  @Delete(':id/images/:imageId')
  @UseGuards(JwtAuthGuard)
  async deleteImage(
    @Param('id') id: string,
    @Param('imageId') imageId: string,
    @CurrentUser() user: { id: string },
  ) {
    const listing = await this.listingService.findById(id);
    if (listing.sellerId !== user.id) {
      throw new ForbiddenException(
        'Vous ne pouvez supprimer que vos propres images',
      );
    }
    await this.imageService.deleteImage(imageId, id);

    this.listingService.reindexListing(id).catch(() => {});

    return { message: 'Image supprimee' };
  }

  @Post(':id/report')
  @UseGuards(JwtAuthGuard)
  async reportListing(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: ReportListingDto,
  ) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Annonce introuvable');
    if (listing.sellerId === user.id) {
      throw new BadRequestException('Vous ne pouvez pas signaler votre propre annonce');
    }

    const existing = await this.prisma.report.findUnique({
      where: { userId_listingId: { userId: user.id, listingId: id } },
    });
    if (existing) {
      throw new BadRequestException('Vous avez deja signale cette annonce');
    }

    const report = await this.prisma.report.create({
      data: {
        userId: user.id,
        listingId: id,
        reason: dto.reason as any,
        description: dto.description,
      },
    });

    return { message: 'Signalement enregistre', report };
  }
}
