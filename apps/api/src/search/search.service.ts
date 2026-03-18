import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ListingFiltersDto } from '../listing/dto/listing-filters.dto';

/**
 * Service de recherche — PostgreSQL uniquement.
 * Meilisearch a ete retire pour reduire les couts.
 * Si le trafic augmente, on pourra le re-ajouter plus tard.
 */
@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @Inject('PRISMA') private prisma: PrismaClient,
  ) {}

  // ─── Health check ──────────────────────────────────────────────

  async healthCheck(): Promise<{ status: 'ok'; engine: string }> {
    return { status: 'ok', engine: 'postgresql' };
  }

  // ─── Indexation (no-op sans Meilisearch) ────────────────────────

  async indexListing(_listing: {
    id: string;
    sellerId: string;
    slug: string;
    title: string;
    description: string;
    brand: string;
    model: string | null;
    sizeEu: number;
    priceXof: number;
    condition: string;
    color: string;
    locationCity: string;
    locationRegion: string;
    status: string;
    viewsCount: number;
    createdAt: Date;
    images?: { url: string; order: number }[];
  }): Promise<void> {
    // No-op : PostgreSQL est la source de verite, pas besoin d'indexation separee
  }

  async removeListing(_id: string): Promise<void> {
    // No-op
  }

  // ─── Recherche ─────────────────────────────────────────────────

  async search(filters: ListingFiltersDto) {
    try {
      const limit = Math.min(filters.limit || 20, 100);
      const offset = filters.cursor ? parseInt(filters.cursor, 10) : 0;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = { status: 'ACTIVE' };

      if (filters.brand) where.brand = filters.brand;
      if (filters.condition) where.condition = filters.condition;
      if (filters.color) where.color = filters.color;
      if (filters.region) where.locationRegion = filters.region;
      if (filters.city) where.locationCity = filters.city;
      if (filters.sellerId) where.sellerId = filters.sellerId;

      if (filters.sizeEuMin !== undefined || filters.sizeEuMax !== undefined) {
        where.sizeEu = {};
        if (filters.sizeEuMin !== undefined) where.sizeEu.gte = filters.sizeEuMin;
        if (filters.sizeEuMax !== undefined) where.sizeEu.lte = filters.sizeEuMax;
      }

      if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
        where.priceXof = {};
        if (filters.priceMin !== undefined) where.priceXof.gte = filters.priceMin;
        if (filters.priceMax !== undefined) where.priceXof.lte = filters.priceMax;
      }

      // Recherche textuelle via ILIKE
      if (filters.query) {
        where.OR = [
          { title: { contains: filters.query, mode: 'insensitive' } },
          { brand: { contains: filters.query, mode: 'insensitive' } },
          { model: { contains: filters.query, mode: 'insensitive' } },
          { description: { contains: filters.query, mode: 'insensitive' } },
        ];
      }

      // Tri
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let orderBy: any = { createdAt: 'desc' };
      switch (filters.sortBy) {
        case 'price_asc':
          orderBy = { priceXof: 'asc' };
          break;
        case 'price_desc':
          orderBy = { priceXof: 'desc' };
          break;
        case 'popularity':
          orderBy = { viewsCount: 'desc' };
          break;
      }

      const [listings, total] = await Promise.all([
        this.prisma.listing.findMany({
          where,
          orderBy,
          take: limit,
          skip: offset,
          include: { images: { orderBy: { order: 'asc' } } },
        }),
        this.prisma.listing.count({ where }),
      ]);

      const data = listings.map((listing) => this.buildDocument(listing));
      const nextOffset = offset + data.length;

      return {
        data,
        total,
        cursor: nextOffset < total ? String(nextOffset) : null,
        hasMore: nextOffset < total,
      };
    } catch (err) {
      this.logger.error(`Recherche PostgreSQL echouee: ${err}`);
      return { data: [], total: 0, cursor: null, hasMore: false };
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────

  private buildDocument(listing: {
    id: string;
    sellerId: string;
    slug: string;
    title: string;
    description: string;
    brand: string;
    model: string | null;
    sizeEu: number;
    priceXof: number;
    condition: string;
    color: string;
    locationCity: string;
    locationRegion: string;
    status: string;
    viewsCount: number;
    createdAt: Date;
    images?: { url: string; order: number }[];
  }) {
    const sorted = listing.images?.length
      ? [...listing.images].sort((a, b) => a.order - b.order)
      : [];

    return {
      id: listing.id,
      sellerId: listing.sellerId,
      slug: listing.slug,
      title: listing.title,
      description: listing.description,
      brand: listing.brand,
      model: listing.model,
      sizeEu: listing.sizeEu,
      priceXof: listing.priceXof,
      condition: listing.condition,
      color: listing.color,
      locationCity: listing.locationCity,
      locationRegion: listing.locationRegion,
      status: listing.status,
      viewsCount: listing.viewsCount,
      createdAt: listing.createdAt.getTime(),
      thumbnailUrl: sorted[0]?.url || null,
      imageUrls: sorted.map((img) => img.url),
    };
  }
}
