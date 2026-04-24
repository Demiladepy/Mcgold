import { type Execution } from "../utils/functions/execution";
import { type BalancesResponse } from "../utils/types/BalanceService.types";
import { type BitcoinHdWalletBalancesResponse, type BitcoinTransactionResponse, type GetBitcoinHdWalletBalancesQueryParamOpts, type GetBitcoinNonHdWalletBalancesQueryParamOpts, type GetTransactionsForBitcoinAddressParamOpts } from "../utils/types/BitcoinService.types";
import { type GoldRushResponse } from "../utils/types/Generic.types";
/**
 * Bitcoin APIs
 *
 */
export declare class BitcoinService {
    private execution;
    constructor(execution: Execution);
    /**
     *
     * Commonly used to fetch the historical Bitcoin balance held by an address at a given block height or date. Response includes daily prices and other metadata.
     *
     * **Credit Cost**: 1 per call
     *
     * @param {string} walletAddress - The requested Bitcoin HD address.
     * @param {GetBitcoinHdWalletBalancesQueryParamOpts} queryParamOpts
     *   - `quoteCurrency`: The currency to convert. Supports `USD`, `CAD`, `EUR`, `SGD`, `INR`, `JPY`, `VND`, `CNY`, `KRW`, `RUB`, `TRY`, `NGN`, `ARS`, `AUD`, `CHF`, and `GBP`.
     *
     */
    getBitcoinHdWalletBalances(walletAddress: string, queryParamOpts?: GetBitcoinHdWalletBalancesQueryParamOpts): Promise<GoldRushResponse<BitcoinHdWalletBalancesResponse>>;
    /**
     *
     * Used to fetch the full transaction history of a Bitcoin wallet.
     *
     * @param {GetTransactionsForBitcoinAddressParamOpts} queryParamOpts
     *   - `address`: The bitcoin address to query.
     *   - `pageSize`: Number of items per page. Omitting this parameter defaults to 100.
     *   - `pageNumber`: 0-indexed page number to begin pagination.
     */
    getTransactionsForBtcAddress(queryParamOpts?: GetTransactionsForBitcoinAddressParamOpts): Promise<GoldRushResponse<BitcoinTransactionResponse>>;
    /**
     *
     * Fetch Bitcoin balance for a non-HD address. Response includes spot prices and other metadata.
     *
     * **Credit Cost**: 1 per call
     *
     * @param {string} walletAddress - The requested Bitcoin Non HD address.
     * @param {GetBitcoinNonHdWalletBalancesQueryParamOpts} queryParamOpts
     *   - `quoteCurrency`: The currency to convert. Supports `USD`, `CAD`, `EUR`, `SGD`, `INR`, `JPY`, `VND`, `CNY`, `KRW`, `RUB`, `TRY`, `NGN`, `ARS`, `AUD`, `CHF`, and `GBP`.
     *
     */
    getBitcoinNonHdWalletBalances(walletAddress: string, queryParamOpts?: GetBitcoinNonHdWalletBalancesQueryParamOpts): Promise<GoldRushResponse<BalancesResponse>>;
}
