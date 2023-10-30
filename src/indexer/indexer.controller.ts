import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IndexerService } from './indexer.service';

@ApiTags('indexer')
@Controller('indexer')
export class IndexerController {
  constructor(private readonly service: IndexerService) {
  }

  @Get('events')
  async getEvents() {
    return this.service.getEvents();
  }

  @Get('status')
  async getStatus() {
    return this.service.getStatus();
  }

}