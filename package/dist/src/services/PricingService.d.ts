import { type Execution } from "../utils/functions/execution";
import type { Chain, GoldRushResponse, Quote } from "../utils/types/Generic.types";
import type { GetTokenPricesQueryParamOpts, PoolSpotPriceQueryParamsOpts, PoolSpotPricesResponse, TokenPricesResponse } from "../utils/types/PricingService.types";
/**
 * Pricing API
 *
 */
export declare class PricingService {
    private execution;
    constructor(execution: Execution);
    /**
     *
     * Get the historical prices of one (or many) large cap ERC20 tokens between specified date ranges. Also supports native tokens.
     *
     * **Credit Cost**: 1 per call
     *
     * @param {Chain} chainName - The chain name eg: `eth-mainnet` or 1.
     * @param {string} quoteCurrency - The currency to convert. Supports `USD`, `CAD`, `EUR`, `SGD`, `INR`, `JPY`, `VND`, `CNY`, `KRW`, `RUB`, `TRY`, `NGN`, `ARS`, `AUD`, `CHF`, and `GBP`.
     * @param {string} contractAddress - Contract address for the token. Passing in an `ENS`, `RNS`, `Lens Handle`, or an `Unstoppable Domain` resolves automatically. Supports multiple contract addresses separated by commas.
     * @param {GetTokenPricesQueryParamOpts} queryParamOpts
     *   - `from`: The start day of the historical price range (YYYY-MM-DD).
     *   - `to`: The end day of the historical price range (YYYY-MM-DD).
     *   - `pricesAtAsc`: Sort the prices in chronological ascending order. By default, it's set to `false` and returns prices in chronological descending order.
     *
     */
    getTokenPrices(chainName: Chain, quoteCurrency: Quote, contractAddress: string, queryParamOpts?: GetTokenPricesQueryParamOpts): Promise<GoldRushResponse<TokenPricesResponse[]>>;
    /**
     *
     * Get the spot token pair prices for a specified pool contract address. Supports pools on Uniswap V2, V3 and their forks.
     *
     * **Credit Cost**: 1 per call
     *
     * @param {Chain} chainName - The chain name eg: `eth-mainnet` or 1.
     * @param {string} contractAddress - The pool contract address.
     * @param {GetTokenPricesQueryParamOpts} queryParamOpts
     *    - `quoteCurrency`: The currency to convert. Supports `USD`, `CAD`, `EUR`, `SGD`, `INR`, `JPY`, `VND`, `CNY`, `KRW`, `RUB`, `TRY`, `NGN`, `ARS`, `AUD`, `CHF`, `GBP`, `BTC` and `ETH`.
     *
     */
    getPoolSpotPrices(chainName: Chain, contractAddress: string, queryParamOpts?: PoolSpotPriceQueryParamsOpts): Promise<GoldRushResponse<PoolSpotPricesResponse[]>>;
}
