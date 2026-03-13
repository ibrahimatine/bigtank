import { Controller, Get } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('health')
  async health() {
    return this.searchService.healthCheck();
  }
}
