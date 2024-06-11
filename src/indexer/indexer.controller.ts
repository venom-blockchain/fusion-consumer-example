import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { IndexerService } from './indexer.service';

@ApiTags('indexer')
@Controller('indexer')
export class IndexerController {
  constructor(private readonly service: IndexerService) {
  }

  @Get('wallet')
  async wallet() {
  }
}