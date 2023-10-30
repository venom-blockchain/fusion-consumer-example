import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import * as Joi from 'joi';
import { IndexerModule } from './indexer/indexer.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validationSchema: Joi.object({
        APP_PORT: Joi.number().required(),
      }),
    }),
    EventEmitterModule.forRoot(),
    IndexerModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
