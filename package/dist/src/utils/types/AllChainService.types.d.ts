import { type ChainItem } from "./BaseService.types";
import { type Chain, type ChainID, type ChainName, type CryptocurrencyQuote, type LogoUrls, type Nullable, type Quote } from "./Generic.types";
import { type Transaction } from "./TransactionService.types";
export type ChainActivityEvent = Nullable<{
    /** * The timestamp when the address was last seen on the chain. */
    last_seen_at: Date;
} & ChainItem>;
export type ChainActivityResponse = Nullable<{
    /** * The timestamp when the response was generated. Useful to show data staleness to users. */
    updated_at: Date;
    /** * The requested address. */
    address: string;
    /** * List of response items. */
    items: ChainActivityEvent[];
}>;
export type GetAddressActivityQueryParamOpts = Nullable<{
    /** * Set to true to include testnets with activity in the response. By default, it's set to `false` and only returns mainnet activity. */
    testnets?: boolean;
}>;
export type MultiChainTransaction = Transaction & {
    /** * The requested chain ID eg: `1`. */
    chain_id: ChainID;
    /** * The requested chain name eg: `eth-mainnet`. */
    chain_name: ChainName;
};
export type MultiChainMultiAddressTransactionsResponse = Nullable<{
    /** * The timestamp when the response was generated. Useful to show data staleness to users. */
    updated_at: Date;
    /** * The the pagination cursor to get the previous page of results */
    cursor_before: string;
    /** * The the pagination cursor to get the next page of results */
    cursor_after: string;
    /** * The requested quote currency eg: `USD`. */
    quote_currency: Quote | CryptocurrencyQuote;
    /** * List of response items. */
    items: MultiChainTransaction[];
}>;
export type GetMultiChainMultiAddressTransactionsParamOtps = Nullable<{
    /** * An array of the chain names or IDs to retrieve transactions from. Defaults to all foundational chains. */
    chains?: Chain[];
    /** * An array of addresses for which transactions are fetched. Does not support name resolution. */
    addresses?: string[];
    /** * Number of transactions to return per page, up to the default max of 100 items. */
    limit?: number;
    /** * Pagination cursor pointing to fetch transactions before a certain point. */
    before?: string;
    /** * Pagination cursor pointing to fetch transactions after a certain point. */
    after?: string;
    /** * Whether to include raw logs in the response. */
    withLogs?: boolean;
    /** * Whether to include decoded logs in the response. */
    withDecodedLogs?: boolean;
    /** * The currency to convert. Supports `USD`, `CAD`, `EUR`, `SGD`, `INR`, `JPY`, `VND`, `CNY`, `KRW`, `RUB`, `TRY`, `NGN`, `ARS`, `AUD`, `CHF`, `GBP`, "BTC" and "ETH". */
    quoteCurrency?: Quote | CryptocurrencyQuote;
}>;
export type MultiChainBalanceItem = Nullable<{
    /** * Use contract decimals to format the token balance for display purposes - divide the balance by `10^{contract_decimals}`. */
    contract_decimals: number;
    /** * The string returned by the `name()` method. */
    contract_name: string;
    /** * The ticker symbol for this contract. This field is set by a developer and non-unique across a network. */
    contract_ticker_symbol: string;
    /** * Use the relevant `contract_address` to lookup prices, logos, token transfers, etc. */
    contract_address: string;
    /** * A display-friendly name for the contract. */
    contract_display_name: string;
    /** * A list of supported standard ERC interfaces, eg: `ERC20` and `ERC721`. */
    supports_erc: string[];
    /** * The contract logo URL. */
    logo_url: string;
    /** * The contract logo URLs. */
    logo_urls: LogoUrls;
    /** * The timestamp when the token was transferred. */
    last_transferred_at: Date;
    /** * Indicates if a token is the chain's native gas token, eg: ETH on Ethereum. */
    is_native_token: boolean;
    /** * One of `cryptocurrency`, `stablecoin`, `nft` or `dust`. */
    type: string;
    /** * Denotes whether the token is suspected spam. */
    is_spam: boolean;
    /** * The asset balance. Use `contract_decimals` to scale this balance for display purposes. */
    balance: bigint;
    /** * The 24h asset balance. Use `contract_decimals` to scale this balance for display purposes. */
    balance_24h: bigint;
    /** * The exchange rate for the requested quote currency. */
    quote_rate: number;
    /** * The 24h exchange rate for the requested quote currency. */
    quote_rate_24h: number;
    /** * The current balance converted to fiat in `quote-currency`. */
    quote: number;
    /** * The 24h balance converted to fiat in `quote-currency`. */
    quote_24h: number;
    /** * A prettier version of the quote for rendering purposes. */
    pretty_quote: string;
    /** * A prettier version of the 24h quote for rendering purposes. */
    pretty_quote_24h: string;
    /** * The requested chain ID eg: `1`. */
    chain_id: ChainID;
    /** * The requested chain name eg: `eth-mainnet`. */
    chain_name: ChainName;
}>;
export type GetMultiChainBalanceQueryParamOpts = Nullable<{
    /** * The currency to convert. Supports `USD`, `CAD`, `EUR`, `SGD`, `INR`, `JPY`, `VND`, `CNY`, `KRW`, `RUB`, `TRY`, `NGN`, `ARS`, `AUD`, `CHF`, `GBP`, `ETH`, and `BTC`. */
    quoteCurrency?: Quote | CryptocurrencyQuote;
    /** * The cursor for pagination. */
    before?: string;
    /** * The number of items per page. Omitting this parameter defaults to 100. */
    limit?: number;
    /** * The requested chain ID or chain names eg: `[1,137], ["eth-mainnet", "bsc-mainnet"]`. Defaults to Foundational Chains. */
    chains?: ChainID[] | ChainName[];
    /** * The timestamp to query balances at. If omitted, the latest balances are returned. */
    cutoffTimestamp?: number;
}>;
export type MultiChainBalanceResponse = Nullable<{
    /** * Next cursor for pagination. */
    cursor_before: string;
    /** * The timestamp when the response was generated. Useful to show data staleness to users. */
    updated_at: Date;
    /** * The requested quote currency eg: `USD`. */
    quote_currency: Quote | CryptocurrencyQuote;
    /** * List of response items. */
    items: MultiChainBalanceItem[];
}>;
