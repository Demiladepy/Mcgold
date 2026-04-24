import { type Execution } from "../utils/functions/execution";
import type { Chain, GoldRushResponse } from "../utils/types/Generic.types";
import type { EarliestTransactionsForAddressResponse, GetAllTransactionsForAddressQueryParamOpts, GetEarliestTransactionsForAddressQueryParamOpts, getPaginatedTransactionsForAddressQueryParamOpts, GetTimeBucketTransactionsForAddressQueryParamOpts, GetTransactionQueryParamOpts, getTransactionsForBlockByPageQueryParamOpts, GetTransactionSummaryQueryParamOpts, RecentTransactionsResponse, TransactionResponse, TransactionsBlockResponse, TransactionsForBlockResponse, TransactionsResponse, TransactionsSummaryResponse, TransactionsTimeBucketResponse } from "../utils/types/TransactionService.types";
/**
 * Transactions API
 *
 */
export declare class TransactionService {
    private execution;
    constructor(execution: Execution);
    /**
     *
     * Used to fetch and render a single transaction including its decoded event logs. For foundational chains, can also retrieve internal transactions, state changes and method ID where available.
     *
     * **Credit Cost**: 0.1 per call
     *
     * @param {Chain} chainName - The chain name eg: `eth-mainnet` or 1.
     * @param {string} txHash - The transaction hash.
     * @param {GetTransactionQueryParamOpts} queryParamOpts
     *   - `quoteCurrency`: The currency to convert. Supports `USD`, `CAD`, `EUR`, `SGD`, `INR`, `JPY`, `VND`, `CNY`, `KRW`, `RUB`, `TRY`, `NGN`, `ARS`, `AUD`, `CHF`, and `GBP`.
     *   - `noLogs`: Omit log events.
     *   - `withInternal`: Include internal transfers/transactions.
     *   - `withState`: Include all transaction state changes with before and after values.
     *   - `withInputData`: Include the transaction's input data such as the Method ID.
     *
     */
    getTransaction(chainName: Chain, txHash: string, queryParamOpts?: GetTransactionQueryParamOpts): Promise<GoldRushResponse<TransactionResponse>>;
    /**
     *
     * Used to fetch the earliest and latest transactions, and the transaction count for a wallet. Also enriched with gas expenditure details and total ERC20 token transfers count.
     *
     * **Credit Cost**: 1 per call
     *
     * @param {Chain} chainName - The chain name eg: `eth-mainnet` or 1.
     * @param {string} walletAddress - The requested address. Passing in an `ENS`, `RNS`, `Lens Handle`, or an `Unstoppable Domain` resolves automatically.
     * @param {GetTransactionSummaryQueryParamOpts} queryParamOpts
     *   - `quoteCurrency`: The currency to convert. Supports `USD`, `CAD`, `EUR`, `SGD`, `INR`, `JPY`, `VND`, `CNY`, `KRW`, `RUB`, `TRY`, `NGN`, `ARS`, `AUD`, `CHF`, and `GBP`.
     *   - `withGas`: Include gas summary details. Additional charge of 1 credit when true. Response times may be impacted for wallets with millions of transactions.
     *   - `withTransferCount`: Represents the total count of ERC-20 token movement events, including `Transfer`, `Deposit` and `Withdraw`. Response times may be impacted for wallets with large number of transactions. Additional charge of 3 credits.
     *
     */
    getTransactionSummary(chainName: Chain, walletAddress: string, queryParamOpts?: GetTransactionSummaryQueryParamOpts): Promise<GoldRushResponse<TransactionsSummaryResponse>>;
    /**
     *
     * Commonly used to fetch and render the earliest transactions involving an address. Frequently seen in wallet applications.
     *
     * @param {Chain} chainName - The chain name eg: `eth-mainnet` or 1.
     * @param {string} walletAddress - The requested address. Passing in an `ENS`, `RNS`, `Lens Handle`, or an `Unstoppable Domain` resolves automatically.
     * @param {GetEarliestTransactionsForAddressQueryParamOpts} queryParamOpts
     *   - `quoteCurrency`: The currency to convert. Supports `USD`, `CAD`, `EUR`, `SGD`, `INR`, `JPY`, `VND`, `CNY`, `KRW`, `RUB`, `TRY`, `NGN`, `ARS`, `AUD`, `CHF`, and `GBP`.
     *   - `noLogs`: Omit log events.
     *
     */
    getEarliestTransactionsForAddress(chainName: Chain, walletAddress: string, queryParamOpts?: GetEarliestTransactionsForAddressQueryParamOpts): Promise<GoldRushResponse<EarliestTransactionsForAddressResponse>>;
    /**
     *
     * Commonly used to fetch and render the most recent transactions involving an address. Frequently seen in wallet applications.
     *
     * **Credit Cost**: 0.1 per item
     *
     * @param {Chain} chainName - The chain name eg: `eth-mainnet` or 1.
     * @param {string} walletAddress - The requested address. Passing in an `ENS`, `RNS`, `Lens Handle`, or an `Unstoppable Domain` resolves automatically.
     * @param {GetAllTransactionsForAddressQueryParamOpts} queryParamOpts
     *   - `quoteCurrency`: The currency to convert. Supports `USD`, `CAD`, `EUR`, `SGD`, `INR`, `JPY`, `VND`, `CNY`, `KRW`, `RUB`, `TRY`, `NGN`, `ARS`, `AUD`, `CHF`, and `GBP`.
     *   - `noLogs`: Omit log events.
     *   - `blockSignedAtAsc`: Sort the transactions in ascending chronological order. By default, it's set to `false` and returns transactions in descending chronological order.
     *   - `withInternal`: Include internal transfers/transactions.
     *   - `withState`: Include all transaction state changes with before and after values.
     *   - `withInputData`: Include the transaction's input data such as the Method ID.
     *
     */
    getAllTransactionsForAddress(chainName: Chain, walletAddress: string, queryParamOpts?: GetAllTransactionsForAddressQueryParamOpts): AsyncIterable<GoldRushResponse<RecentTransactionsResponse>>;
    /**
     *
     * Commonly used to fetch and render the most recent transactions involving an address. Frequently seen in wallet applications.
     *
     * **Credit Cost**: 0.1 per item
     *
     * @param {Chain} chainName - The chain name eg: `eth-mainnet` or 1.
     * @param {string} walletAddress - The requested address. Passing in an `ENS`, `RNS`, `Lens Handle`, or an `Unstoppable Domain` resolves automatically.
     * @param {GetAllTransactionsForAddressQueryParamOpts} queryParamOpts
     *   - `quoteCurrency`: The currency to convert. Supports `USD`, `CAD`, `EUR`, `SGD`, `INR`, `JPY`, `VND`, `CNY`, `KRW`, `RUB`, `TRY`, `NGN`, `ARS`, `AUD`, `CHF`, and `GBP`.
     *   - `noLogs`: Omit log events.
     *   - `blockSignedAtAsc`: Sort the transactions in ascending chronological order. By default, it's set to `false` and returns transactions in descending chronological order.
     *   - `withInternal`: Include internal transfers/transactions.
     *   - `withState`: Include all transaction state changes with before and after values.
     *   - `withInputData`: Include the transaction's input data such as the Method ID.
     *
     */
    getAllTransactionsForAddressByPage(chainName: Chain, walletAddress: string, queryParamOpts?: GetAllTransactionsForAddressQueryParamOpts): Promise<GoldRushResponse<RecentTransactionsResponse>>;
    /**
     *
     * @param {Chain} chainName - The chain name eg: `eth-mainnet` or 1.
     * @param {string} walletAddress - The requested address. Passing in an `ENS`, `RNS`, `Lens Handle`, or an `Unstoppable Domain` resolves automatically.
     * @param {number} page - The requested page, 0-indexed.
     * @param {getPaginatedTransactionsForAddressQueryParamOpts} queryParamOpts
     *   - `quoteCurrency`: The currency to convert. Supports `USD`, `CAD`, `EUR`, `SGD`, `INR`, `JPY`, `VND`, `CNY`, `KRW`, `RUB`, `TRY`, `NGN`, `ARS`, `AUD`, `CHF`, and `GBP`.
     *   - `noLogs`: Omit log events.
     *   - `blockSignedAtAsc`: Sort the transactions in ascending chronological order. By default, it's set to `false` and returns transactions in descending chronological order.
     *
     */
    getPaginatedTransactionsForAddress(chainName: Chain, walletAddress: string, page: number, queryParamOpts?: getPaginatedTransactionsForAddressQueryParamOpts): Promise<GoldRushResponse<TransactionsResponse>>;
    /**
     *
     * @param {Chain} chainName - The chain name eg: `eth-mainnet` or 1.
     * @param {string} walletAddress - The requested address. Passing in an `ENS`, `RNS`, `Lens Handle`, or an `Unstoppable Domain` resolves automatically.
     * @param {number} timeBucket - The 0-indexed 15-minute time bucket. E.g. 27 Feb 2023 05:23 GMT = 1677475383 (Unix time). 1677475383/900=1863861 timeBucket.
     * @param {GetTimeBucketTransactionsForAddressQueryParamOpts} queryParamOpts
     *   - `quoteCurrency`: The currency to convert. Supports `USD`, `CAD`, `EUR`, `SGD`, `INR`, `JPY`, `VND`, `CNY`, `KRW`, `RUB`, `TRY`, `NGN`, `ARS`, `AUD`, `CHF`, and `GBP`.
     *   - `noLogs`: Omit log events.
     *
     */
    getTimeBucketTransactionsForAddress(chainName: Chain, walletAddress: string, timeBucket: number, queryParamOpts?: GetTimeBucketTransactionsForAddressQueryParamOpts): Promise<GoldRushResponse<TransactionsTimeBucketResponse>>;
    /**
     *
     * Commonly used to fetch all transactions including their decoded log events in a block and further flag interesting wallets or transactions.
     *
     * **Credit Cost**: 0.1 per item
     *
     * @param {Chain} chainName - The chain name eg: `eth-mainnet` or 1.
     * @param {number} blockHeight - The requested block height.
     * @param {number} page - The requested page, 0-indexed.
     * @param {getTransactionsForBlockByPageQueryParamOpts} queryParamOpts
     *   - `quoteCurrency`: The currency to convert. Supports `USD`, `CAD`, `EUR`, `SGD`, `INR`, `JPY`, `VND`, `CNY`, `KRW`, `RUB`, `TRY`, `NGN`, `ARS`, `AUD`, `CHF`, and `GBP`.
     *   - `noLogs`: Omit log events.
     *
     */
    getTransactionsForBlockByPage(chainName: Chain, blockHeight: number | string | "latest", page: number, queryParamOpts?: getTransactionsForBlockByPageQueryParamOpts): Promise<GoldRushResponse<TransactionsBlockResponse>>;
    /**
     *
     * Commonly used to fetch all transactions including their decoded log events in a block and further flag interesting wallets or transactions.
     *
     * **Credit Cost**: 0.1 per item
     *
     * @param {Chain} chainName - The chain name eg: `eth-mainnet` or 1.
     * @param {string} blockHash - The requested block hash.
     * @param {getTransactionsForBlockByPageQueryParamOpts} queryParamOpts
     *   - `quoteCurrency`: The currency to convert. Supports `USD`, `CAD`, `EUR`, `SGD`, `INR`, `JPY`, `VND`, `CNY`, `KRW`, `RUB`, `TRY`, `NGN`, `ARS`, `AUD`, `CHF`, and `GBP`.
     *   - `noLogs`: Omit log events.
     *
     */
    getTransactionsForBlock(chainName: Chain, blockHash: string, queryParamOpts?: getTransactionsForBlockByPageQueryParamOpts): Promise<GoldRushResponse<TransactionsForBlockResponse>>;
}
