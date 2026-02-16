import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeiliSearch } from 'meilisearch';
import { ListingFiltersDto } from '../listing/dto/listing-filters.dto';

@Injectable()
export class SearchService implements OnModuleInit {
  private client: MeiliSearch;
  private readonly INDEX = 'listings';

  constructor(private configService: ConfigService) {
    this.client = new MeiliSearch({
      host:
        this.configService.get<string>('MEILISEARCH_URL') ||
        'http://localhost:7700',
      apiKey: this.configService.get<string>('MEILISEARCH_API_KEY'),
    });
  }

  async onModuleInit() {
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
    slug: string;
    title: string;
    description: string;
    brand: string;
    model: string;
    sizeEu: number;
    priceXof: number;
    condition: string;
    color: string;
    locationCity: string;
    locationRegion: string;
    status: string;
    viewsCount: number;
    createdAt: Date;
  }): Promise<void> {
    await this.client.index(this.INDEX).addDocuments(
      [
        {
          ...listing,
          createdAt: listing.createdAt.getTime(),
        },
      ],
      { primaryKey: 'id' },
    );
  }

  async removeListing(id: string): Promise<void> {
    await this.client.index(this.INDEX).deleteDocument(id);
  }

  async search(filters: ListingFiltersDto) {
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
}
