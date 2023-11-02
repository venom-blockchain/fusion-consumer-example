import { TestIndexer, TransportType } from '@venom-blockchain/fusion';
import { describe, it } from 'node:test';

import { IndexerExample } from './indexer';

describe('example', () => {
  it('should handle each block', () => {
    function transfer(message: any, call: any) {
      console.log('\n', 'TIP3Transfer', message, call, '\n');
    }

    function bridgeEvent(message: any, event: any) {
      console.log('bridgeEvent', message, event, '\n');
    }

    function fallthroughSender(message: any) {
      console.log('fallthroughSender', message, '\n');
    }

    function fallthroughReceiver(message: any) {
      console.log('fallthroughReceiver', message, '\n');
    }

    IndexerExample.dbPath = './src/test/blocks.json';
    IndexerExample.transport = TransportType.mock;

    new IndexerExample<typeof TestIndexer>(TestIndexer).run({
      FallthroughReceiver: fallthroughReceiver,
      FallthroughSender: fallthroughSender,
      TIP3Transfer: transfer,
      BridgeEvent: bridgeEvent,
    });
  });
});
