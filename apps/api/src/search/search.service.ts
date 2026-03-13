import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeiliSearch } from 'meilisearch';
import { PrismaClient } from '@prisma/client';
import { ListingFiltersDto } from '../listing/dto/listing-filters.dto';

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private client: MeiliSearch;
  private readonly INDEX = 'listings';
  private available = false;

  constructor(
    private configService: ConfigService,
    @Inject('PRISMA') private prisma: PrismaClient,
  ) {
    this.client = new MeiliSearch({
      host:
        this.configService.get<string>('MEILISEARCH_URL') ||
        'http://localhost:7700',
      apiKey: this.configService.get<string>('MEILISEARCH_API_KEY'),
    });
  }

  async onModuleInit() {
    await this.checkAvailability();
  }

  /** Verifie et retente la connexion a Meilisearch */
  private async checkAvailability(): Promise<boolean> {
    if (this.available) return true;
    try {
      await this.setupIndex();
      this.available = true;
      this.logger.log('Meilisearch connecte');
      return true;
    } catch (err) {
      this.logger.warn(`Meilisearch indisponible: ${err}`);
      return false;
    }
  }

  /** Garantit la disponibilite — retente si pas encore connecte */
  private async ensureAvailable(): Promise<boolean> {
    if (this.available) return true;
    return this.checkAvailability();
  }

  private async setupIndex() {
    const index = this.client.index(this.INDEX);

    await index.updateFilterableAttributes([
      'brand',
      'sizeEu',
      'condition',
      'color',
      'locationRegion',
      'locationCity',
      'status',
      'priceXof',
      'sellerId',
    ]);

    await index.updateSortableAttributes([
      'priceXof',
      'createdAt',
      'viewsCount',
    ]);

    await index.updateSearchableAttributes([
      'title',
      'brand',
      'model',
      'description',
      'color',
    ]);
  }

  async indexListing(listing: {
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
    if (!(await this.ensureAvailable())) {
      this.logger.warn(`Meilisearch indisponible — listing ${listing.id} non indexe`);
      return;
    }

    const thumbnailUrl = listing.images?.length
      ? listing.images.sort((a, b) => a.order - b.order)[0].url
      : null;

    const imageUrls = listing.images?.length
      ? listing.images.sort((a, b) => a.order - b.order).map((img) => img.url)
      : [];

    const { images, ...rest } = listing;
    await this.client.index(this.INDEX).addDocuments(
      [
        {
          ...rest,
          thumbnailUrl,
          imageUrls,
          createdAt: listing.createdAt.getTime(),
        },
      ],
      { primaryKey: 'id' },
    );
  }

  async removeListing(id: string): Promise<void> {
    if (!(await this.ensureAvailable())) {
      this.logger.warn(`Meilisearch indisponible — listing ${id} non retire`);
      return;
    }
    await this.client.index(this.INDEX).deleteDocument(id);
  }

  async search(filters: ListingFiltersDto) {
    if (!(await this.ensureAvailable())) {
      return { data: [], total: 0, cursor: null, hasMore: false };
    }
    const filterArray: string[] = ['status = ACTIVE'];

    if (filters.brand) filterArray.push(`brand = "${filters.brand}"`);
    if (filters.sizeEuMin !== undefined)
      filterArray.push(`sizeEu >= ${filters.sizeEuMin}`);
    if (filters.sizeEuMax !== undefined)
      filterArray.push(`sizeEu <= ${filters.sizeEuMax}`);
    if (filters.priceMin !== undefined)
      filterArray.push(`priceXof >= ${filters.priceMin}`);
    if (filters.priceMax !== undefined)
      filterArray.push(`priceXof <= ${filters.priceMax}`);
    if (filters.condition)
      filterArray.push(`condition = "${filters.condition}"`);
    if (filters.color) filterArray.push(`color = "${filters.color}"`);
    if (filters.region)
      filterArray.push(`locationRegion = "${filters.region}"`);
    if (filters.city) filterArray.push(`locationCity = "${filters.city}"`);
    if (filters.sellerId) filterArray.push(`sellerId = "${filters.sellerId}"`);

    let sort: string[] = [];
    switch (filters.sortBy) {
      case 'price_asc':
        sort = ['priceXof:asc'];
        break;
      case 'price_desc':
        sort = ['priceXof:desc'];
        break;
      case 'popularity':
        sort = ['viewsCount:desc'];
        break;
      default:
        sort = ['createdAt:desc'];
        break;
    }

    const limit = Math.min(filters.limit || 20, 100);
    const offset = filters.cursor ? parseInt(filters.cursor, 10) : 0;

    const result = await this.client.index(this.INDEX).search(
      filters.query || '',
      {
        filter: filterArray.join(' AND '),
        sort,
        limit,
        offset,
      },
    );

    const nextOffset = offset + result.hits.length;
    const hasMore = nextOffset < (result.estimatedTotalHits || 0);

    return {
      data: result.hits,
      total: result.estimatedTotalHits || 0,
      cursor: hasMore ? String(nextOffset) : null,
      hasMore,
    };
  }

  /** Re-indexe toutes les annonces ACTIVE depuis la base de donnees */
  async reindexAll(): Promise<{ indexed: number }> {
    if (!(await this.ensureAvailable())) {
      throw new Error('Meilisearch indisponible');
    }

    // Vider l'index
    await this.client.index(this.INDEX).deleteAllDocuments();
    this.logger.log('Index Meilisearch vide');

    // Recuperer toutes les annonces ACTIVE
    const listings = await this.prisma.listing.findMany({
      where: { status: 'ACTIVE' },
      include: { images: { orderBy: { order: 'asc' } } },
    });

    if (listings.length === 0) {
      this.logger.log('Aucune annonce ACTIVE a indexer');
      return { indexed: 0 };
    }

    // Indexer par batch de 50
    const batchSize = 50;
    for (let i = 0; i < listings.length; i += batchSize) {
      const batch = listings.slice(i, i + batchSize);
      const docs = batch.map((listing) => {
        const sorted = listing.images.sort((a, b) => a.order - b.order);
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
      });
      await this.client.index(this.INDEX).addDocuments(docs, { primaryKey: 'id' });
    }

    this.logger.log(`${listings.length} annonces re-indexees dans Meilisearch`);
    return { indexed: listings.length };
  }
}
