import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { ListingFiltersDto } from './dto/listing-filters.dto';
import { SearchService } from '../search/search.service';
import { ListingRateLimitService } from '../common/services/rate-limit.service';
import { generateListingSlug } from '../common/utils/slug.util';
import { sanitizeDescription } from '../common/utils/sanitize.util';
import { DEFAULT_PAGE_SIZE } from '@samadal/shared-utils';

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['ACTIVE'],
  ACTIVE: ['RESERVED', 'SOLD', 'EXPIRED'],
  RESERVED: ['ACTIVE', 'SOLD'],
  SOLD: ['ACTIVE'],
  EXPIRED: ['ACTIVE'],
};

@Injectable()
export class ListingService {
  private readonly notificationServiceUrl =
    process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4005';

  constructor(
    @Inject('PRISMA') private prisma: PrismaClient,
    private searchService: SearchService,
    private rateLimitService: ListingRateLimitService,
  ) {}

  private async sendNotification(payload: {
    userId: string;
    type: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await fetch(`${this.notificationServiceUrl}/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Key': process.env.INTERNAL_API_KEY || '',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });
    } catch (err) {
      console.error('[listing-service] Erreur envoi notification:', err);
    }
  }

  async create(userId: string, dto: CreateListingDto) {
    await this.rateLimitService.checkLimit(userId);

    const description = sanitizeDescription(dto.description);
    const locationCity = dto.locationCity || '';
    const slug = generateListingSlug(
      dto.brand,
      dto.model,
      dto.sizeEu,
      locationCity,
    );

    const listing = await this.prisma.listing.create({
      data: {
        sellerId: userId,
        slug,
        title: dto.title,
        description,
        brand: dto.brand,
        model: dto.model,
        sizeEu: dto.sizeEu,
        sizeUs: dto.sizeUs || null,
        sizeUk: dto.sizeUk || null,
        condition: dto.condition as 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR',
        color: dto.color,
        priceXof: dto.priceXof,
        locationCity,
        locationRegion: dto.locationRegion,
        status: 'DRAFT',
      },
      include: { images: true },
    });

    this.searchService.indexListing(listing).catch(() => {});

    // Update seller stats (fire and forget)
    this.updateSellerStats(userId).catch(() => {});

    return listing;
  }

  async findBySlug(slug: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { order: 'asc' } },
        seller: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    if (!listing || listing.status === 'DELETED') {
      throw new NotFoundException('Annonce non trouvee');
    }

    // Increment views (fire and forget)
    this.prisma.listing
      .update({
        where: { id: listing.id },
        data: { viewsCount: { increment: 1 } },
      })
      .catch(() => {});

    return listing;
  }

  async findById(id: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: { images: { orderBy: { order: 'asc' } } },
    });

    if (!listing) {
      throw new NotFoundException('Annonce non trouvee');
    }

    return listing;
  }

  async update(id: string, userId: string, dto: UpdateListingDto) {
    const listing = await this.findById(id);
    this.checkOwnership(listing, userId);

    if (listing.status === 'DELETED' || listing.status === 'SOLD') {
      throw new BadRequestException(
        'Impossible de modifier une annonce vendue ou supprimee',
      );
    }

    const data: Record<string, unknown> = { ...dto };

    if (dto.description) {
      data.description = sanitizeDescription(dto.description);
    }

    // Regenerate slug if key fields changed
    if (dto.brand || dto.model || dto.sizeEu || dto.locationCity) {
      data.slug = generateListingSlug(
        dto.brand || listing.brand,
        dto.model || listing.model,
        dto.sizeEu || listing.sizeEu,
        dto.locationCity || listing.locationCity,
      );
    }

    const updated = await this.prisma.listing.update({
      where: { id },
      data,
      include: { images: { orderBy: { order: 'asc' } } },
    });

    this.searchService.indexListing(updated).catch(() => {});

    return updated;
  }

  async updateStatus(
    id: string,
    userId: string,
    newStatus: string,
  ) {
    const listing = await this.findById(id);
    this.checkOwnership(listing, userId);

    const allowed = VALID_STATUS_TRANSITIONS[listing.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Transition de ${listing.status} vers ${newStatus} non autorisee`,
      );
    }

    const updated = await this.prisma.listing.update({
      where: { id },
      data: { status: newStatus as 'ACTIVE' | 'SOLD' | 'RESERVED' },
      include: { images: { orderBy: { order: 'asc' } } },
    });

    this.searchService.indexListing(updated).catch(() => {});

    // Notifier le vendeur quand l'annonce est publiee
    if (newStatus === 'ACTIVE') {
      this.sendNotification({
        userId: listing.sellerId,
        type: 'NEW_LISTING_PUBLISHED',
        title: 'Annonce publiee !',
        body: `Votre annonce "${updated.title}" est maintenant en ligne.`,
        data: {
          listingTitle: updated.title,
          listingSlug: updated.slug,
        },
      }).catch(() => {});
    }

    // Update seller stats (fire and forget)
    this.updateSellerStats(listing.sellerId).catch(() => {});

    return updated;
  }

  async softDelete(id: string, userId: string, userRole: string) {
    const listing = await this.findById(id);

    if (listing.sellerId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Vous ne pouvez supprimer que vos propres annonces',
      );
    }

    const updated = await this.prisma.listing.update({
      where: { id },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });

    this.searchService.removeListing(id).catch(() => {});

    // Update seller stats (fire and forget)
    this.updateSellerStats(listing.sellerId).catch(() => {});

    return updated;
  }

  async activateAfterPayment(id: string, expiresAt: Date) {
    const listing = await this.prisma.listing.update({
      where: { id },
      data: { status: 'ACTIVE', expiresAt },
      include: { images: { orderBy: { order: 'asc' } } },
    });
    this.searchService.indexListing(listing).catch(() => {});
    this.updateSellerStats(listing.sellerId).catch(() => {});

    // Notifier le vendeur que son annonce est en ligne apres paiement
    this.sendNotification({
      userId: listing.sellerId,
      type: 'NEW_LISTING_PUBLISHED',
      title: 'Annonce publiee !',
      body: `Votre annonce "${listing.title}" est maintenant en ligne.`,
      data: {
        listingTitle: listing.title,
        listingSlug: listing.slug,
      },
    }).catch(() => {});

    return listing;
  }

  async reindexListing(id: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: { images: { orderBy: { order: 'asc' } } },
    });
    if (listing && listing.status !== 'DELETED') {
      await this.searchService.indexListing(listing);
    }
  }

  private async updateSellerStats(userId: string) {
    const [totalListings, totalSales] = await Promise.all([
      this.prisma.listing.count({
        where: { sellerId: userId, status: { not: 'DELETED' } },
      }),
      this.prisma.listing.count({
        where: { sellerId: userId, status: 'SOLD' },
      }),
    ]);

    await this.prisma.sellerStats.updateMany({
      where: { userId },
      data: { totalListings, totalSales },
    });
  }

  async findMyListings(userId: string, filters: ListingFiltersDto) {
    const limit = Math.min(filters.limit || DEFAULT_PAGE_SIZE, 100);

    const where: Record<string, unknown> = {
      sellerId: userId,
      status: { not: 'DELETED' },
    };

    const listings = await this.prisma.listing.findMany({
      where,
      include: { images: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
    });

    const hasMore = listings.length > limit;
    const data = hasMore ? listings.slice(0, limit) : listings;

    return {
      data,
      cursor: hasMore ? data[data.length - 1].id : null,
      hasMore,
    };
  }

  async search(filters: ListingFiltersDto) {
    return this.searchService.search(filters);
  }

  private checkOwnership(
    listing: { sellerId: string },
    userId: string,
  ): void {
    if (listing.sellerId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que vos propres annonces',
      );
    }
  }
}
