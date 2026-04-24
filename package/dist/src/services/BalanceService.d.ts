import { type Execution } from "../utils/functions/execution";
import { type BalancesResponse, type Erc20TransfersResponse, type GetErc20TransfersForWalletAddressQueryParamOpts, type GetHistoricalPortfolioForWalletAddressQueryParamOpts, type GetHistoricalTokenBalancesForWalletAddressQueryParamOpts, type GetNativeTokenBalanceQueryParamOpts, type GetTokenBalancesForWalletAddressQueryParamOpts, type GetTokenHoldersV2ForTokenAddressQueryParamOpts, type HistoricalBalancesResponse, type PortfolioResponse, type TokenBalanceNativeResponse, type TokenHoldersResponse } from "../utils/types/BalanceService.types";
import { type Chain, type GoldRushResponse } from "../utils/types/Generic.types";
/**
 * Balances APIs
 *
 */
export declare class BalanceService {
    private execution;
    constructor(execution: Execution);
    /**
     *
     * Commonly used to fetch the native and fungible (ERC20) tokens held by an address. Response includes spot prices and other metadata.
     *
     * **Credit Cost**: 1 per call
     *
     * @param {Chain} chainName - The chain name eg: `eth-mainnet` or 1.
     * @param {string} walletAddress - The requested address. Passing in an `ENS`, `RNS`, `Lens Handle`, or an `Unstoppable Domain` resolves automatically.
     * @param {GetTokenBalancesForWalletAddressQueryParamOpts} queryParamOpts
     *   - `quoteCurrency`: The currency to convert. Supports `USD`, `CAD`, `EUR`, `SGD`, `INR`, `JPY`, `VND`, `CNY`, `KRW`, `RUB`, `TRY`, `NGN`, `ARS`, `AUD`, `CHF`, and `GBP`.
     *   - `noSpam`: If `true`, the suspected spam tokens are removed. Supports `eth-mainnet` and `matic-mainnet`.
     *
     */
    getTokenBalancesForWalletAddress(chainName: Chain, walletAddress: string, queryParamOpts?: GetTokenBalancesForWalletAddressQueryParamOpts): Promise<GoldRushResponse<BalancesResponse>>;
    /**
     *
     * Commonly used to render a daily portfolio balance for an address broken down by the token. The timeframe is user-configurable, defaults to 30 days.
     *
     * **Credit Cost**: 2 per 30 days
     *
     * @param {Chain} chainName - The chain name eg: `eth-mainnet` or 1.
     * @param {string} walletAddress - The requested address. Passing in an `ENS`, `RNS`, `Lens Handle`, or an `Unstoppable Domain` resolves automatically.
     * @param {GetHistoricalPortfolioForWalletAddressQueryParamOpts} queryParamOpts
     *   - `quoteCurrency`: The currency to convert. Supports `USD`, `CAD`, `EUR`, `SGD`, `INR`, `JPY`, `VND`, `CNY`, `KRW`, `RUB`, `TRY`, `NGN`, `ARS`, `AUD`, `CHF`, and `GBP`.
     *   - `days`: The number of days to return data for. Defaults to 30 days.
     *
     */
    getHistoricalPortfolioForWalletAddress(chainName: Chain, walletAddress: string, queryParamOpts?: GetHistoricalPortfolioForWalletAddressQueryParamOpts): Promise<GoldRushResponse<PortfolioResponse>>;
    /**
     *
     * Commonly used to render the transfer-in and transfer-out of a token along with historical prices from an address.
     *
     * **Credit Cost**: 0.05 per item
     *
     * @param {Chain} chainName - The chain name eg: `eth-mainnet` or 1.
     * @param {string} walletAddress - The requested address. Passing in an `ENS`, `RNS`, `Lens Handle`, or an `Unstoppable Domain` resolves automatically.
     * @param {GetErc20TransfersForWalletAddressQueryParamOpts} queryParamOpts
     *   - `quoteCurrency`: The currency to convert. Supports `USD`, `CAD`, `EUR`, `SGD`, `INR`, `JPY`, `VND`, `CNY`, `KRW`, `RUB`, `TRY`, `NGN`, `ARS`, `AUD`, `CHF`, and `GBP`.
     *   - `contractAddress`: The requested contract address. Passing in an `ENS`, `RNS`, `Lens Handle`, or an `Unstoppable Domain` resolves automatically.
     *   - `startingBlock`: The block height to start from, defaults to `0`.
     *   - `endingBlock`: The block height to end at, defaults to current block height.
     *   - `pageSize`: Number of items per page. Omitting this parameter defaults to 100.
     *   - `pageNumber`: 0-indexed page number to begin pagination.
     *
     */
    getErc20TransfersForWalletAddress(chainName: Chain, walletAddress: string, queryParamOpts: GetErc20TransfersForWalletAddressQueryParamOpts): AsyncIterable<GoldRushResponse<Erc20TransfersResponse>>;
    /**
     *
     * Commonly used to render the transfer-in and transfer-out of a token along with historical prices from an address.
     *
     * **Credit Cost**: 0.05 per item
     *
     * @param {Chain} chainName - The chain name eg: `eth-mainnet` or 1.
     * @param {string} walletAddress - The requested address. Passing in an `ENS`, `RNS`, `Lens Handle`, or an `Unstoppable Domain` resolves automatically.
     * @param {GetErc20TransfersForWalletAddressQueryParamOpts} queryParamOpts
     *   - `quoteCurrency`: The currency to convert. Supports `USD`, `CAD`, `EUR`, `SGD`, `INR`, `JPY`, `VND`, `CNY`, `KRW`, `RUB`, `TRY`, `NGN`, `ARS`, `AUD`, `CHF`, and `GBP`.
     *   - `contractAddress`: The requested contract address. Passing in an `ENS`, `RNS`, `Lens Handle`, or an `Unstoppable Domain` resolves automatically.
     *   - `startingBlock`: The block height to start from, defaults to `0`.
     *   - `endingBlock`: The block height to end at, defaults to current block height.
     *   - `pageSize`: Number of items per page. Omitting this parameter defaults to 100.
     *   - `pageNumber`: 0-indexed page number to begin pagination.
     *
     */
    getErc20TransfersForWalletAddressByPage(chainName: Chain, walletAddress: string, queryParamOpts: GetErc20TransfersForWalletAddressQueryParamOpts): Promise<GoldRushResponse<Erc20TransfersResponse>>;
    /**
     *
     * Used to get a paginated list of current or historical token holders for a specified ERC20 or ERC721 token.
     *
     * **Credit Cost**: 0.02 per item
     *
     * @param {Chain} chainName - The chain name eg: `eth-mainnet` or 1.
     * @param {string} tokenAddress - The requested address. Passing in an `ENS`, `RNS`, `Lens Handle`, or an `Unstoppable Domain` resolves automatically.
     * @param {GetTokenHoldersV2ForTokenAddressQueryParamOpts} queryParamOpts
     *   - `noSnapshot`: Defaults to `false`. Set to `true` to bypass last snapshot and get the latest token holders list.
     *   - `blockHeight`: Ending block to define a block range. Omitting this parameter defaults to the latest block height.
     *   - `pageSize`: Number of items per page. Note: Currently, only values of `100` and `1000` are supported. Omitting this parameter defaults to 100.
     *   - `pageNumber`: 0-indexed page number to begin pagination.
     *   - `date`: Ending date to define a block range (YYYY-MM-DD). Omitting this parameter defaults to the current date.
     *
     */
    getTokenHoldersV2ForTokenAddress(chainName: Chain, tokenAddress: string, queryParamOpts?: GetTokenHoldersV2ForTokenAddressQueryParamOpts): AsyncIterable<GoldRushResponse<TokenHoldersResponse>>;
    /**
     *
     * Used to get a paginated list of current or historical token holders for a specified ERC20 or ERC721 token.
     *
     * **Credit Cost**: 0.02 per item
     *
     * @param {Chain} chainName - The chain name eg: `eth-mainnet` or 1.
     * @param {string} tokenAddress - The requested address. Passing in an `ENS`, `RNS`, `Lens Handle`, or an `Unstoppable Domain` resolves automatically.
     * @param {GetTokenHoldersV2ForTokenAddressQueryParamOpts} queryParamOpts
     *   - `noSnapshot`: Defaults to `false`. Set to `true` to bypass last snapshot and get the latest token holders list.
     *   - `blockHeight`: Ending block to define a block range. Omitting this parameter defaults to the latest block height.
     *   - `pageSize`: Number of items per page. Note: Currently, only values of `100` and `1000` are supported. Omitting this parameter defaults to 100.
     *   - `pageNumber`: 0-indexed page number to begin pagination.
     *   - `date`: Ending date to define a block range (YYYY-MM-DD). Omitting this parameter defaults to the current date.
     *
     */
    getTokenHoldersV2ForTokenAddressByPage(chainName: Chain, tokenAddress: string, queryParamOpts?: GetTokenHoldersV2ForTokenAddressQueryParamOpts): Promise<GoldRushResponse<TokenHoldersResponse>>;
    /**
     *
     * Commonly used to fetch the historical native and fungible (ERC20) tokens held by an address at a given block height or date. Response includes daily prices and other metadata.
     *
     * **Credit Cost**: 1 per call
     *
     * @param {Chain} chainName - The chain name eg: `eth-mainnet` or 1.
     * @param {string} walletAddress - The requested address. Passing in an `ENS`, `RNS`, `Lens Handle`, or an `Unstoppable Domain` resolves automatically.
     * @param {GetHistoricalTokenBalancesForWalletAddressQueryParamOpts} queryParamOpts
     *   - `quoteCurrency`: The currency to convert. Supports `USD`, `CAD`, `EUR`, `SGD`, `INR`, `JPY`, `VND`, `CNY`, `KRW`, `RUB`, `TRY`, `NGN`, `ARS`, `AUD`, `CHF`, and `GBP`.
     *   - `noSpam`: If `true`, the suspected spam tokens are removed. Supports `eth-mainnet` and `matic-mainnet`.
     *   - `blockHeight`: Ending block to define a block range. Omitting this parameter defaults to the latest block height.
     *   - `date`: Ending date to define a block range (YYYY-MM-DD). Omitting this parameter defaults to the current date.
     *
     */
    getHistoricalTokenBalancesForWalletAddress(chainName: Chain, walletAddress: string, queryParamOpts?: GetHistoricalTokenBalancesForWalletAddressQueryParamOpts): Promise<GoldRushResponse<HistoricalBalancesResponse>>;
    /**
     *
     * Lightweight endpoint to just get the native token balance for an EVM address.
     *
     * **Credit Cost**: 0.5 per call
     *
     * @param {Chain} chainName - The chain name eg: `eth-mainnet` or 1.
     * @param {string} walletAddress - The requested address. Passing in an `ENS`, `RNS`, `Lens Handle`, or an `Unstoppable Domain` resolves automatically.
     * @param {GetNativeTokenBalanceQueryParamOpts} queryParamOpts
     *   - `quoteCurrency`: The currency to convert. Supports `USD`, `CAD`, `EUR`, `SGD`, `INR`, `JPY`, `VND`, `CNY`, `KRW`, `RUB`, `TRY`, `NGN`, `ARS`, `AUD`, `CHF`, and `GBP`.
     *   - `blockHeight`: Ending block to define a block range. Omitting this parameter defaults to the latest block height.
     *
     */
    getNativeTokenBalance(chainName: Chain, walletAddress: string, queryParamOpts?: GetNativeTokenBalanceQueryParamOpts): Promise<GoldRushResponse<TokenBalanceNativeResponse>>;
}
