import { Indexer } from '@venom-blockchain/fusion';
import { IndexerExample } from './indexer';

function main() {
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

  new IndexerExample<typeof Indexer>(Indexer).run({
    TIP3Transfer: transfer,
    BridgeEvent: bridgeEvent,
    FallthroughSender: fallthroughSender,
    FallthroughReceiver: fallthroughReceiver,
  });
}

main();
