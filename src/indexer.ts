import {
  FilterType,
  IndexerConfig,
  MessageType,
  TransportType,
} from '@venom-blockchain/fusion';

interface IndexerInstance {
  run(subscribers: any): void;
  stop(): void;
}

interface IndexerConstructor {
  new (config: IndexerConfig): IndexerInstance;
}

export class IndexerExample<T extends IndexerConstructor> {
  private readonly indexer: IndexerInstance;

  static readonly filters = [
    {
      type: FilterType.AnyMessage,
      entries: [
        {
          name: 'FallthroughSender',
          sender:
            '0:7abf595f35d992188591bac25347f933db9bc37fb94053eafc767b43e89cb753',
        },
        {
          name: 'FallthroughReceiver',
          receiver:
            '0:b5b7a9780616fbb45fad96dd12f4d306716f83082f82e2f577720d9d417c6421',
        },
      ],
    },
    {
      type: {
        contract: {
          name: 'BridgeEvent',
          abi_path: 'BridgeEvent.abi.json',
        },
      },
      entries: [
        {
          name: 'BridgeEvent',
          message: {
            name: 'Confirm',
            type: MessageType.ExternalOutbound,
          },
        },
      ],
    },
    {
      type: {
        contract: {
          name: 'TokenWallet',
          abi_path: 'TokenWallet.abi.json',
        },
      },
      entries: [
        {
          name: 'TIP3Transfer',
          message: {
            name: 'acceptTransfer',
            type: MessageType.InternalInbound,
          },
        },
      ],
    },
  ];

  static abiPath = './abi';
  static installPath = './indexer_bin';
  static dbPath = '/var/db/fusion-producer';
  static transport = TransportType.http2;

  constructor(Indexer: T) {
    this.indexer = new Indexer({
      transport: IndexerExample.transport,
      filters: IndexerExample.filters,
      abiPath: IndexerExample.abiPath,
      installPath: IndexerExample.installPath,
      dbPath: IndexerExample.dbPath,
    });
  }

  run(subscribers: any) {
    this.indexer.run(subscribers);
  }

  stop() {
    this.indexer.stop();
  }
}
