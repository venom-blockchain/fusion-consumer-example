# Venom Data Consumer Example

## Setup

Recommended hardware: 8 CPU, 32 GB RAM, 720 NVMe recommended.

Clone repo

```bash
git clone https://github.com/venom-blockchain/fusion-consumer-example.git
```

Install dependencies

```bash
sudo apt update && sudo apt upgrade
sudo apt install build-essential llvm clang pkg-config libssl-dev libsasl2-dev

curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y

sudo apt install -y protobuf-compiler

sudo apt install nodejs npm

sudo npm install -g n
sudo n stable
```

## Installation

```bash
npm install
```

## Building
```bash
npm run build
```

## Run an example
Examples are located in `./src` directory.
```bash
npm start
```

## Modify the example

To modify the example, open the file [indexer.service.ts](https://github.com/venom-blockchain/fusion-consumer-example/blob/main/src/indexer/indexer.service.ts)

```typescript
// ...
constructor() {

  // creates a new VenomIndexer object 
  this.indexer = new VenomIndexer({
  transport: TransportKind.http2, // Sets the transport type to HTTP/2 (TransportKind.http2 or TransportKind.stdio)
  abiPath: './abi',               // Specifies the path to the directory with ABI files
  installPath: './indexer',       // Sets the installation path for Fusion Producer
  dbPath: '/var/db/fusion',       // Sets the database path

  // This code configures three different filters for handling messages or transactions. 
  // Filters will help track or filter certain types of messages
  filters: [
    // Tracks all messages directed to a specified address.
    {
      type: FilterType.AnyMessage,
      entries: [{
        name: 'fallthrough',
        receiver: '0:abcdefgh0123456789101172b6a1c9b38fd89c26d4f38092ed4fb014fc692700b'
      }]
    },

    // Tracks internal inbound messages named 'transfer' for the contract 'TokenWallet'.
    {
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
    },
    
    // Tracks native transfers to a specified address
    {
      type: FilterType.NativeTransfer,
      entries: [{
        name: 'VenomTransfer',
        receiver: '0:abcdefgh0123456789101172b6a1c9b38fd89c26d4f38092ed4fb014fc692700b'
      }]
    }
  ]
  });
}

// ...

async onModuleInit() {
  this.indexer.run({
    // Three filter types (VenomTransfer, TIP3Transfer, fallthrough) are being mapped to corresponding handler methods
    VenomTransfer: (message) => this.VenomTransfer(message),
    TIP3Transfer: (message) => this.TIP3Transfer(message),
    fallthrough: (message) => this.Fallthrough(message),
  });
}

VenomTransfer(message: Message) {
  // your handler
}

TIP3Transfer(message: Message) {
  // your handler
}

Fallthrough(message: Message) {
  // your handler
}

```

## Usage
Library provides a set of types for reading and processing data from venom data producer. Create and configure VenomIndexer class. It support different transport layers and protocols.
#### Transport layer:
- Http2 - Receives data via a HTTP/2 stream
- stdio - Run indexer and use stdio to recive data
#### Deserializer layer:
- Protobuf - Parses prefixed Protobuf format into objects (not implemented yet)
- Json - Parses prefixed JSON input into objects
#### VenomIndexer
Main class for interaction. It's constructor accepts a config object with different run/connect options. It's possible to connect to existing instans or run and connect. In case of run and connect message filter configuration is needed.

To use it, construct VenomIndexer and specify handlers:
```typescript
const indexer = new VenomIndexer({
        transport: TransportKind.http2,
        url: 'http://127.0.0.1:3000'
});

indexer.run({
    VenomTransfer: (message) => console.log(`VenomTransfer: ${}`, message),
    TIP3Transfer: (message) => console.log(`TIP3Transfer: ${}`, message),
});

```

see complete example in `./src/indexer/indexer.service.ts`

#### Run Indexer

It's possible to download, compile and run the indexer before connect to it. url config parameter should not be specified in this case. Both stdio and http2 are supported.

- abiPath path

```
      const indexer = new VenomIndexer({
        transport: TransportKind.http2,
        //transport: TransportKind.stdio,
        abiPath: './abi',
        installPath: './indexer_bin',
        dbPath: '/var/db/ton-kafka-producer2',
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
              messages: [{
                name: 'transfer',
                type: MessageType.InternalInbound
              }]
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
```
