import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { OnModuleInit } from '@nestjs/common/interfaces';

import { StausResponseDto } from './dto/status.dto';
import { Indexer } from 'fusion-consumer';
import { Message, FilterType, MessageType, TransportType } from 'fusion-consumer';

@Injectable()
export class IndexerService implements OnModuleInit, OnApplicationShutdown {

  private maxMessages = 100;
  private lastMessages: Message[] = [];

  private readonly indexer: Indexer;

  private totalEventCount = 0;
  private TIP3TransferCount = 0;
  private VenomTranserCount = 0;

  constructor() {
      this.indexer = new Indexer({
        transport: TransportType.http2,
        //url: 'http://127.0.0.1:3000',
        //transport: TransportType.stdio,
        abiPath: './abi',
        installPath: './indexer_bin', // TODO: ??? defaults to './indexer_bin/' ?
        dbPath: '/var/db/ton-kafka-producer2', // TODO: ??? defaults to './indexer_db/' ?
        filters: [{
            type: FilterType.AnyMessage,
            entries: [{
              name: 'fallthrough',
              receiver: '0:dbb13a10b34192b33827d291cb74a398f25addf804fff13003ad2c0b3a9e405d'
            }]
          },{
            type: {
              contract: {
                name: 'TokenWallet',
                abi_path: 'TokenWallet.abi.json'
              }
            },
            entries: [{
              name: 'TIP3Transfer',
              message: {
                name: 'transfer',
                type: MessageType.InternalInbound
              }
            }]
          }, {
            type: FilterType.NativeTransfer,
            entries: [{
              name: 'VenomTransfer',
              receiver: '0:cd7876d4a53199928d3bf72b6a1c9b38fd89c26d4f38092ed4fb014fc692700b'
            }]
          }
        ]
      });
  }

  async getEvents(): Promise<Message[]> {
    return this.lastMessages;
  }

  async getStatus(): Promise<StausResponseDto> {
    return {
      totalEventCount: this.totalEventCount,
      TIP3TransferCount: this.TIP3TransferCount,
      VenomTranserCount: this.VenomTranserCount,
    }
  }

  async onModuleInit() {
    this.indexer.run({
      VenomTransfer: (message) => this.VenomTransfer(message),
      TIP3Transfer: (message) => this.TIP3Transfer(message),
      fallthrough: (message) => this.Fallthrough(message),
    });
  }

  VenomTransfer(message: Message) {
    this.addMessage(message);
    this.VenomTranserCount++;
  }

  TIP3Transfer(message: Message) {
    this.addMessage(message);
    this.TIP3TransferCount++;
  }

  Fallthrough(message: Message) {
    this.addMessage(message);
  }

  addMessage(message: Message) {
    if (this.lastMessages.length >= this.maxMessages) {
      this.lastMessages.shift();
    }

    this.lastMessages.push(message);
    this.totalEventCount++;
  }

  async onApplicationShutdown() {
    this.indexer.stop();
  }
}