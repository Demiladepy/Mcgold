import { type Execution } from "../utils/functions/execution";
import { type ChainActivityResponse, type GetAddressActivityQueryParamOpts, type GetMultiChainBalanceQueryParamOpts, type GetMultiChainMultiAddressTransactionsParamOtps, type MultiChainBalanceResponse, type MultiChainMultiAddressTransactionsResponse } from "../utils/types/AllChainService.types";
import { type GoldRushResponse } from "../utils/types/Generic.types";
/**
 * Cross Chain API
 *
 */
export declare class AllChainsService {
    private execution;
    constructor(execution: Execution);
    /**
     *
     * Commonly used to locate chains which an address is active on with a single API call.
     *
     * **Credit Cost**: 0.5 per call
     *
     * @param {string} walletAddress - The requested wallet address. Passing in an `ENS`, `RNS`, `Lens Handle`, or an `Unstoppable Domain` resolves automatically.
     * @param {GetAddressActivityQueryParamOpts} queryParamOpts
     *   - `testnets`: Set to true to include testnets with activity in the response. By default, it's set to `false` and only returns mainnet activity.
     *
     */
    getAddressActivity(walletAddress: string, queryParamOpts?: GetAddressActivityQueryParamOpts): Promise<GoldRushResponse<ChainActivityResponse>>;
    /**
     *
     * Commonly used to get transactions cross chains and addresses.
     *
     * @param {Chain[]} chains - An array of the chain names or IDs to retrieve transactions from. Defaults to all foundational chains.
     * @param {string[]} addresses - An array of addresses for which transactions are fetched. Does not support name resolution.
     * @param {number} limit - Number of transactions to return per page, up to the default max of 100 items.
     * @param {string} before - Pagination cursor pointing to fetch transactions before a certain point.
     * @param {string} after - Pagination cursor pointing to fetch transactions after a certain point.
     * @param {boolean} withLogs - Whether to include raw logs in the response.
     * @param {boolean} withDecodedLogs - Whether to include decoded logs in the response.
     * @param {Quote | CryptocurrencyQuote} quoteCurrency - The currency to convert. Supports `USD`, `CAD`, `EUR`, `SGD`, `INR`, `JPY`, `VND`, `CNY`, `KRW`, `RUB`, `TRY`, `NGN`, `ARS`, `AUD`, `CHF`, `GBP`, `BTC` and `ETH`.
     *
     */
    getMultiChainMultiAddressTransactions(queryParamOpts?: GetMultiChainMultiAddressTransactionsParamOtps): Promise<GoldRushResponse<MultiChainMultiAddressTransactionsResponse>>;
    /**
     *
     * Fetch paginated spot & historical native and token balances for a single address on up to 10 EVM chains with one API call.
     *
     * **Credit Cost**: 2.5 per call
     *
     * @param {string} walletAddress - The requested wallet Address.
     * @param {GetMultiChainBalanceQueryParamOpts} queryParamOpts
     *   - `quoteCurrency`: The currency to convert. Supports `USD`, `CAD`, `EUR`, `SGD`, `INR`, `JPY`, `VND`, `CNY`, `KRW`, `RUB`, `TRY`, `NGN`, `ARS`, `AUD`, `CHF`,  `GBP`, `BTC`, and `ETH`.
     *   - `chains`: Array chain ids or chain names to query. Limited to 10 chains.
     *   - `limit`: The number of items to return. Default is 100.
     *   - `timestamp`: The timestamp to query balances at. If omitted, the latest balances are returned.
     *   - `cursorBefore`: The cursor of previous page.
     */
    getMultiChainBalances(walletAddress: string, queryParamOpts?: GetMultiChainBalanceQueryParamOpts): Promise<GoldRushResponse<MultiChainBalanceResponse>>;
}
