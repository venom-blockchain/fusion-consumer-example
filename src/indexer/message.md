## CommonMsgInfo

CommonMsgInfo is a base type for message information. It has three variants:

1. int_msg_info:

```code
    int_msg_info$0 ihr_disabled:Bool bounce:Bool bounced:Bool
        src:MsgAddressInt dest:MsgAddressInt 
        value:CurrencyCollection ihr_fee:Grams fwd_fee:Grams
        created_lt:uint64 created_at:uint32 = CommonMsgInfo;
```

• ihr_disabled: Bool — A flag indicating whether Instant Hypercube Routing (IHR) is disabled.
• bounce: Bool — A flag indicating whether the message should be returned to the sender in case of an error.
• bounced: Bool — A flag indicating that the message has already been bounced.
• src: MsgAddressInt — The sender’s address (internal).
• dest: MsgAddressInt — The recipient’s address (internal).
• value: CurrencyCollection — The amount of currency sent in the message.
• ihr_fee: Grams — The fee for IHR.
• fwd_fee: Grams — The forwarding fee.
• created_lt: uint64 — The creation time in logical ticks.
• created_at: uint32 — The creation time (in seconds).

2. ext_in_msg_info

```code
    ext_in_msg_info$10 src:MsgAddressExt dest:MsgAddressInt
        import_fee:Grams = CommonMsgInfo;
```

• src: MsgAddressExt — The sender’s address (external).
• dest: MsgAddressInt — The recipient’s address (internal).
• import_fee: Grams — The fee for importing the message.

3. ext_out_msg_info

```code
    ext_out_msg_info$11 src:MsgAddressInt dest:MsgAddressExt
        created_lt:uint64 created_at:uint32 = CommonMsgInfo;
```

• src: MsgAddressInt — The sender’s address (internal).
• dest: MsgAddressExt — The recipient’s address (external).
• created_lt: uint64 — The creation time in logical ticks.
• created_at: uint32 — The creation time (in seconds).

## Message

Message is a data type representing the message itself:

```code
    message$_ {X:Type} info:CommonMsgInfo
        init:(Maybe (Either StateInit ^StateInit))
        body:(Either X ^X) = Message X;
```

• {X: Type} — A generic type parameter, where X can be any type.
• info: CommonMsgInfo — The message information (one of the three types described above).
• init: (Maybe (Either StateInit ^StateInit)) — The initial state, which can be either StateInit, a reference to StateInit, or absent.
• body: (Either X ^X) — The body of the message, which can be either of type X or a reference to type X.