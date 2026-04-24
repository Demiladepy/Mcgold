import { type ChainID, type ChainName, type ContractMetadata, type Explorer, type GoldRushResponse, type LogEvent, type Nullable, type PaginationLinks, type Quote } from "./Generic.types";
export type TransactionResponse = Nullable<{
    /** * The timestamp when the response was generated. Useful to show data staleness to users. */
    updated_at: Date;
    /** * The requested chain ID eg: `1`. */
    chain_id: ChainID;
    /** * The requested chain name eg: `eth-mainnet`. */
    chain_name: ChainName;
    /** * List of response items. */
    items: Transaction[];
}>;
export type Transaction = Nullable<{
    /** * The block signed timestamp in UTC. */
    block_signed_at: Date;
    /** * The height of the block. */
    block_height: number;
    /** * The hash of the block. Use it to remove transactions from re-org-ed blocks. */
    block_hash: string;
    /** * The requested transaction hash. */
    tx_hash: string;
    /** * The offset is the position of the tx in the block. */
    tx_offset: number;
    /** * Indicates whether a transaction failed or succeeded. */
    successful: boolean;
    /** * The sender's wallet address. */
    from_address: string;
    /** * The address of the miner. */
    miner_address: string;
    /** * The label of `from` address. */
    from_address_label: string;
    /** * The receiver's wallet address. */
    to_address: string;
    /** * The label of `to` address. */
    to_address_label: string;
    /** * The value attached to this tx. */
    value: bigint;
    /** * The value attached in `quote-currency` to this tx. */
    value_quote: number;
    /** * A prettier version of the quote for rendering purposes. */
    pretty_value_quote: string;
    /** * The requested chain native gas token metadata. */
    gas_metadata: ContractMetadata;
    /** * The gas offered for this tx. */
    gas_offered: number;
    /** * The gas spent for this tx. */
    gas_spent: number;
    /** * The gas price at the time of this tx. */
    gas_price: number;
    /** * The total transaction fees (`gas_price` * `gas_spent`) paid for this tx, denoted in wei. */
    fees_paid: bigint;
    /** * The gas spent in `quote-currency` denomination. */
    gas_quote: number;
    /** * A prettier version of the quote for rendering purposes. */
    pretty_gas_quote: string;
    /** * The native gas exchange rate for the requested `quote-currency`. */
    gas_quote_rate: number;
    /** * The explorer links for this transaction. */
    explorers: Explorer[];
    /** * The details for the NFT sale transaction. */
    nft_sale_details: NftSalesReport[];
    /** * The log events. */
    log_events: LogEvent[];
    /** * List of internal transfers/transactions associated with the wallet address. */
    internal_transfers: InternalTransfer[];
    /** * List of state changes with before and after values and balances for involved contract and wallet addresses. */
    state_changes: StateChange[];
    /** * Object with a transaction's input data such as the Method ID. */
    input_data: InputData;
}>;
export type NftSalesReport = Nullable<{
    /** * The offset is the position of the log entry within an event log. */
    log_offset: number;
    /** * Stores the topic event hash. All events have a unique topic event hash. */
    topic0: string;
    /** * Stores the contract address of the protocol that facilitated the event. */
    protocol_contract_address: string;
    /** * Stores the name of the protocol that facilitated the event. */
    protocol_name: string;
    /** * The protocol logo URL. */
    protocol_logo_url: string;
    /** * Stores the address of the transaction recipient. */
    to: string;
    /** * Stores the address of the transaction sender. */
    from: string;
    /** * Stores the address selling the NFT. */
    maker: string;
    /** * Stores the address buying the NFT. */
    taker: string;
    /** * Stores the NFTs token ID. All NFTs have a token ID. Within a collection, these token IDs are unique. If the NFT is transferred to another owner, the token id remains the same, as this number is its identifier within a collection. For example, if a collection has 10K NFTs then an NFT in that collection can have a token ID from 1-10K. */
    token_id: string;
    /** * Stores the address of the collection. For example, [Bored Ape Yacht Club](https://etherscan.io/token/0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d) */
    collection_address: string;
    /** * Stores the name of the collection. */
    collection_name: string;
    /** * Stores the address of the token used to purchase the NFT. */
    token_address: string;
    /** * Stores the name of the token used to purchase the NFT. */
    token_name: string;
    /** * Stores the ticker symbol of the token used to purchase the NFT. */
    ticker_symbol: string;
    /** * Stores the number decimal of the token used to purchase the NFT. */
    num_decimals: number;
    contract_quote_rate: number;
    /** * The token amount used to purchase the NFT. For example, if the user purchased an NFT for 1 ETH. The `nft_token_price` field will hold `1`. */
    nft_token_price: number;
    /** * The USD amount used to purchase the NFT. */
    nft_token_price_usd: number;
    pretty_nft_token_price_usd: string;
    /** * The price of the NFT denominated in the chains native token. Even if a seller sells their NFT for DAI or MANA, this field denominates the price in the native token (e.g. ETH, AVAX, FTM, etc.) */
    nft_token_price_native: number;
    pretty_nft_token_price_native: string;
    /** * Stores the number of NFTs involved in the sale. It's quick routine to see multiple NFTs involved in a single sale. */
    token_count: number;
    num_token_ids_sold_per_sale: number;
    num_token_ids_sold_per_tx: number;
    num_collections_sold_per_sale: number;
    num_collections_sold_per_tx: number;
    trade_type: string;
    trade_group_type: string;
}>;
export type RecentTransactionsResponse = Nullable<{
    /** * The requested address. */
    address: string;
    /** * The timestamp when the response was generated. Useful to show data staleness to users. */
    updated_at: Date;
    /** * The requested quote currency eg: `USD`. */
    quote_currency: Quote;
    /** * The requested chain ID eg: `1`. */
    chain_id: ChainID;
    /** * The requested chain name eg: `eth-mainnet`. */
    chain_name: ChainName;
    /** * The current page of the response. */
    current_page: number;
    /** * URL link to the next and prev pages. */
    links: PaginationLinks;
    /** * An executable async function for the next page. */
    next: (() => Promise<GoldRushResponse<RecentTransactionsResponse>>) | null;
    /** * An executable async function for the prev page. */
    prev: (() => Promise<GoldRushResponse<RecentTransactionsResponse>>) | null;
    /** * List of response items. */
    items: Transaction[];
}>;
export type TransactionsTimeBucketResponse = Nullable<{
    /** * The requested address. */
    address: string;
    /** * The timestamp when the response was generated. Useful to show data staleness to users. */
    updated_at: Date;
    /** * The requested quote currency eg: `USD`. */
    quote_currency: Quote;
    /** * The requested chain ID eg: `1`. */
    chain_id: ChainID;
    /** * The requested chain name eg: `eth-mainnet`. */
    chain_name: ChainName;
    complete: boolean;
    /** * The current bucket of the response. */
    current_bucket: number;
    /** * URL link to the next and prev pages. */
    links: PaginationLinks;
    /** * An executable async function for the next page. */
    next: (() => Promise<GoldRushResponse<TransactionsTimeBucketResponse>>) | null;
    /** * An executable async function for the prev page. */
    prev: (() => Promise<GoldRushResponse<TransactionsTimeBucketResponse>>) | null;
    /** * List of response items. */
    items: Transaction[];
}>;
export type TransactionsBlockResponse = Nullable<{
    /** * The timestamp when the response was generated. Useful to show data staleness to users. */
    updated_at: Date;
    /** * The requested chain ID eg: `1`. */
    chain_id: ChainID;
    /** * The requested chain name eg: `eth-mainnet`. */
    chain_name: ChainName;
    /** * List of response items. */
    items: Transaction[];
    /** * URL link to the next and prev pages. */
    links: PaginationLinks;
    /** * An executable async function for the next page. */
    next: (() => Promise<GoldRushResponse<TransactionsBlockResponse>>) | null;
    /** * An executable async function for the prev page. */
    prev: (() => Promise<GoldRushResponse<TransactionsBlockResponse>>) | null;
}>;
export type TransactionsSummaryResponse = Nullable<{
    /** * The timestamp when the response was generated. Useful to show data staleness to users. */
    updated_at: Date;
    /** * The requested address. */
    address: string;
    /** * The requested chain ID eg: `1`. */
    chain_id: ChainID;
    /** * The requested chain name eg: `eth-mainnet`. */
    chain_name: ChainName;
    /** * List of response items. */
    items: TransactionsSummary[];
}>;
export type TransactionsSummary = Nullable<{
    /** * The total number of transactions. */
    total_count: number;
    /** * The earliest transaction detected. */
    earliest_transaction: TransactionSummary;
    /** * The latest transaction detected. */
    latest_transaction: TransactionSummary;
    /** * The gas summary for the transactions. */
    gas_summary: GasSummary;
}>;
export type TransactionSummary = Nullable<{
    /** * The block signed timestamp in UTC. */
    block_signed_at: Date;
    /** * The requested transaction hash. */
    tx_hash: string;
    /** * The link to the transaction details using the Covalent API. */
    tx_detail_link: string;
}>;
export type TransactionsResponse = Nullable<{
    /** * The requested address. */
    address: string;
    /** * The timestamp when the response was generated. Useful to show data staleness to users. */
    updated_at: Date;
    /** * The requested quote currency eg: `USD`. */
    quote_currency: Quote;
    /** * The requested chain ID eg: `1`. */
    chain_id: ChainID;
    /** * The requested chain name eg: `eth-mainnet`. */
    chain_name: ChainName;
    /** * The current page of the response. */
    current_page: number;
    /** * URL link to the next and prev pages. */
    links: PaginationLinks;
    /** * An executable async function for the next page. */
    next: (() => Promise<GoldRushResponse<TransactionsResponse>>) | null;
    /** * An executable async function for the prev page. */
    prev: (() => Promise<GoldRushResponse<TransactionsResponse>>) | null;
    /** * List of response items. */
    items: Transaction[];
}>;
export type TransactionsBlockPageResponse = Nullable<{
    /** * The timestamp when the response was generated. Useful to show data staleness to users. */
    updated_at: Date;
    /** * The requested chain ID eg: `1`. */
    chain_id: ChainID;
    /** * The requested chain name eg: `eth-mainnet`. */
    chain_name: ChainName;
    /** * URL link to the next and prev pages. */
    links: PaginationLinks;
    /** * An executable async function for the next page. */
    next: (() => Promise<GoldRushResponse<TransactionsBlockPageResponse>>) | null;
    /** * An executable async function for the prev page. */
    prev: (() => Promise<GoldRushResponse<TransactionsBlockPageResponse>>) | null;
    /** * List of response items. */
    items: Transaction[];
}>;
export type GasSummary = Nullable<{
    /** * The total number of transactions sent by the address. */
    total_sent_count: number;
    /** * The total transaction fees paid by the address, denoted in wei. */
    total_fees_paid: bigint;
    /** * The total transaction fees paid by the address, denoted in `quote-currency`. */
    total_gas_quote: number;
    /** * A prettier version of the quote for rendering purposes. */
    pretty_total_gas_quote: string;
    /** * The average gas quote per transaction. */
    average_gas_quote_per_tx: number;
    /** * A prettier version of the quote for rendering purposes. */
    pretty_average_gas_quote_per_tx: string;
    /** * The requested chain native gas token metadata. */
    gas_metadata: ContractMetadata;
}>;
export type GetTransactionQueryParamOpts = Nullable<{
    /** * The currency to convert. Supports `USD`, `CAD`, `EUR`, `SGD`, `INR`, `JPY`, `VND`, `CNY`, `KRW`, `RUB`, `TRY`, `NGN`, `ARS`, `AUD`, `CHF`, and `GBP`. */
    quoteCurrency?: Quote;
    /** * Omit log events. */
    noLogs?: boolean;
    /** * Whether to include internal transfers/transactions. */
    withInternal?: boolean;
    /** * Whether to include all transaction state changes with before and after values. */
    withState?: boolean;
    /** * Whether to include the transaction's input data such as the Method ID. */
    withInputData?: boolean;
}>;
export type GetAllTransactionsForAddressQueryParamOpts = Nullable<{
    /** * The currency to convert. Supports `USD`, `CAD`, `EUR`, `SGD`, `INR`, `JPY`, `VND`, `CNY`, `KRW`, `RUB`, `TRY`, `NGN`, `ARS`, `AUD`, `CHF`, and `GBP`. */
    quoteCurrency?: Quote;
    /** * Omit log events. */
    noLogs?: boolean;
    /** * Sort the transactions in ascending chronological order. By default, it's set to `false` and returns transactions in descending chronological order. */
    blockSignedAtAsc?: boolean;
    /** * Whether to include internal transfers/transactions. */
    withInternal?: boolean;
    /** * Whether to include all transaction state changes with before and after values. */
    withState?: boolean;
    /** * Whether to include the transaction's input data such as the Method ID. */
    withInputData?: boolean;
}>;
export type getTransactionsForBlockByPageQueryParamOpts = Nullable<{
    /** * The currency to convert. Supports `USD`, `CAD`, `EUR`, `SGD`, `INR`, `JPY`, `VND`, `CNY`, `KRW`, `RUB`, `TRY`, `NGN`, `ARS`, `AUD`, `CHF`, and `GBP`. */
    quoteCurrency?: Quote;
    /** * Omit log events. */
    noLogs?: boolean;
}>;
export type getPaginatedTransactionsForAddressQueryParamOpts = Nullable<{
    /** * The currency to convert. Supports `USD`, `CAD`, `EUR`, `SGD`, `INR`, `JPY`, `VND`, `CNY`, `KRW`, `RUB`, `TRY`, `NGN`, `ARS`, `AUD`, `CHF`, and `GBP`. */
    quoteCurrency?: Quote;
    /** * Omit log events. */
    noLogs?: boolean;
    /** * Sort the transactions in ascending chronological order. By default, it's set to `false` and returns transactions in descending chronological order. */
    blockSignedAtAsc?: boolean;
}>;
export type GetTimeBucketTransactionsForAddressQueryParamOpts = Nullable<{
    /** * The currency to convert. Supports `USD`, `CAD`, `EUR`, `SGD`, `INR`, `JPY`, `VND`, `CNY`, `KRW`, `RUB`, `TRY`, `NGN`, `ARS`, `AUD`, `CHF`, and `GBP`. */
    quoteCurrency?: Quote;
    /** * Omit log events. */
    noLogs?: boolean;
}>;
export type GetTransactionSummaryQueryParamOpts = Nullable<{
    /** * The currency to convert. Supports `USD`, `CAD`, `EUR`, `SGD`, `INR`, `JPY`, `VND`, `CNY`, `KRW`, `RUB`, `TRY`, `NGN`, `ARS`, `AUD`, `CHF`, and `GBP`. */
    quoteCurrency?: Quote;
    /** * Include gas summary details. Additional charge of 1 credit when true. Response times may be impacted for wallets with millions of transactions. */
    withGas?: boolean;
    /** * Represents the total count of ERC-20 token movement events, including `Transfer`, `Deposit` and `Withdraw`. Response times may be impacted for wallets with large number of transactions. Additional charge of 3 credits. */
    withTransferCount?: boolean;
}>;
export type InternalTransfer = Nullable<{
    /** * The contract address sending the native token. */
    from_address: string;
    /** * The internal transfer recipient wallet address. */
    to_address: string;
    /** * The value of the internal transfer in wei. */
    value: string;
    /** * The gas available from the parent transaction or contract call. */
    gas_limit: number;
}>;
export type StateChange = Nullable<{
    /** * The address associated with the state change. */
    address: string;
    /** * The balance of the native token before the transaction in wei. */
    balance_before: string;
    /** * The balance of the native token after the transaction in wei. */
    balance_after: string;
    /** * List of before and after values in the storage address. */
    storage_changes: StorageChange[];
    /** * The transaction count for this address before the transaction. */
    nonce_before: number;
    /** * The transaction count for this address after the transaction. */
    nonce_after: number;
}>;
export type StorageChange = Nullable<{
    /** * The specific storage slot in the contract's storage space. */
    storage_address: string;
    /** * The hex value stored in the slot before the transaction. */
    value_before: string;
    /** * The hex value stored in the slot after the transaction. */
    value_after: string;
}>;
export type InputData = Nullable<{
    /** * The first 4 bytes of the invoked smart contract function signature. Used to identify the function being called in the contract. */
    method_id: string;
}>;
export type GetEarliestTransactionsForAddressQueryParamOpts = Nullable<{
    /** * The currency to convert. Supports `USD`, `CAD`, `EUR`, `SGD`, `INR`, `JPY`, `VND`, `CNY`, `KRW`, `RUB`, `TRY`, `NGN`, `ARS`, `AUD`, `CHF`, and `GBP`. */
    quoteCurrency?: Quote;
    /** * Omit log events. */
    noLogs?: boolean;
}>;
export type EarliestTransactionsForAddressResponse = Nullable<{
    /** * The requested address. */
    address: string;
    /** * The timestamp when the response was generated. Useful to show data staleness to users. */
    updated_at: Date;
    /** * The requested quote currency eg: `USD`. */
    quote_currency: Quote;
    /** * The requested chain ID eg: `1`. */
    chain_id: ChainID;
    /** * The requested chain name eg: `eth-mainnet`. */
    chain_name: ChainName;
    complete: boolean;
    /** * The current bucket of the response. */
    current_bucket: number;
    /** * URL link to the next and prev pages. */
    links: PaginationLinks;
    /** * List of response items. */
    items: Transaction[];
    /** * An executable async function for the prev page. */
    prev: (() => Promise<GoldRushResponse<EarliestTransactionsForAddressResponse>>) | null;
    /** * An executable async function for the next page. */
    next: (() => Promise<GoldRushResponse<EarliestTransactionsForAddressResponse>>) | null;
}>;
export type TransactionsForBlockResponse = Nullable<{
    /** * The timestamp when the response was generated. Useful to show data staleness to users. */
    updated_at: Date;
    /** * The requested chain ID eg: `1`. */
    chain_id: ChainID;
    /** * The requested chain name eg: `eth-mainnet`. */
    chain_name: ChainName;
    /** * List of response items. */
    items: Transaction[];
}>;
