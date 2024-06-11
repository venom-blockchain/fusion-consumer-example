import { Indexer, TransportHttp2 } from '@venom-blockchain/fusion';
import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { OnModuleInit } from '@nestjs/common/interfaces';

import { Cell, Slice, BitString, loadMessage, loadTransaction } from '@ton/core';

// block_extra in_msg_descr:^InMsgDescr
//   out_msg_descr:^OutMsgDescr
//   account_blocks:^ShardAccountBlocks
//   rand_seed:bits256
//   created_by:bits256
//   custom:(Maybe ^McBlockExtra) = BlockExtra;

interface BlockExtra {
  in_msg_descr: any;
  out_msg_descr: any;
  account_blocks: any;
  rand_seed: BitString;
  created_by: BitString;
  custom: any;
}

function loadBlockExtra(slice: Slice): BlockExtra {
  return {
    in_msg_descr: slice.loadRef().beginParse(),
    out_msg_descr: slice.loadRef().beginParse(),
    account_blocks: slice.loadRef().beginParse(),
    rand_seed: slice.loadBits(256),
    created_by: slice.loadBits(256),
    custom: slice.loadRef().beginParse(),
  }
}

// ext_blk_ref$_
//    end_lt:uint64
//    seq_no:uint32
//    root_hash:bits256
//    file_hash:bits256
//    = ExtBlkRef;

interface ExtBlkRef {
  end_lt: bigint,
  seq_no: number,
  root_hash: BitString,
  file_hash: BitString

}

// block_info#9bc7a987
//   version:uint32
//   not_master:(## 1)
//   after_merge:(## 1)
//   before_split:(## 1)
//   after_split:(## 1)
//   want_split:Bool
//   want_merge:Bool
//   key_block:Bool
//   vert_seqno_incr:(## 1)
//   flags:(## 8) { flags <= 1 }
//   seq_no:# vert_seq_no:# { vert_seq_no >= vert_seqno_incr }
//   { prev_seq_no:# } { ~prev_seq_no + 1 = seq_no }
//   shard:ShardIdent
//   gen_utime:uint32
//   start_lt:uint64
//   end_lt:uint64
//   gen_validator_list_hash_short:uint32
//   gen_catchain_seqno:uint32
//   min_ref_mc_seqno:uint32
//   prev_key_block_seqno:uint32
//   gen_software:flags . 0?GlobalVersion
//   master_ref:not_master?^BlkMasterInfo
//   prev_ref:^(BlkPrevInfo after_merge)
//   prev_vert_ref:vert_seqno_incr?^(BlkPrevInfo 0)
//   = BlockInfo;

interface BlockInfo {
  version: number;
  not_master: boolean;
  after_merge: boolean;
  before_split: boolean;
  after_split: boolean;
  want_split: boolean;
  want_merge: boolean;
  key_block: boolean;
  vert_seqno_incr: boolean;
  flags: number;
  seq_no: number;
  vert_seq_no: number;
  shard: {
    shard_pfx_bits: number;
    workchain_id: number;
    shard_prefix: bigint;
  };
  gen_utime: number;
  gen_utime_ms: number;
  start_lt: bigint;
  end_lt: bigint;
  gen_validator_list_hash_short: number;
  gen_catchain_seqno: number;
  min_ref_mc_seqno: number;
  prev_key_block_seqno: number;
  gen_software: {
    version: number;
    capabilities: number;
  },
  master_ref: ExtBlkRef,
  prev_ref: ExtBlkRef,
  prev_vert_ref: any; // BlkPrevInfo
}

function loadBlockInfo(slice: Slice): BlockInfo {
  const TAG_V1 = 0x9bc7a987;
  const TAG_V2 = 0x9bc7a988;

  const tag = slice.loadUint(32);

  let with_ms = tag === TAG_V2;

  if (![TAG_V1, TAG_V2].includes(tag)) {
    throw new Error('Invalid blockInfo tag');
  }

  const version = slice.loadUint(32);
  const not_master = slice.loadBit();
  const after_merge = slice.loadBit();
  const before_split = slice.loadBit();
  const after_split = slice.loadBit();
  const want_split = slice.loadBoolean();
  const want_merge = slice.loadBoolean();
  const key_block = slice.loadBoolean();
  const vert_seqno_incr = slice.loadBit();
  const flags = slice.loadUint(8);
  const seq_no = slice.loadUint(32);
  const vert_seq_no = slice.loadUint(32);


  // shard_ident$00 shard_pfx_bits:(#<= 60) 
  //    workchain_id:int32 shard_prefix:uint64 = ShardIdent;
  const prefix = slice.loadUint(2);

  if (prefix !== 0) {
    throw new Error('Invalid shard prefix');
  }

  const shard = {
    shard_pfx_bits: slice.loadUint(6),
    workchain_id: slice.loadInt(32),
    shard_prefix: slice.loadUintBig(64),
  }

  const gen_utime = slice.loadUint(32);

  // venom only
  const gen_utime_ms = with_ms ? slice.loadUint(16) : 0;

  const start_lt = slice.loadUintBig(64);
  const end_lt = slice.loadUintBig(64);
  const gen_validator_list_hash_short = slice.loadUint(32);
  const gen_catchain_seqno = slice.loadUint(32);
  const min_ref_mc_seqno = slice.loadUint(32);
  const prev_key_block_seqno = slice.loadUint(32);

  let gen_software = null;

  const _tag = slice.loadUint(8);

  if (_tag === 0xc4 && flags & 0x01) {
    // capabilities#c4 version:uint32 capabilities:uint64 = GlobalVersion;
    gen_software = {
      version: slice.loadUint(32),
      capabilities: slice.loadUint(64),
    }
  }

  const master_ref = null;

  if (not_master) {
    // console.log('NOT MASTER!')
  }

  // let master_ref = if packed_flags & 0b10000000 != 0 {
  //     Some(ok!(Lazy::<BlockRef>::load_from(slice)))
  // } else {
  //     None
  // };

  const prev_ref_slice = slice.loadRef().beginParse()

  const prev_ref: ExtBlkRef = {
    seq_no: prev_ref_slice.loadUint(32),
    end_lt: prev_ref_slice.loadUintBig(64),
    root_hash: prev_ref_slice.loadBits(256),
    file_hash: prev_ref_slice.loadBits(256),
  };

  return {
    version,
    not_master,
    after_merge,
    before_split,
    after_split,
    want_split,
    want_merge,
    key_block,
    vert_seqno_incr,
    flags,
    seq_no,
    vert_seq_no,
    shard,
    gen_utime,
    gen_utime_ms,
    start_lt,
    end_lt,
    gen_validator_list_hash_short,
    gen_catchain_seqno,
    min_ref_mc_seqno,
    prev_key_block_seqno,
    gen_software,
    master_ref,
    prev_ref,
    prev_vert_ref: null, // TODO: implement
  }
}

// value_flow ^[
//   from_prev_blk:CurrencyCollection
//   to_next_blk:CurrencyCollection
//   imported:CurrencyCollection
//   exported:CurrencyCollection
// ]
//   fees_collected:CurrencyCollection
// ^[
//   fees_imported:CurrencyCollection
//   recovered:CurrencyCollection
//   created:CurrencyCollection
//   minted:CurrencyCollection
// ] = ValueFlow;

// currencies$_ grams:Grams other:ExtraCurrencyCollection
//  = CurrencyCollection;

interface CurrencyCollection {
  grams: bigint;
  other: any;
}

function loadCurrencyCollection(slice: Slice): CurrencyCollection {
  return {
    grams: slice.loadVarUintBig(32),
    other: {}, // TODO: implement
  }
}

// impl<'a> Load<'a> for ValueFlow {
//   fn load_from(slice: &mut CellSlice<'a>) -> Result<Self, Error> {
//       let with_copyleft_rewards = match ok!(slice.load_u32()) {
//           Self::TAG_V1 => false,
//           Self::TAG_V2 => true,
//           _ => return Err(Error::InvalidTag),
//       };

//       let fees_collected = ok!(CurrencyCollection::load_from(slice));
//       let slice1 = &mut ok!(slice.load_reference_as_slice());
//       let slice2 = &mut ok!(slice.load_reference_as_slice());
//       let copyleft_rewards = if with_copyleft_rewards {
//           ok!(Dict::load_from(slice))
//       } else {
//           Dict::new()
//       };

//       Ok(Self {
//           from_prev_block: ok!(CurrencyCollection::load_from(slice1)),
//           to_next_block: ok!(CurrencyCollection::load_from(slice1)),
//           imported: ok!(CurrencyCollection::load_from(slice1)),
//           exported: ok!(CurrencyCollection::load_from(slice1)),
//           fees_collected,
//           fees_imported: ok!(CurrencyCollection::load_from(slice2)),
//           recovered: ok!(CurrencyCollection::load_from(slice2)),
//           created: ok!(CurrencyCollection::load_from(slice2)),
//           minted: ok!(CurrencyCollection::load_from(slice2)),
//           copyleft_rewards,
//       })
//   }
// }

function loadValueFlow(slice: Slice): any {
  const TAG_V1 = 0xb8e48dfb;
  const TAG_V2 = 0xe0864f6d;

//   let with_copyleft_rewards = match ok!(slice.load_u32()) {
//     Self::TAG_V1 => false,
//     Self::TAG_V2 => true,
//     _ => return Err(Error::InvalidTag),
// };

  // const childSlice = slice.loadRef().beginParse();

  const tag = slice.loadUint(32).toString(16);

  console.log(tag)

  const from_prev_blk = 0; //loadCurrencyCollection(childSlice);
  const to_next_blk = 0; //loadCurrencyCollection(childSlice);
  const imported = 0; //childSlice.loadCoins();
  const exported = 0; //childSlice.loadCoins();

  console.log({
    from_prev_blk,
    to_next_blk,
    imported,
    exported,
  })

  return {}
}

// block#11ef55aa
  // global_id:int32
  // info:^BlockInfo
  // value_flow:^ValueFlow
  // state_update:^(MERKLE_UPDATE ShardState)
  // extra:^BlockExtra = Block;

interface Block {
  global_id: number;
  info: BlockInfo;
  value_flow: any;
  state_update: any;
  extra: any;
}

function loadBlock(slice: Slice): Block {
  const TAG_1 = 0x11ef55aa;
  const TAG_2 = 0x11ef55bb;

  const tag = slice.loadUint(32);

  if (![TAG_1, TAG_2].includes(tag)) {
    throw new Error(`Invalid block tag: ${tag.toString(16)}`);
  }

  let info = null;

  return {
    global_id: slice.loadInt(32),
    info: loadBlockInfo(slice.loadRef().beginParse()),
    value_flow: loadValueFlow(slice.loadRef().beginParse()),
    get state_update(): any {
      slice.loadRef().beginParse()
      return {}
    },
    get extra(): any {
      // return loadBlockExtra(slice.loadRef().beginParse())
      return {}
    },
  }
}

function hexToBase64(hexString) {
  // Convert hex to a byte array
  let bytes = new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

  // Convert byte array to base64 string
  let base64String = btoa(String.fromCharCode.apply(null, bytes));

  return base64String;
}

@Injectable()
export class IndexerService implements OnModuleInit, OnApplicationShutdown {

  public indexer: Indexer;
  public transport: TransportHttp2;

  constructor() {
    this.indexer = new Indexer(this.onReady.bind(this));
  }

  async onModuleInit() {
    this.indexer.run();
  }

  async onApplicationShutdown() {
    this.indexer.stop();
  }

  private onReady() {
    console.log(`Indexer is ready on ${this.indexer.config.transport.listen_address}`)
    this.transport = new TransportHttp2('http://' + this.indexer.config.transport.listen_address)
    this.transport.client.on('error', (err) => this.onClientError(err));

    this.indexer.config.data_sources.map((source) => {
      source.handlers.map((handler) => {
        const route = `/${handler.kind}/${handler.handler}`

        const buffers = {};

        const req = this.transport.client
          .request({ ':path': route })
          .setEncoding('hex')
          .on('response', (headers, flags) => {
            // console.log('Stream response:', route, headers, flags);
            req.on('data', (chunk) => {
                if (!buffers[route]) {
                  buffers[route] = Buffer.alloc(0);
                }

                buffers[route] = Buffer.concat([buffers[route], Buffer.from(chunk, 'hex')]);

                // console.log(data.toString('hex'))
                // console.log(hexToBase64(data))

                // Block
                // Transaction
                // Message
                // Event
                // Call

                try {
                  const data = buffers[route];

                  switch (handler.kind) {
                    case 'block': {
                      try {
                        const cell = Cell.fromBase64(hexToBase64(data.toString('hex')));
                        const block = loadBlock(cell.beginParse());
                        // const info = block.info;
                        console.log(`Block: ${block.info.seq_no}`)
                      } catch (err) {
                        console.error('Block error:', err);
                      }
                      // try {
                      //   console.log(block.extra)
                      // } catch (err) {
                      //   console.error('Block extra error:', err);
                      // }
                      break;
                    } case 'transaction': {
                        const cell = Cell.fromBoc(Buffer.from(data, 'hex'))[0];
                        const tx = loadTransaction(cell.beginParse());

                        console.log('Transaction:', tx.hash().toString('hex'))
                        console.log(tx.address.toString(16))

                        // try {
                        //   tx.outMessages.keys().forEach((key) => {
                        //     const message = tx.outMessages.get(key);
                        //     console.log('Outgoing message:', message.body.hash().toString('hex'))
                        //   })
                        // } catch (err) {
                        //   console.error('Outgoing messages error:', err);
                        // }
                        // console.log(tx.address.toString(16))
                      break;
                    } case 'message': {
                      const cell = Cell.fromBase64(hexToBase64(data.toString('hex')));
                      const message = loadMessage(cell.beginParse());

                      console.log('Message:', message.body.hash().toString('hex'))
                      break;
                    }
                  }

                  buffers[route] = Buffer.alloc(0);
                } catch (err) {
                  console.log('Stream error:', route, headers, flags, err);
                  // ignore
                }
              })
              .on('error', (err) => {
                console.error('Stream error:', route, headers, flags, err);
                process.exit(1);
              })
              .on('close', () => {
                console.log('Stream close:', route);
              })
              .on('end', () => {
                console.log('Stream end:', route);
              });
          });
      })
    })
  }

  private onClientError(err: Error) {
    console.error('Client error:', err);
  }

  private onStreamError(err: Error) {
    console.error('Stream error:', err);
  }
}