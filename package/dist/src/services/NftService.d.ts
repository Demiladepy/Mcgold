import { type Execution } from "../utils/functions/execution";
import { type Chain, type GoldRushResponse } from "../utils/types/Generic.types";
import { type CheckOwnershipInNftQueryParamOpts, type GetNftsForAddressQueryParamOpts, type NftAddressBalanceNftResponse, type NftOwnershipForCollectionResponse } from "../utils/types/NftService.types";
/**
 * NFTs API
 *
 */
export declare class NftService {
    private execution;
    constructor(execution: Execution);
    /**
     *
     * Commonly used to render the NFTs (including ERC721 and ERC1155) held by an address.
     *
     * **Credit Cost**: 1 per call
     *
     * @param {string} chainName - The chain name eg: `eth-mainnet`.
     * @param {string} walletAddress - The requested address. Passing in an `ENS`, `RNS`, `Lens Handle`, or an `Unstoppable Domain` resolves automatically.
     * @param {GetNftsForAddressQueryParamOpts} queryParamOpts
     *   - `noSpam`: If `true`, the suspected spam tokens are removed. Supports `eth-mainnet` and `matic-mainnet`.
     *   - `noNftAssetMetadata`: If `true`, the response shape is limited to a list of collections and token ids, omitting metadata and asset information. Helpful for faster response times and wallets holding a large number of NFTs.
     *
     */
    getNftsForAddress(chainName: Chain, walletAddress: string, queryParamOpts?: GetNftsForAddressQueryParamOpts): Promise<GoldRushResponse<NftAddressBalanceNftResponse>>;
    /**
     *
     * Commonly used to verify ownership of NFTs (including ERC-721 and ERC-1155) within a collection.
     *
     * **Credit Cost**: 1 per call
     *
     * @param {string} chainName - The chain name eg: `eth-mainnet`.
     * @param {string} walletAddress - The requested address. Passing in an `ENS`, `RNS`, `Lens Handle`, or an `Unstoppable Domain` resolves automatically.
     * @param {string} collectionContract - The requested collection address.
     * @param {CheckOwnershipInNftQueryParamOpts} queryParamOpts
     *   - `traitsFilter`: Filters NFTs based on a specific trait. If this filter is used, the API will return all NFTs with the specified trait. Must be used with "values-filter", is case-sensitive, and requires proper URL encoding.
     *   - `valuesFilter`: Filters NFTs based on a specific trait value. If this filter is used, the API will return all NFTs with the specified trait value. Must be used with "traits-filter", is case-sensitive, and requires proper URL encoding.
     *
     */
    checkOwnershipInNft(chainName: Chain, walletAddress: string, collectionContract: string, queryParamOpts?: CheckOwnershipInNftQueryParamOpts): Promise<GoldRushResponse<NftOwnershipForCollectionResponse>>;
    /**
     *
     * Commonly used to verify ownership of a specific token (ERC-721 or ERC-1155) within a collection.
     *
     * **Credit Cost**: 1 per call
     *
     * @param {string} chainName - The chain name eg: `eth-mainnet`.
     * @param {string} walletAddress - The requested address. Passing in an `ENS`, `RNS`, `Lens Handle`, or an `Unstoppable Domain` resolves automatically.
     * @param {string} collectionContract - The requested collection address. Passing in an `ENS`, `RNS`, `Lens Handle`, or an `Unstoppable Domain` resolves automatically.
     * @param {string} tokenId - The requested token ID.
     *
     */
    checkOwnershipInNftForSpecificTokenId(chainName: Chain, walletAddress: string, collectionContract: string, tokenId: string): Promise<GoldRushResponse<NftOwnershipForCollectionResponse>>;
}
