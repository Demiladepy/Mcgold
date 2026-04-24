import { type BalanceItem } from "./BalanceService.types";
import { type ChainID, type ChainName, type Nullable, type Pagination, type Quote } from "./Generic.types";
export type GetBitcoinHdWalletBalancesQueryParamOpts = Nullable<{
    /** * The currency to convert. Supports `USD`, `CAD`, `EUR`, `SGD`, `INR`, `JPY`, `VND`, `CNY`, `KRW`, `RUB`, `TRY`, `NGN`, `ARS`, `AUD`, `CHF`, and `GBP`. */
    quoteCurrency?: Quote;
}>;
export type BitcoinHdWalletBalancesResponse = Nullable<{
    /** * The requested address. */
    address: string;
    /** * The timestamp when the response was generated. Useful to show data staleness to users. */
    updated_at: Date;
    /** * The requested quote currency eg: `USD`. */
    quote_currency: Quote;
    /** * Bitcoin chain ID. */
    chain_id: ChainID;
    /** * Bitcoin Chain Name. */
    chain_name: ChainName;
    /** * List of response items. */
    items: BitcoinHdWalletBalanceItem[];
}>;
export type BitcoinHdWalletBalanceItem = BalanceItem & Nullable<{
    /** * The specific Bitcoin address derived from the HD wallet. */
    child_address: string;
    /** * Derivation path used to derive the specific Bitcoin address, e.g., M/0H/0/0. */
    address_path: string;
    /** * The HD wallet path. */
    hd_wallet_path: string;
}>;
export type GetTransactionsForBitcoinAddressParamOpts = Nullable<{
    /** * The bitcoin address to query. */
    address?: string;
    /** * Omit log events. */
    pageSize?: number;
    /** * Include safe details. */
    pageNumber?: number;
}>;
export type GetBitcoinNonHdWalletBalancesQueryParamOpts = Nullable<{
    /** * The currency to convert. Supports `USD`, `CAD`, `EUR`, `SGD`, `INR`, `JPY`, `VND`, `CNY`, `KRW`, `RUB`, `TRY`, `NGN`, `ARS`, `AUD`, `CHF`, and `GBP`. */
    quoteCurrency?: Quote;
}>;
export type BitcoinTransactionResponse = Nullable<{
    /** * The timestamp when the response was generated. Useful to show data staleness to users. */
    updated_at: Date;
    /** * List of response items. */
    items: BitcoinTransaction[];
    /** * Pagination metadata. */
    pagination: Pagination;
}>;
export type BitcoinTransaction = Nullable<{
    /** The requested chain ID eg: 20090103. */
    chain_id: number;
    /** The requested chain name eg: btc-mainnet. */
    chain_name: string;
    /** Use contract decimals to format the token balance for display purposes - divide the balance by 10^{contract_decimals}. */
    contract_decimals: number;
    /** The block signed timestamp in UTC. */
    block_signed_at: Date;
    /** The height of the block. */
    block_height: number;
    /** The hash of the block. */
    block_hash: string;
    /** The requested transaction hash. */
    tx_hash: string;
    /** The position index of the tx in the block. */
    tx_idx: number;
    /** Either 'input' as the sender or 'output' as the receiver of btc. */
    type: string;
    /** The wallet address. */
    address: string;
    /** The value attached to this tx in satoshi. */
    value: bigint;
    /** The value attached to this tx in USD. */
    quote: number;
    /** The value token exchange rate in USD. */
    quote_rate: number;
    /** The total transaction fees denoted in satoshi. */
    fees_paid: bigint;
    /** The gas spent in USD. */
    gas_quote: number;
    /** The native gas token exchange rate in USD. */
    gas_quote_rate: number;
    /** Indicates if this is a coinbase tx where btc is rewarded to a miner for validating the block. */
    coinbase: boolean;
    /** The earliest Unix timestamp or block height at which the tx is valid and can be included. Is 0 if no restriction. */
    locktime: number;
    /** A measure that reflects impact on the block size limit. Used to determine fees. */
    weight: number;
}>;
