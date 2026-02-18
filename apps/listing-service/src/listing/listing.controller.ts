import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ListingService } from './listing.service';
import { ImageService } from '../image/image.service';
import { GatewayAuthGuard } from '../common/guards/gateway-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ListingFiltersDto } from './dto/listing-filters.dto';
import { PresignRequestDto } from '../image/dto/presign-request.dto';
import { ConfirmImageDto } from '../image/dto/confirm-image.dto';

@Controller('listings')
export class ListingController {
  constructor(
    private listingService: ListingService,
    private imageService: ImageService,
  ) {}

  // === PUBLIC (pas d'auth) ===

  @Get('search')
  async search(@Query() filters: ListingFiltersDto) {
    return this.listingService.search(filters);
  }

  @Get('my')
  @UseGuards(GatewayAuthGuard)
  async myListings(
    @CurrentUser() user: { id: string },
    @Query() filters: ListingFiltersDto,
  ) {
    return this.listingService.findMyListings(user.id, filters);
  }

  @Get('my/:id')
  @UseGuards(GatewayAuthGuard)
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

  // === AUTHENTIFIE ===

  @Post()
  @UseGuards(GatewayAuthGuard, RolesGuard)
  @Roles('SELLER', 'ADMIN')
  async create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateListingDto,
  ) {
    return this.listingService.create(user.id, dto);
  }

  @Patch(':id')
  @UseGuards(GatewayAuthGuard)
  async update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateListingDto,
  ) {
    return this.listingService.update(id, user.id, dto);
  }

  @Patch(':id/status')
  @UseGuards(GatewayAuthGuard)
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateStatusDto,
  ) {
    return this.listingService.updateStatus(id, user.id, dto.status);
  }

  @Delete(':id')
  @UseGuards(GatewayAuthGuard)
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.listingService.softDelete(id, user.id, user.role);
  }

  // === IMAGES ===

  @Post(':id/images/presign')
  @UseGuards(GatewayAuthGuard)
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
  @UseGuards(GatewayAuthGuard)
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

    // Re-index to update thumbnailUrl
    this.listingService.reindexListing(id).catch(() => {});

    return result;
  }

  @Delete(':id/images/:imageId')
  @UseGuards(GatewayAuthGuard)
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

    // Re-index to update thumbnailUrl
    this.listingService.reindexListing(id).catch(() => {});

    return { message: 'Image supprimee' };
  }
}
