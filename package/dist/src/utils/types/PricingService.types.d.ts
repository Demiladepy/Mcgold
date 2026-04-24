import { type ContractMetadata, type LogoUrls, type Nullable, type Quote } from "./Generic.types";
export type TokenPricesResponse = Nullable<{
    /** * Use contract decimals to format the token balance for display purposes - divide the balance by `10^{contract_decimals}`. */
    contract_decimals: number;
    /** * The string returned by the `name()` method. */
    contract_name: string;
    /** * The ticker symbol for this contract. This field is set by a developer and non-unique across a network. */
    contract_ticker_symbol: string;
    /** * Use the relevant `contract_address` to lookup prices, logos, token transfers, etc. */
    contract_address: string;
    /** * A list of supported standard ERC interfaces, eg: `ERC20` and `ERC721`. */
    supports_erc: string[];
    /** * The contract logo URL. */
    logo_url: string;
    /** * The timestamp when the response was generated. Useful to show data staleness to users. */
    update_at: Date;
    /** * The requested quote currency eg: `USD`. */
    quote_currency: Quote;
    /** * The contract logo URLs. */
    logo_urls: LogoUrls;
    /** * List of response items. */
    items: Price[];
}>;
export type Price = Nullable<{
    contract_metadata: ContractMetadata;
    /** * The date of the price capture. */
    date: Date;
    /** * The price in the requested `quote-currency`. */
    price: number;
    /** * A prettier version of the price for rendering purposes. */
    pretty_price: string;
}>;
export type GetTokenPricesQueryParamOpts = Nullable<{
    /** * The start day of the historical price range (YYYY-MM-DD). */
    from?: string;
    /** * The end day of the historical price range (YYYY-MM-DD). */
    to?: string;
    /** * Sort the prices in chronological ascending order. By default, it's set to `false` and returns prices in chronological descending order. */
    pricesAtAsc?: boolean;
}>;
export type PoolSpotPriceQueryParamsOpts = Nullable<{
    /** * The currency to convert. */
    quoteCurrency: string;
}>;
export type PoolSpotPricesResponse = Nullable<{
    /** * The timestamp when the response was generated. */
    updated_at: Date;
    /** * The pool contract address. */
    pool_address: string;
    /** * The contract address of token_0 in the token pair making up the pool. */
    token_0_address: string;
    /** * The contract name of token_0 in the token pair making up the pool. */
    token_0_name: string;
    /** * The contract symbol of token_0 in the token pair making up the pool. */
    token_0_ticker: string;
    /** * Price of token_0 in units of token_1. */
    token_0_price: string;
    /** * Price of token_0 in units of token_1 as of 24 hours ago. */
    token_0_price_24h: string;
    /** * Price of token_0 in the selected quote currency (defaults to USD). */
    token_0_price_quote: string;
    /** * Price of token_0 in the selected quote currency (defaults to USD) as of 24 hours ago. */
    token_0_price_24h_quote: string;
    /** * The contract address of token_1 in the token pair making up the pool. */
    token_1_address: string;
    /** * The contract name of token_1 in the token pair making up the pool. */
    token_1_name: string;
    /** * The contract symbol of token_1 in the token pair making up the pool. */
    token_1_ticker: string;
    /** * Price of token_1 in units of token_0. */
    token_1_price: string;
    /** * Price of token_1 in units of token_0 as of 24 hours ago. */
    token_1_price_24h: string;
    /** * Price of token_1 in the selected quote currency (defaults to USD). */
    token_1_price_quote: string;
    /** * Price of token_1 in the selected quote currency (defaults to USD) as of 24 hours ago. */
    token_1_price_24h_quote: string;
    /** * The currency to convert. */
    quote_currency: string;
}>;
