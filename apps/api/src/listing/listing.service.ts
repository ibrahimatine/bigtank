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
import { NotificationService } from '../notification/notification.service';
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
  constructor(
    @Inject('PRISMA') private prisma: PrismaClient,
    private searchService: SearchService,
    private notificationService: NotificationService,
    private rateLimitService: ListingRateLimitService,
  ) {}

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
        expiresAt: new Date(Date.now() + 60 * 86400000),
      },
      include: { images: true },
    });

    this.searchService.indexListing(listing).catch(() => {});
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

  async updateStatus(id: string, userId: string, newStatus: string) {
    const listing = await this.findById(id);
    this.checkOwnership(listing, userId);

    const allowed = VALID_STATUS_TRANSITIONS[listing.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Transition de ${listing.status} vers ${newStatus} non autorisee`,
      );
    }

    // Verifier qu'il y a au moins 1 image pour publier
    if (newStatus === 'ACTIVE') {
      const imageCount = await this.prisma.listingImage.count({
        where: { listingId: id },
      });
      if (imageCount === 0) {
        throw new BadRequestException(
          'Au moins une image est requise pour publier une annonce',
        );
      }
    }

    const updated = await this.prisma.listing.update({
      where: { id },
      data: { status: newStatus as 'ACTIVE' | 'SOLD' | 'RESERVED' },
      include: { images: { orderBy: { order: 'asc' } } },
    });

    this.searchService.indexListing(updated).catch(() => {});

    if (newStatus === 'ACTIVE') {
      this.notificationService.createAndSend({
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
    this.updateSellerStats(listing.sellerId).catch(() => {});

    return updated;
  }

  async activateAfterPayment(id: string, expiresAt: Date) {
    const imageCount = await this.prisma.listingImage.count({
      where: { listingId: id },
    });
    if (imageCount === 0) {
      throw new BadRequestException(
        'Au moins une image est requise pour publier une annonce',
      );
    }

    const listing = await this.prisma.listing.update({
      where: { id },
      data: { status: 'ACTIVE', expiresAt },
      include: { images: { orderBy: { order: 'asc' } } },
    });
    this.searchService.indexListing(listing).catch(() => {});
    this.updateSellerStats(listing.sellerId).catch(() => {});

    this.notificationService.createAndSend({
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

  async getMyStats(userId: string) {
    const [
      activeListings,
      soldListings,
      totalListings,
      viewsData,
      totalMessages,
      revenueData,
    ] = await Promise.all([
      this.prisma.listing.count({
        where: { sellerId: userId, status: 'ACTIVE' },
      }),
      this.prisma.listing.count({
        where: { sellerId: userId, status: 'SOLD' },
      }),
      this.prisma.listing.count({
        where: { sellerId: userId, status: { not: 'DELETED' } },
      }),
      this.prisma.listing.aggregate({
        where: { sellerId: userId, status: { not: 'DELETED' } },
        _sum: { viewsCount: true },
      }),
      this.prisma.message.count({
        where: {
          conversation: {
            OR: [{ buyerId: userId }, { sellerId: userId }],
            isSystem: false,
          },
          senderId: { not: userId },
        },
      }),
      this.prisma.listing.aggregate({
        where: { sellerId: userId, status: 'SOLD' },
        _sum: { priceXof: true },
      }),
    ]);

    return {
      activeListings,
      soldListings,
      totalListings,
      totalViews: viewsData._sum.viewsCount || 0,
      totalMessages,
      totalRevenue: revenueData._sum.priceXof || 0,
    };
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

  async findSalesHistory(userId: string, cursor?: string, limit = 20) {
    const listings = await this.prisma.listing.findMany({
      where: { sellerId: userId, status: 'SOLD' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { updatedAt: 'desc' },
      include: {
        images: { orderBy: { order: 'asc' }, take: 1 },
        listingPayments: { where: { status: 'COMPLETED' }, take: 1 },
      },
    });

    const hasMore = listings.length > limit;
    if (hasMore) listings.pop();

    return {
      data: listings,
      cursor: listings.length > 0 ? listings[listings.length - 1].id : null,
      hasMore,
    };
  }

  async findPurchaseHistory(userId: string, cursor?: string, limit = 20) {
    // Find listings where user has a conversation and listing is SOLD
    const conversations = await this.prisma.conversation.findMany({
      where: { buyerId: userId, listing: { status: 'SOLD' } },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { lastMessageAt: 'desc' },
      include: {
        listing: {
          include: {
            images: { orderBy: { order: 'asc' }, take: 1 },
            seller: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
    });

    const hasMore = conversations.length > limit;
    if (hasMore) conversations.pop();

    return {
      data: conversations.map(c => ({
        ...c.listing,
        conversationId: c.id,
        lastMessageAt: c.lastMessageAt,
      })),
      cursor: conversations.length > 0 ? conversations[conversations.length - 1].id : null,
      hasMore,
    };
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
