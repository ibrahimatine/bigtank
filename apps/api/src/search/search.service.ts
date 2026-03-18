import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeiliSearch } from 'meilisearch';
import { PrismaClient } from '@prisma/client';
import { ListingFiltersDto } from '../listing/dto/listing-filters.dto';

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;
const RECONNECT_INTERVAL_MS = 30_000; // Re-tester la connexion toutes les 30s

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private client: MeiliSearch;
  private readonly INDEX = 'listings';
  private available = false;
  private indexConfigured = false;
  private reconnectTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private configService: ConfigService,
    @Inject('PRISMA') private prisma: PrismaClient,
  ) {
    const host =
      this.configService.get<string>('MEILISEARCH_URL') ||
      'http://localhost:7700';
    const apiKey = this.configService.get<string>('MEILISEARCH_API_KEY');

    this.client = new MeiliSearch({
      host,
      apiKey,
      requestConfig: { signal: AbortSignal.timeout(10_000) },
    });

    this.logger.log(`Meilisearch host: ${host}`);
  }

  async onModuleInit() {
    await this.ensureMeiliAvailable();

    // Si Meilisearch n'est pas dispo au demarrage, tenter de se reconnecter periodiquement
    if (!this.available) {
      this.startReconnectLoop();
    }
  }

  // ─── Disponibilite ────────────────────────────────────────────────

  async ensureMeiliAvailable(): Promise<boolean> {
    if (this.available) return true;

    try {
      await this.client.health();

      if (!this.indexConfigured) {
        await this.setupIndex();
        this.indexConfigured = true;
      }

      this.available = true;
      this.stopReconnectLoop();
      this.logger.log('Meilisearch connecte et disponible');
      return true;
    } catch {
      this.available = false;
      return false;
    }
  }

  async healthCheck(): Promise<{ status: 'ok' | 'unavailable'; message?: string }> {
    try {
      await this.client.health();
      if (!this.available) {
        if (!this.indexConfigured) {
          await this.setupIndex();
          this.indexConfigured = true;
        }
        this.available = true;
        this.stopReconnectLoop();
        this.logger.log('Meilisearch connection restored');
      }
      return { status: 'ok' };
    } catch (err) {
      this.available = false;
      return {
        status: 'unavailable',
        message: err instanceof Error ? err.message : 'Connexion impossible',
      };
    }
  }

  /** Retourne true si Meilisearch est disponible (sans ping) */
  isAvailable(): boolean {
    return this.available;
  }

  private startReconnectLoop() {
    if (this.reconnectTimer) return;
    this.logger.warn(
      `Meilisearch indisponible — tentative de reconnexion toutes les ${RECONNECT_INTERVAL_MS / 1000}s`,
    );
    this.reconnectTimer = setInterval(() => {
      this.ensureMeiliAvailable().catch(() => {});
    }, RECONNECT_INTERVAL_MS);
  }

  private stopReconnectLoop() {
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
      this.reconnectTimer = null;
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

  // ─── Retry helper ───────────────────────────────────────────────

  private async withRetry<T>(
    operation: () => Promise<T>,
    label: string,
  ): Promise<T> {
    for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
      try {
        return await operation();
      } catch (err) {
        if (attempt === RETRY_ATTEMPTS) {
          this.logger.error(`${label} — echec apres ${RETRY_ATTEMPTS} tentatives: ${err}`);
          this.available = false;
          this.startReconnectLoop();
          throw err;
        }
        const delay = RETRY_DELAY_MS * attempt;
        this.logger.warn(`${label} — tentative ${attempt}/${RETRY_ATTEMPTS} echouee, retry dans ${delay}ms`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    throw new Error('Unreachable');
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
      await this.withRetry(
        () => this.client.index(this.INDEX).addDocuments([doc], { primaryKey: 'id' }),
        `Indexation listing ${listing.id}`,
      );
    } catch {
      // Erreur deja loguee par withRetry — ne pas bloquer l'operation appelante
    }
  }

  async removeListing(id: string): Promise<void> {
    if (!(await this.ensureMeiliAvailable())) {
      this.logger.warn(`Meilisearch unavailable — listing ${id} non retire`);
      return;
    }

    try {
      await this.withRetry(
        () => this.client.index(this.INDEX).deleteDocument(id),
        `Suppression listing ${id}`,
      );
    } catch {
      // Erreur deja loguee par withRetry
    }
  }

  // ─── Recherche ────────────────────────────────────────────────────

  async search(filters: ListingFiltersDto) {
    // Si Meilisearch est down, fallback sur une recherche PostgreSQL basique
    if (!(await this.ensureMeiliAvailable())) {
      return this.searchFallback(filters);
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

      const result = await this.withRetry(
        () =>
          this.client.index(this.INDEX).search(
            filters.query || '',
            { filter: filterArray.join(' AND '), sort, limit, offset },
          ),
        'Recherche Meilisearch',
      );

      const nextOffset = offset + result.hits.length;
      const hasMore = nextOffset < (result.estimatedTotalHits || 0);

      return {
        data: result.hits,
        total: result.estimatedTotalHits || 0,
        cursor: hasMore ? String(nextOffset) : null,
        hasMore,
      };
    } catch {
      // Si Meilisearch crash pendant la recherche, fallback PostgreSQL
      this.logger.warn('Meilisearch search failed — fallback PostgreSQL');
      return this.searchFallback(filters);
    }
  }

  /**
   * Recherche de secours via PostgreSQL quand Meilisearch est indisponible.
   * Moins performante mais garantit que la recherche fonctionne toujours.
   */
  private async searchFallback(filters: ListingFiltersDto) {
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

      // Recherche textuelle basique
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
      this.logger.error(`Fallback PostgreSQL echoue: ${err}`);
      return { data: [], total: 0, cursor: null, hasMore: false };
    }
  }

  // ─── Reindexation ─────────────────────────────────────────────────

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
      this.logger.log(`Reindex batch ${Math.floor(i / batchSize) + 1}: ${docs.length} annonces`);
    }

    this.logger.log(`Reindex termine: ${listings.length} annonces`);
    return { reindexed: listings.length };
  }

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

    if (listing.status === 'ACTIVE') {
      const doc = this.buildDocument(listing);
      await this.client.index(this.INDEX).addDocuments([doc], { primaryKey: 'id' });
      this.logger.log(`Reindex: 1 annonce (${listingId})`);
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
