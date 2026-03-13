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
  private indexConfigured = false;

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
    await this.ensureMeiliAvailable();
  }

  // ─── Disponibilite ────────────────────────────────────────────────

  /**
   * Contacte Meilisearch via health() pour verifier la connexion.
   * Si c'est la premiere connexion reussie, configure l'index.
   */
  async ensureMeiliAvailable(): Promise<boolean> {
    if (this.available) return true;

    try {
      this.logger.log('Meilisearch unavailable, retrying...');
      await this.client.health();

      // Premiere connexion reussie → configurer l'index
      if (!this.indexConfigured) {
        await this.setupIndex();
        this.indexConfigured = true;
      }

      this.available = true;
      this.logger.log('Meilisearch connection restored');
      return true;
    } catch {
      this.available = false;
      return false;
    }
  }

  /**
   * Health check public — retourne le statut de Meilisearch.
   * Force un ping reel a chaque appel (pas de cache du flag available).
   */
  async healthCheck(): Promise<{ status: 'ok' | 'unavailable' }> {
    try {
      await this.client.health();
      if (!this.available) {
        // Meilisearch est revenu — mettre a jour le flag
        if (!this.indexConfigured) {
          await this.setupIndex();
          this.indexConfigured = true;
        }
        this.available = true;
        this.logger.log('Meilisearch connection restored');
      }
      return { status: 'ok' };
    } catch {
      this.available = false;
      return { status: 'unavailable' };
    }
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

  // ─── Indexation ───────────────────────────────────────────────────

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
    if (!(await this.ensureMeiliAvailable())) {
      this.logger.warn(`Meilisearch unavailable — listing ${listing.id} non indexe`);
      return;
    }

    try {
      const doc = this.buildDocument(listing);
      await this.client.index(this.INDEX).addDocuments([doc], { primaryKey: 'id' });
    } catch (err) {
      this.logger.error(`Echec indexation listing ${listing.id}: ${err}`);
      this.available = false;
    }
  }

  async removeListing(id: string): Promise<void> {
    if (!(await this.ensureMeiliAvailable())) {
      this.logger.warn(`Meilisearch unavailable — listing ${id} non retire`);
      return;
    }

    try {
      await this.client.index(this.INDEX).deleteDocument(id);
    } catch (err) {
      this.logger.error(`Echec suppression listing ${id}: ${err}`);
      this.available = false;
    }
  }

  // ─── Recherche ────────────────────────────────────────────────────

  async search(filters: ListingFiltersDto) {
    if (!(await this.ensureMeiliAvailable())) {
      return { data: [], total: 0, cursor: null, hasMore: false };
    }

    try {
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
        { filter: filterArray.join(' AND '), sort, limit, offset },
      );

      const nextOffset = offset + result.hits.length;
      const hasMore = nextOffset < (result.estimatedTotalHits || 0);

      return {
        data: result.hits,
        total: result.estimatedTotalHits || 0,
        cursor: hasMore ? String(nextOffset) : null,
        hasMore,
      };
    } catch (err) {
      this.logger.error(`Echec recherche Meilisearch: ${err}`);
      this.available = false;
      return { data: [], total: 0, cursor: null, hasMore: false };
    }
  }

  // ─── Reindexation ─────────────────────────────────────────────────

  /** Re-indexe toutes les annonces ACTIVE depuis la base de donnees */
  async reindexAll(): Promise<{ reindexed: number }> {
    if (!(await this.ensureMeiliAvailable())) {
      throw new Error('Meilisearch unavailable — impossible de reindexer');
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
      return { reindexed: 0 };
    }

    // Indexer par batch de 50
    const batchSize = 50;
    for (let i = 0; i < listings.length; i += batchSize) {
      const batch = listings.slice(i, i + batchSize);
      const docs = batch.map((listing) => this.buildDocument(listing));
      await this.client.index(this.INDEX).addDocuments(docs, { primaryKey: 'id' });
    }

    this.logger.log(`Reindex completed: ${listings.length} listings`);
    return { reindexed: listings.length };
  }

  /** Re-indexe une seule annonce par son ID */
  async reindexOne(listingId: string): Promise<{ reindexed: number }> {
    if (!(await this.ensureMeiliAvailable())) {
      throw new Error('Meilisearch unavailable — impossible de reindexer');
    }

    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: { images: { orderBy: { order: 'asc' } } },
    });

    if (!listing) {
      throw new Error('Annonce introuvable');
    }

    // Si l'annonce est ACTIVE, l'indexer ; sinon la retirer
    if (listing.status === 'ACTIVE') {
      const doc = this.buildDocument(listing);
      await this.client.index(this.INDEX).addDocuments([doc], { primaryKey: 'id' });
      this.logger.log(`Reindex completed: 1 listing (${listingId})`);
    } else {
      try {
        await this.client.index(this.INDEX).deleteDocument(listingId);
      } catch {
        // Pas grave si le document n'existait pas
      }
      this.logger.log(`Listing ${listingId} retire de l'index (status: ${listing.status})`);
    }

    return { reindexed: 1 };
  }

  // ─── Helpers ──────────────────────────────────────────────────────

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
