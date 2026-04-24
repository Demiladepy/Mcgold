import { type NftData, type Nullable } from "./Generic.types";
export type NftAddressBalanceNftResponse = Nullable<{
    /** * The requested address. */
    address: string;
    /** * The timestamp when the response was generated. Useful to show data staleness to users. */
    updated_at: Date;
    /** * List of response items. */
    items: NftTokenContractBalanceItem[];
}>;
export type NftTokenContractBalanceItem = Nullable<{
    /** * The string returned by the `name()` method. */
    contract_name: string;
    /** * The ticker symbol for this contract. This field is set by a developer and non-unique across a network. */
    contract_ticker_symbol: string;
    /** * Use the relevant `contract_address` to lookup prices, logos, token transfers, etc. */
    contract_address: string;
    /** * A list of supported standard ERC interfaces, eg: `ERC20` and `ERC721`. */
    supports_erc: string[];
    /** * Denotes whether the token is suspected spam. Supports `eth-mainnet` and `matic-mainnet`. */
    is_spam: boolean;
    last_transfered_at: Date;
    /** * The asset balance. Use `contract_decimals` to scale this balance for display purposes. */
    balance: bigint;
    balance_24h: bigint;
    type: string;
    /** * The current floor price converted to fiat in `quote-currency`. The floor price is determined by the last minimum sale price within the last 30 days across all the supported markets where the collection is sold on. */
    floor_price_quote: number;
    /** * A prettier version of the floor price quote for rendering purposes. */
    pretty_floor_price_quote: string;
    /** * The current floor price in native currency. The floor price is determined by the last minimum sale price within the last 30 days across all the supported markets where the collection is sold on. */
    floor_price_native_quote: number;
    nft_data: NftData[];
}>;
export type NftOwnershipForCollectionResponse = Nullable<{
    /** * The timestamp when the response was generated. Useful to show data staleness to users. */
    updated_at: Date;
    /** * The requested address. */
    address: string;
    /** * The requested collection. */
    collection: string;
    /** * Denotes whether the token is suspected spam. Supports `eth-mainnet` and `matic-mainnet`. */
    is_spam: boolean;
    /** * List of response items. */
    items: NftOwnershipForCollectionItem[];
}>;
export type NftOwnershipForCollectionItem = Nullable<{
    /** * The string returned by the `name()` method. */
    contract_name: string;
    /** * The ticker symbol for this contract. This field is set by a developer and non-unique across a network. */
    contract_ticker_symbol: string;
    /** * Use the relevant `contract_address` to lookup prices, logos, token transfers, etc. */
    contract_address: string;
    /** * The token's id. */
    token_id: bigint;
    /** * A list of supported standard ERC interfaces, eg: `ERC20` and `ERC721`. */
    supports_erc: string[];
    last_transfered_at: Date;
    /** * Nft balance. */
    balance: bigint;
    balance_24h: bigint;
    type: string;
    nft_data: NftData;
}>;
export type GetNftsForAddressQueryParamOpts = Nullable<{
    /** * If `true`, the suspected spam tokens are removed. Supports `eth-mainnet` and `matic-mainnet`. */
    noSpam?: boolean;
    /** * If `true`, the response shape is limited to a list of collections and token ids, omitting metadata and asset information. Helpful for faster response times and wallets holding a large number of NFTs. */
    noNftAssetMetadata?: boolean;
}>;
export type CheckOwnershipInNftQueryParamOpts = Nullable<{
    /** * Filters NFTs based on a specific trait. If this filter is used, the API will return all NFTs with the specified trait. Must be used with "values-filter", is case-sensitive, and requires proper URL encoding. */
    traitsFilter?: string;
    /** * Filters NFTs based on a specific trait value. If this filter is used, the API will return all NFTs with the specified trait value. Must be used with "traits-filter", is case-sensitive, and requires proper URL encoding. */
    valuesFilter?: string;
}>;
