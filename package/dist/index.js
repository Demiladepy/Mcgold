'use strict';

var version = "3.0.6";

const bigIntParser = (val) => {
    if (val === null || val === undefined) {
        return null;
    }
    return BigInt(val);
};

const baseUrl = "https://api.covalenthq.com/v1";
const endpointGenerator = (extension = "", params = []) => {
    extension = extension.replace(baseUrl, "");
    if (extension.startsWith("/")) {
        extension = extension.slice(1);
    }
    if (!extension.endsWith("/")) {
        extension = `${extension}/`;
    }
    const urlParams = new URLSearchParams();
    params.forEach((param) => {
        if (param.value !== undefined && param.value !== null) {
            urlParams.append(param.key, param.value.toString());
        }
    });
    return new URL(`${baseUrl}/${extension}?${urlParams}`);
};

/**
 * Cross Chain API
 *
 */
class AllChainsService {
    execution;
    constructor(execution) {
        this.execution = execution;
    }
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
    async getAddressActivity(walletAddress, queryParamOpts) {
        const endpoint = endpointGenerator(`address/${walletAddress}/activity`, [
            {
                key: "testnets",
                value: queryParamOpts?.testnets,
            },
        ]);
        const parseData = (data) => {
            if (data.data) {
                data.data.updated_at = data.data.updated_at
                    ? new Date(data.data.updated_at)
                    : null;
                data.data.items = data.data.items
                    ? data.data.items.map((activityItem) => ({
                        ...activityItem,
                        last_seen_at: activityItem.last_seen_at
                            ? new Date(activityItem.last_seen_at)
                            : null,
                    }))
                    : null;
            }
            return data;
        };
        return await this.execution.execute(endpoint, parseData);
    }
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
    async getMultiChainMultiAddressTransactions(queryParamOpts) {
        const endpoint = endpointGenerator(`allchains/transactions`, [
            {
                key: "chains",
                value: queryParamOpts?.chains,
            },
            {
                key: "addresses",
                value: queryParamOpts?.addresses,
            },
            {
                key: "limit",
                value: queryParamOpts?.limit,
            },
            {
                key: "before",
                value: queryParamOpts?.before,
            },
            {
                key: "after",
                value: queryParamOpts?.after,
            },
            {
                key: "with-logs",
                value: queryParamOpts?.withLogs,
            },
            {
                key: "with-decoded-logs",
                value: queryParamOpts?.withDecodedLogs,
            },
            {
                key: "quote-currency",
                value: queryParamOpts?.quoteCurrency,
            },
        ]);
        const parseData = (data) => {
            if (data.data) {
                data.data.updated_at = data.data.updated_at
                    ? new Date(data.data.updated_at)
                    : null;
                data.data.items = data.data.items
                    ? data.data.items.map((txItem) => ({
                        ...txItem,
                        value: bigIntParser(txItem.value),
                        fees_paid: bigIntParser(txItem.fees_paid),
                        block_signed_at: txItem.block_signed_at
                            ? new Date(txItem.block_signed_at)
                            : null,
                        log_events: txItem.log_events
                            ? txItem.log_events.map((logItem) => ({
                                ...logItem,
                                block_signed_at: logItem.block_signed_at
                                    ? new Date(logItem.block_signed_at)
                                    : null,
                            }))
                            : null,
                    }))
                    : null;
            }
            return data;
        };
        return await this.execution.execute(endpoint, parseData);
    }
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
    async getMultiChainBalances(walletAddress, queryParamOpts) {
        const endpoint = endpointGenerator(`allchains/address/${walletAddress}/balances`, [
            {
                key: "chains",
                value: queryParamOpts?.chains,
            },
            {
                key: "quote-currency",
                value: queryParamOpts?.quoteCurrency,
            },
            {
                key: "limit",
                value: queryParamOpts?.limit,
            },
            {
                key: "cutoff-timestamp",
                value: queryParamOpts?.cutoffTimestamp,
            },
            {
                key: "before",
                value: queryParamOpts?.before,
            },
        ]);
        const parseData = (data) => {
            if (data.data) {
                data.data.updated_at = data.data.updated_at
                    ? new Date(data.data.updated_at)
                    : null;
                data.data.items = data.data.items
                    ? data.data.items.map((balanceItem) => ({
                        ...balanceItem,
                        balance: bigIntParser(balanceItem.balance),
                        balance_24h: bigIntParser(balanceItem.balance_24h),
                        last_transferred_at: balanceItem.last_transferred_at
                            ? new Date(balanceItem.last_transferred_at)
                            : null,
                    }))
                    : null;
            }
            return data;
        };
        return await this.execution.execute(endpoint, parseData);
    }
}

async function* paginateEndpoint(endpoint, execution, parseData, implementation) {
    let _endpoint = new URL(endpoint);
    let hasMore = true;
    let page_number = +(_endpoint.searchParams.get("page-number") ?? 0);
    while (hasMore) {
        try {
            if (implementation === "pagination") {
                _endpoint.searchParams.set("page-number", page_number.toString());
                const parsedData = await execution.execute(_endpoint, parseData);
                if (parsedData.error) {
                    throw parsedData;
                }
                if (!parsedData.data?.pagination?.has_more) {
                    hasMore = false;
                }
                else {
                    page_number++;
                }
                yield parsedData;
            }
            else if (implementation === "links") {
                const parsedData = await execution.execute(_endpoint, parseData);
                const prevLink = parsedData.data?.links?.prev || null;
                if (!prevLink) {
                    hasMore = false;
                }
                else {
                    _endpoint = new URL(`${prevLink}?${_endpoint.searchParams}`);
                }
                yield parsedData;
            }
        }
        catch (error) {
            hasMore = false;
            const err = error;
            yield {
                data: null,
                error: true,
                error_code: err?.cause?.code || err?.error_code || 500,
                error_message: err?.cause?.message ||
                    err?.error_message ||
                    "Internal server error",
            };
        }
    }
}

/**
 * Balances APIs
 *
 */
class BalanceService {
    execution;
    constructor(execution) {
        this.execution = execution;
    }
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
    async getTokenBalancesForWalletAddress(chainName, walletAddress, queryParamOpts) {
        const endpoint = endpointGenerator(`${chainName}/address/${walletAddress}/balances_v2`, [
            {
                key: "quote-currency",
                value: queryParamOpts?.quoteCurrency,
            },
            {
                key: "no-spam",
                value: queryParamOpts?.noSpam,
            },
        ]);
        const parseData = (data) => {
            if (data.data) {
                data.data.updated_at = data.data.updated_at
                    ? new Date(data.data.updated_at)
                    : null;
                data.data.items = data.data.items
                    ? data.data.items.map((balanceItem) => ({
                        ...balanceItem,
                        balance: bigIntParser(balanceItem.balance),
                        balance_24h: bigIntParser(balanceItem.balance_24h),
                        last_transferred_at: balanceItem.last_transferred_at
                            ? new Date(balanceItem.last_transferred_at)
                            : null,
                        nft_data: balanceItem.nft_data
                            ? balanceItem.nft_data.map((nftItem) => ({
                                ...nftItem,
                                token_id: bigIntParser(nftItem.token_id),
                                token_balance: bigIntParser(nftItem.token_balance),
                                token_price_wei: bigIntParser(nftItem.token_price_wei),
                            }))
                            : null,
                    }))
                    : null;
            }
            return data;
        };
        return await this.execution.execute(endpoint, parseData);
    }
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
    async getHistoricalPortfolioForWalletAddress(chainName, walletAddress, queryParamOpts) {
        const endpoint = endpointGenerator(`${chainName}/address/${walletAddress}/portfolio_v2`, [
            {
                key: "quote-currency",
                value: queryParamOpts?.quoteCurrency,
            },
            {
                key: "days",
                value: queryParamOpts?.days,
            },
        ]);
        const parseData = (data) => {
            if (data.data) {
                data.data.updated_at = data.data.updated_at
                    ? new Date(data.data.updated_at)
                    : null;
                data.data.items =
                    data.data.items?.map((portfolioItem) => ({
                        ...portfolioItem,
                        holdings: portfolioItem.holdings?.map((holdingItem) => ({
                            ...holdingItem,
                            timestamp: holdingItem.timestamp
                                ? new Date(holdingItem.timestamp)
                                : null,
                            close: {
                                ...holdingItem.close,
                                balance: bigIntParser(holdingItem.close?.balance),
                            },
                            high: {
                                ...holdingItem.high,
                                balance: bigIntParser(holdingItem.high?.balance),
                            },
                            low: {
                                ...holdingItem.low,
                                balance: bigIntParser(holdingItem.low?.balance),
                            },
                            open: {
                                ...holdingItem.open,
                                balance: bigIntParser(holdingItem.open?.balance),
                            },
                        })) || null,
                    })) || null;
            }
            return data;
        };
        return await this.execution.execute(endpoint, parseData);
    }
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
    async *getErc20TransfersForWalletAddress(chainName, walletAddress, queryParamOpts) {
        const endpoint = endpointGenerator(`${chainName}/address/${walletAddress}/transfers_v2`, [
            {
                key: "quote-currency",
                value: queryParamOpts?.quoteCurrency,
            },
            {
                key: "contract-address",
                value: queryParamOpts?.contractAddress,
            },
            {
                key: "starting-block",
                value: queryParamOpts?.startingBlock,
            },
            {
                key: "ending-block",
                value: queryParamOpts?.endingBlock,
            },
            {
                key: "page-size",
                value: queryParamOpts?.pageSize,
            },
            {
                key: "page-number",
                value: queryParamOpts?.pageNumber,
            },
        ]);
        const parseData = (data) => {
            if (data.data) {
                data.data.updated_at = data.data.updated_at
                    ? new Date(data.data.updated_at)
                    : null;
                data.data.items = data.data.items
                    ? data.data.items.map((ercItem) => ({
                        ...ercItem,
                        block_signed_at: ercItem.block_signed_at
                            ? new Date(ercItem.block_signed_at)
                            : null,
                        value: bigIntParser(ercItem.value),
                        fees_paid: bigIntParser(ercItem.fees_paid),
                        transfers: ercItem.transfers
                            ? ercItem.transfers.map((transferItem) => ({
                                ...transferItem,
                                balance: bigIntParser(transferItem.balance),
                                block_signed_at: transferItem.block_signed_at
                                    ? new Date(transferItem.block_signed_at)
                                    : null,
                                delta: bigIntParser(transferItem.delta),
                            }))
                            : null,
                    }))
                    : null;
            }
            return data;
        };
        for await (const data of paginateEndpoint(endpoint, this.execution, parseData, "pagination")) {
            yield data;
        }
    }
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
    async getErc20TransfersForWalletAddressByPage(chainName, walletAddress, queryParamOpts) {
        const endpoint = endpointGenerator(`${chainName}/address/${walletAddress}/transfers_v2`, [
            {
                key: "quote-currency",
                value: queryParamOpts?.quoteCurrency,
            },
            {
                key: "contract-address",
                value: queryParamOpts?.contractAddress,
            },
            {
                key: "starting-block",
                value: queryParamOpts?.startingBlock,
            },
            {
                key: "ending-block",
                value: queryParamOpts?.endingBlock,
            },
            {
                key: "page-size",
                value: queryParamOpts?.pageSize,
            },
            {
                key: "page-number",
                value: queryParamOpts?.pageNumber,
            },
        ]);
        const parseData = (data) => {
            if (data.data) {
                data.data.updated_at = data.data.updated_at
                    ? new Date(data.data.updated_at)
                    : null;
                data.data.items = data.data.items
                    ? data.data.items.map((blockTxItem) => ({
                        ...blockTxItem,
                        block_signed_at: blockTxItem.block_signed_at
                            ? new Date(blockTxItem.block_signed_at)
                            : null,
                        fees_paid: bigIntParser(blockTxItem.fees_paid),
                        transfers: blockTxItem.transfers?.map((transferItem) => ({
                            ...transferItem,
                            balance: bigIntParser(transferItem.balance),
                            block_signed_at: transferItem.block_signed_at
                                ? new Date(transferItem.block_signed_at)
                                : null,
                            delta: bigIntParser(transferItem.delta),
                        })) || null,
                        value: bigIntParser(blockTxItem.value),
                    }))
                    : null;
            }
            return data;
        };
        return await this.execution.execute(endpoint, parseData);
    }
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
    async *getTokenHoldersV2ForTokenAddress(chainName, tokenAddress, queryParamOpts) {
        const endpoint = endpointGenerator(`${chainName}/tokens/${tokenAddress}/token_holders_v2`, [
            {
                key: "no-snapshot",
                value: queryParamOpts?.noSnapshot,
            },
            {
                key: "block-height",
                value: queryParamOpts?.blockHeight,
            },
            {
                key: "page-size",
                value: queryParamOpts?.pageSize,
            },
            {
                key: "page-number",
                value: queryParamOpts?.pageNumber,
            },
            {
                key: "date",
                value: queryParamOpts?.date,
            },
        ]);
        const parseData = (data) => {
            if (data.data) {
                data.data.updated_at = data.data.updated_at
                    ? new Date(data.data.updated_at)
                    : null;
                data.data.items = data.data.items
                    ? data.data.items.map((tokenItem) => ({
                        ...tokenItem,
                        balance: bigIntParser(tokenItem.balance),
                        total_supply: bigIntParser(tokenItem.total_supply),
                    }))
                    : null;
            }
            return data;
        };
        for await (const data of paginateEndpoint(endpoint, this.execution, parseData, "pagination")) {
            yield data;
        }
    }
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
    async getTokenHoldersV2ForTokenAddressByPage(chainName, tokenAddress, queryParamOpts) {
        const endpoint = endpointGenerator(`${chainName}/tokens/${tokenAddress}/token_holders_v2`, [
            {
                key: "no-snapshot",
                value: queryParamOpts?.noSnapshot,
            },
            {
                key: "block-height",
                value: queryParamOpts?.blockHeight,
            },
            {
                key: "page-size",
                value: queryParamOpts?.pageSize,
            },
            {
                key: "page-number",
                value: queryParamOpts?.pageNumber,
            },
            {
                key: "date",
                value: queryParamOpts?.date,
            },
        ]);
        const parseData = (data) => {
            if (data.data) {
                data.data.updated_at = data.data.updated_at
                    ? new Date(data.data.updated_at)
                    : null;
                data.data.items = data.data.items
                    ? data.data.items.map((balanceItem) => ({
                        ...balanceItem,
                        balance: bigIntParser(balanceItem.balance),
                        total_supply: bigIntParser(balanceItem.total_supply),
                    }))
                    : null;
            }
            return data;
        };
        return await this.execution.execute(endpoint, parseData);
    }
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
    async getHistoricalTokenBalancesForWalletAddress(chainName, walletAddress, queryParamOpts) {
        const endpoint = endpointGenerator(`${chainName}/address/${walletAddress}/historical_balances`, [
            {
                key: "quote-currency",
                value: queryParamOpts?.quoteCurrency,
            },
            {
                key: "no-spam",
                value: queryParamOpts?.noSpam,
            },
            {
                key: "block-height",
                value: queryParamOpts?.blockHeight,
            },
            {
                key: "date",
                value: queryParamOpts?.date,
            },
        ]);
        const parseData = (data) => {
            if (data.data) {
                data.data.updated_at = data.data.updated_at
                    ? new Date(data.data.updated_at)
                    : null;
                data.data.items = data.data.items
                    ? data.data.items.map((balanceItem) => ({
                        ...balanceItem,
                        balance: bigIntParser(balanceItem.balance),
                        last_transferred_at: balanceItem.last_transferred_at
                            ? new Date(balanceItem.last_transferred_at)
                            : null,
                        nft_data: balanceItem.nft_data
                            ? balanceItem.nft_data.map((nftItem) => ({
                                ...nftItem,
                                token_id: bigIntParser(nftItem.token_id),
                                token_balance: bigIntParser(nftItem.token_balance),
                                token_price_wei: bigIntParser(nftItem.token_price_wei),
                            }))
                            : null,
                    }))
                    : null;
            }
            return data;
        };
        return await this.execution.execute(endpoint, parseData);
    }
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
    async getNativeTokenBalance(chainName, walletAddress, queryParamOpts) {
        const endpoint = endpointGenerator(`${chainName}/address/${walletAddress}/balances_native`, [
            {
                key: "quote-currency",
                value: queryParamOpts?.quoteCurrency,
            },
            {
                key: "block-height",
                value: queryParamOpts?.blockHeight,
            },
        ]);
        const parseData = (data) => {
            if (data.data) {
                data.data.updated_at = data.data.updated_at
                    ? new Date(data.data.updated_at)
                    : null;
                data.data.items = data.data.items
                    ? data.data.items.map((balanceItem) => ({
                        ...balanceItem,
                        balance: bigIntParser(balanceItem.balance),
                    }))
                    : null;
            }
            return data;
        };
        return await this.execution.execute(endpoint, parseData);
    }
}

/**
 * Base API
 *
 */
class BaseService {
    execution;
    constructor(execution) {
        this.execution = execution;
    }
    /**
     *
     * Commonly used to fetch and render a single block for a block explorer.
     *
     * **Credit Cost**: 1 per call
     *
     * @param {Chain} chainName - The chain name eg: `eth-mainnet` or 1.
     * @param {string} blockHeight - The block height or `latest` for the latest block available.
     *
     */
    async getBlock(chainName, blockHeight) {
        const endpoint = endpointGenerator(`${chainName}/block_v2/${blockHeight}`, []);
        const parseData = (data) => {
            if (data.data) {
                data.data.updated_at = data.data.updated_at
                    ? new Date(data.data.updated_at)
                    : null;
                data.data.items = data.data.items
                    ? data.data.items.map((blockItem) => ({
                        ...blockItem,
                        signed_at: blockItem.signed_at
                            ? new Date(blockItem.signed_at)
                            : null,
                    }))
                    : null;
            }
            return data;
        };
        return await this.execution.execute(endpoint, parseData);
    }
    /**
     *
     * Commonly used to resolve ENS, RNS and Unstoppable Domains addresses. Only supports the resolution of a registered domain to an address.
     *
     * **Credit Cost**: 1 per call
     *
     * @param {Chain} chainName - The chain name eg: `eth-mainnet` or 1.
     * @param {string} walletAddress - The requested address. Passing in an `ENS`, `RNS`, `Lens Handle`, or an `Unstoppable Domain` resolves automatically.
     *
     */
    async getResolvedAddress(chainName, walletAddress) {
        const endpoint = endpointGenerator(`${chainName}/address/${walletAddress}/resolve_address`, []);
        const parseData = (data) => {
            return data;
        };
        return await this.execution.execute(endpoint, parseData);
    }
    /**
     *
     * Commonly used to get all the block heights within a particular date range. Useful for rendering a display where you sort blocks by day.
     *
     * **Credit Cost**: 1 per call
     *
     * @param {Chain} chainName - The chain name eg: `eth-mainnet` or 1.
     * @param {string} startDate - The start date in YYYY-MM-DD format.
     * @param {string | "latest"} endDate - The end date in YYYY-MM-DD format. Also accepts "latest" for the latest block height
     * @param {GetBlockHeightsQueryParamOpts} queryParamOpts
     *   - `pageSize`: Number of items per page. Omitting this parameter defaults to 100.
     *   - `pageNumber`: 0-indexed page number to begin pagination.
     *
     */
    async *getBlockHeights(chainName, startDate, endDate, queryParamOpts) {
        const endpoint = endpointGenerator(`${chainName}/block_v2/${startDate}/${endDate}`, [
            {
                key: "page-size",
                value: queryParamOpts?.pageSize,
            },
            {
                key: "page-number",
                value: queryParamOpts?.pageNumber,
            },
        ]);
        const parseData = (data) => {
            if (data.data) {
                data.data.updated_at = data.data.updated_at
                    ? new Date(data.data.updated_at)
                    : null;
                data.data.items = data.data.items
                    ? data.data.items.map((blockItem) => ({
                        ...blockItem,
                        signed_at: blockItem.signed_at
                            ? new Date(blockItem.signed_at)
                            : null,
                    }))
                    : null;
            }
            return data;
        };
        for await (const data of paginateEndpoint(endpoint, this.execution, parseData, "pagination")) {
            yield data;
        }
    }
    /**
     *
     * Commonly used to get all the block heights within a particular date range. Useful for rendering a display where you sort blocks by day.
     *
     * **Credit Cost**: 1 per call
     *
     * @param {Chain} chainName - The chain name eg: `eth-mainnet` or 1.
     * @param {string} startDate - The start date in YYYY-MM-DD format.
     * @param {string | "latest"} endDate - The end date in YYYY-MM-DD format. Also accepts "latest" for the latest block height
     * @param {GetBlockHeightsQueryParamOpts} queryParamOpts
     *   - `pageSize`: Number of items per page. Omitting this parameter defaults to 100.
     *   - `pageNumber`: 0-indexed page number to begin pagination.
     *
     */
    async getBlockHeightsByPage(chainName, startDate, endDate, queryParamOpts) {
        const endpoint = endpointGenerator(`${chainName}/block_v2/${startDate}/${endDate}`, [
            {
                key: "page-size",
                value: queryParamOpts?.pageSize,
            },
            {
                key: "page-number",
                value: queryParamOpts?.pageNumber,
            },
        ]);
        const parseData = (data) => {
            if (data.data) {
                data.data.updated_at = data.data.updated_at
                    ? new Date(data.data.updated_at)
                    : null;
                data.data.items = data.data.items
                    ? data.data.items.map((blockItem) => ({
                        ...blockItem,
                        signed_at: blockItem.signed_at
                            ? new Date(blockItem.signed_at)
                            : null,
                    }))
                    : null;
            }
            return data;
        };
        return await this.execution.execute(endpoint, parseData);
    }
    /**
     *
     * Commonly used to get all the event logs of the latest block, or for a range of blocks. Includes sender contract metadata as well as decoded logs.
     *
     * **Credit Cost**: 0.01 per item
     *
     * @param {Chain} chainName - The chain name eg: `eth-mainnet` or 1.
     * @param {GetLogsQueryParamOpts} queryParamOpts
     *   - `startingBlock`: The first block to retrieve log events with. Accepts decimals, hexadecimals, or the strings `earliest` and `latest`.
     *   - `endingBlock`: The last block to retrieve log events with. Accepts decimals, hexadecimals, or the strings `earliest` and `latest`.
     *   - `address`: The address of the log events sender contract.
     *   - `topics`: The topic hash(es) to retrieve logs with.
     *   - `blockHash`: The block hash to retrieve logs for.
     *   - `skipDecode`: Omit decoded log events.
     *
     */
    async getLogs(chainName, queryParamOpts) {
        const endpoint = endpointGenerator(`${chainName}/events`, [
            {
                key: "starting-block",
                value: queryParamOpts?.startingBlock,
            },
            {
                key: "ending-block",
                value: queryParamOpts?.endingBlock,
            },
            {
                key: "address",
                value: queryParamOpts?.address,
            },
            {
                key: "topics",
                value: queryParamOpts?.topics,
            },
            {
                key: "block-hash",
                value: queryParamOpts?.blockHash,
            },
            {
                key: "skip-decode",
                value: queryParamOpts?.skipDecode,
            },
        ]);
        const parseData = (data) => {
            if (data.data) {
                data.data.updated_at = data.data.updated_at
                    ? new Date(data.data.updated_at)
                    : null;
                data.data.items = data.data.items
                    ? data.data.items.map((logItem) => ({
                        ...logItem,
                        block_signed_at: logItem.block_signed_at
                            ? new Date(logItem.block_signed_at)
                            : null,
                    }))
                    : null;
            }
            return data;
        };
        return await this.execution.execute(endpoint, parseData);
    }
    /**
     *
     * Commonly used to get all the event logs emitted from a particular contract address. Useful for building dashboards that examine on-chain interactions.
     *
     * **Credit Cost**: 0.01 per item
     *
     * @param {Chain} chainName - The chain name eg: `eth-mainnet` or 1.
     * @param {string} contractAddress - The requested contract address. Passing in an `ENS`, `RNS`, `Lens Handle`, or an `Unstoppable Domain` resolves automatically.
     * @param {GetLogEventsByAddressQueryParamOpts} queryParamOpts
     *   - `startingBlock`: The first block to retrieve log events with. Accepts decimals, hexadecimals, or the strings `earliest` and `latest`.
     *   - `endingBlock`: The last block to retrieve log events with. Accepts decimals, hexadecimals, or the strings `earliest` and `latest`.
     *   - `pageSize`: Number of items per page. Omitting this parameter defaults to 100.
     *   - `pageNumber`: 0-indexed page number to begin pagination.
     *
     */
    async *getLogEventsByAddress(chainName, contractAddress, queryParamOpts) {
        const endpoint = endpointGenerator(`${chainName}/events/address/${contractAddress}`, [
            {
                key: "starting-block",
                value: queryParamOpts?.startingBlock,
            },
            {
                key: "ending-block",
                value: queryParamOpts?.endingBlock,
            },
            {
                key: "page-size",
                value: queryParamOpts?.pageSize,
            },
            {
                key: "page-number",
                value: queryParamOpts?.pageNumber,
            },
        ]);
        const parseData = (data) => {
            if (data.data) {
                data.data.updated_at = data.data.updated_at
                    ? new Date(data.data.updated_at)
                    : null;
                data.data.items = data.data.items
                    ? data.data.items.map((logItem) => ({
                        ...logItem,
                        block_signed_at: logItem.block_signed_at
                            ? new Date(logItem.block_signed_at)
                            : null,
                    }))
                    : null;
            }
            return data;
        };
        for await (const data of paginateEndpoint(endpoint, this.execution, parseData, "pagination")) {
            yield data;
        }
    }
    /**
     *
     * Commonly used to get all the event logs emitted from a particular contract address. Useful for building dashboards that examine on-chain interactions.
     *
     * **Credit Cost**: 0.01 per item
     *
     * @param {Chain} chainName - The chain name eg: `eth-mainnet` or 1.
     * @param {string} contractAddress - The requested contract address. Passing in an `ENS`, `RNS`, `Lens Handle`, or an `Unstoppable Domain` resolves automatically.
     * @param {GetLogEventsByAddressQueryParamOpts} queryParamOpts
     *   - `startingBlock`: The first block to retrieve log events with. Accepts decimals, hexadecimals, or the strings `earliest` and `latest`.
     *   - `endingBlock`: The last block to retrieve log events with. Accepts decimals, hexadecimals, or the strings `earliest` and `latest`.
     *   - `pageSize`: Number of items per page. Omitting this parameter defaults to 100.
     *   - `pageNumber`: 0-indexed page number to begin pagination.
     *
     */
    async getLogEventsByAddressByPage(chainName, contractAddress, queryParamOpts) {
        const endpoint = endpointGenerator(`${chainName}/events/address/${contractAddress}`, [
            {
                key: "starting-block",
                value: queryParamOpts?.startingBlock,
            },
            {
                key: "ending-block",
                value: queryParamOpts?.endingBlock,
            },
            {
                key: "page-size",
                value: queryParamOpts?.pageSize,
            },
            {
                key: "page-number",
                value: queryParamOpts?.pageNumber,
            },
        ]);
        const parseData = (data) => {
            if (data.data) {
                data.data.updated_at = data.data.updated_at
                    ? new Date(data.data.updated_at)
                    : null;
                data.data.items = data.data.items
                    ? data.data.items.map((logItem) => ({
                        ...logItem,
                        block_signed_at: logItem.block_signed_at
                            ? new Date(logItem.block_signed_at)
                            : null,
                    }))
                    : null;
            }
            return data;
        };
        return await this.execution.execute(endpoint, parseData);
    }
    /**
     *
     * Commonly used to get all event logs of the same topic hash across all contracts within a particular chain. Useful for cross-sectional analysis of event logs that are emitted on-chain.
     *
     * **Credit Cost**: 0.01 per item
     *
     * @param {Chain} chainName - The chain name eg: `eth-mainnet` or 1.
     * @param {string} topicHash - The endpoint will return event logs that contain this topic hash.
     * @param {GetLogEventsByTopicHashQueryParamOpts} queryParamOpts
     *   - `startingBlock`: The first block to retrieve log events with. Accepts decimals, hexadecimals, or the strings `earliest` and `latest`.
     *   - `endingBlock`: The last block to retrieve log events with. Accepts decimals, hexadecimals, or the strings `earliest` and `latest`.
     *   - `secondaryTopics`: Additional topic hash(es) to filter on - padded & unpadded address fields are supported. Separate multiple topics with a comma.
     *   - `pageSize`: Number of items per page. Omitting this parameter defaults to 100.
     *   - `pageNumber`: 0-indexed page number to begin pagination.
     *
     */
    async *getLogEventsByTopicHash(chainName, topicHash, queryParamOpts) {
        const endpoint = endpointGenerator(`${chainName}/events/topics/${topicHash}`, [
            {
                key: "starting-block",
                value: queryParamOpts?.startingBlock,
            },
            {
                key: "ending-block",
                value: queryParamOpts?.endingBlock,
            },
            {
                key: "secondary-topics",
                value: queryParamOpts?.secondaryTopics,
            },
            {
                key: "page-size",
                value: queryParamOpts?.pageSize,
            },
            {
                key: "page-number",
                value: queryParamOpts?.pageNumber,
            },
        ]);
        const parseData = (data) => {
            if (data.data) {
                data.data.updated_at = data.data.updated_at
                    ? new Date(data.data.updated_at)
                    : null;
                data.data.items = data.data.items
                    ? data.data.items.map((logItem) => ({
                        ...logItem,
                        block_signed_at: logItem.block_signed_at
                            ? new Date(logItem.block_signed_at)
                            : null,
                    }))
                    : null;
            }
            return data;
        };
        for await (const data of paginateEndpoint(endpoint, this.execution, parseData, "pagination")) {
            yield data;
        }
    }
    /**
     *
     * Commonly used to get all event logs of the same topic hash across all contracts within a particular chain. Useful for cross-sectional analysis of event logs that are emitted on-chain.
     *
     * **Credit Cost**: 0.01 per item
     *
     * @param {Chain} chainName - The chain name eg: `eth-mainnet` or 1.
     * @param {string} topicHash - The endpoint will return event logs that contain this topic hash.
     * @param {GetLogEventsByTopicHashQueryParamOpts} queryParamOpts
     *   - `startingBlock`: The first block to retrieve log events with. Accepts decimals, hexadecimals, or the strings `earliest` and `latest`.
     *   - `endingBlock`: The last block to retrieve log events with. Accepts decimals, hexadecimals, or the strings `earliest` and `latest`.
     *   - `secondaryTopics`: Additional topic hash(es) to filter on - padded & unpadded address fields are supported. Separate multiple topics with a comma.
     *   - `pageSize`: Number of items per page. Omitting this parameter defaults to 100.
     *   - `pageNumber`: 0-indexed page number to begin pagination.
     *
     */
    async getLogEventsByTopicHashByPage(chainName, topicHash, queryParamOpts) {
        const endpoint = endpointGenerator(`${chainName}/events/topics/${topicHash}`, [
            {
                key: "starting-block",
                value: queryParamOpts?.startingBlock,
            },
            {
                key: "ending-block",
                value: queryParamOpts?.endingBlock,
            },
            {
                key: "secondary-topics",
                value: queryParamOpts?.secondaryTopics,
            },
            {
                key: "page-size",
                value: queryParamOpts?.pageSize,
            },
            {
                key: "page-number",
                value: queryParamOpts?.pageNumber,
            },
        ]);
        const parseData = (data) => {
            if (data.data) {
                data.data.updated_at = data.data.updated_at
                    ? new Date(data.data.updated_at)
                    : null;
                data.data.items = data.data.items
                    ? data.data.items.map((logItem) => ({
                        ...logItem,
                        block_signed_at: logItem.block_signed_at
                            ? new Date(logItem.block_signed_at)
                            : null,
                    }))
                    : null;
            }
            return data;
        };
        return await this.execution.execute(endpoint, parseData);
    }
    /**
     *
     * Commonly used to build internal dashboards for all supported chains on Covalent.
     *
     * **Credit Cost**: 0.01 per call
     *
     */
    async getAllChains() {
        const endpoint = endpointGenerator(`chains`);
        const parseData = (data) => {
            if (data.data) {
                data.data.updated_at = data.data.updated_at
                    ? new Date(data.data.updated_at)
                    : null;
                data.data.items = data.data.items
                    ? data.data.items.map((chainItem) => ({
                        ...chainItem,
                        chain_id: chainItem.chain_id
                            ? +chainItem.chain_id
                            : null,
                    }))
                    : null;
            }
            return data;
        };
        return await this.execution.execute(endpoint, parseData);
    }
    /**
     *
     * Commonly used to build internal status dashboards of all supported chains.
     *
     * **Credit Cost**: 1 per call
     *
     */
    async getAllChainStatus() {
        const endpoint = endpointGenerator(`chains/status`);
        const parseData = (data) => {
            if (data.data) {
                data.data.updated_at = data.data.updated_at
                    ? new Date(data.data.updated_at)
                    : null;
                data.data.items = data.data.items
                    ? data.data.items.map((chainItem) => ({
                        ...chainItem,
                        chain_id: chainItem.chain_id
                            ? +chainItem.chain_id
                            : null,
                    }))
                    : null;
            }
            return data;
        };
        return await this.execution.execute(endpoint, parseData);
    }
    /**
     *
     * Get real-time gas estimates for different transaction speeds on a specific network, enabling users to optimize transaction costs and confirmation times.
     *
     * **Credit Cost**: 1 per call
     *
     * @param {Chain} chainName - The chain name eg: `eth-mainnet` or 1.
     * @param {string} eventType - The desired event type to retrieve gas prices for. Supports `erc20` transfer events, `uniswapv3` swap events and `nativetokens` transfers.
     * @param {GetGasPricesQueryParamOpts} queryParamOpts
     *   - `quoteCurrency`: The currency to convert. Supports `USD`, `CAD`, `EUR`, `SGD`, `INR`, `JPY`, `VND`, `CNY`, `KRW`, `RUB`, `TRY`, `NGN`, `ARS`, `AUD`, `CHF`, and `GBP`.
     *
     */
    async getGasPrices(chainName, eventType, queryParamOpts) {
        const endpoint = endpointGenerator(`${chainName}/event/${eventType}/gas_prices`, [
            {
                key: "quote-currency",
                value: queryParamOpts?.quoteCurrency,
            },
        ]);
        const parseData = (data) => {
            if (data.data) {
                data.data.updated_at = data.data.updated_at
                    ? new Date(data.data.updated_at)
                    : null;
                data.data.base_fee = bigIntParser(data.data.base_fee);
            }
            return data;
        };
        return await this.execution.execute(endpoint, parseData);
    }
}

exports.ChainName = void 0;
(function (ChainName) {
    ChainName["ETH_MAINNET"] = "eth-mainnet";
    ChainName["ETH_SEPOLIA"] = "eth-sepolia";
    ChainName["ETH_HOLESKY"] = "eth-holesky";
    ChainName["MATIC_MAINNET"] = "matic-mainnet";
    ChainName["AVALANCHE_MAINNET"] = "avalanche-mainnet";
    ChainName["AVALANCHE_TESTNET"] = "avalanche-testnet";
    ChainName["BSC_MAINNET"] = "bsc-mainnet";
    ChainName["BSC_TESTNET"] = "bsc-testnet";
    ChainName["MOONBEAM_MAINNET"] = "moonbeam-mainnet";
    ChainName["MOONBEAM_MOONRIVER"] = "moonbeam-moonriver";
    ChainName["ARBITRUM_MAINNET"] = "arbitrum-mainnet";
    ChainName["ARBITRUM_NOVA_MAINNET"] = "arbitrum-nova-mainnet";
    ChainName["ARBITRUM_SEPOLIA"] = "arbitrum-sepolia";
    ChainName["FANTOM_MAINNET"] = "fantom-mainnet";
    ChainName["FANTOM_TESTNET"] = "fantom-testnet";
    ChainName["BTC_MAINNET"] = "btc-mainnet";
    ChainName["SOLANA_MAINNET"] = "solana-mainnet";
    ChainName["AXIE_MAINNET"] = "axie-mainnet";
    ChainName["OPTIMISM_MAINNET"] = "optimism-mainnet";
    ChainName["OPTIMISM_SEPOLIA"] = "optimism-sepolia";
    ChainName["CRONOS_ZKEVM_MAINNET"] = "cronos-zkevm-mainnet";
    ChainName["EMERALD_PARATIME_MAINNET"] = "emerald-paratime-mainnet";
    ChainName["MONAD_TESTNET"] = "monad-testnet";
    ChainName["MONAD_MAINNET"] = "monad-mainnet";
    ChainName["MEGAETH_MAINNET"] = "megaeth-mainnet";
    ChainName["BERACHAIN_MAINNET"] = "berachain-mainnet";
    ChainName["BERACHAIN_TESTNET"] = "berachain-testnet";
    ChainName["HYPERCORE_MAINNET"] = "hypercore-mainnet";
    ChainName["PLASMA_MAINNET"] = "plasma-mainnet";
    ChainName["UNICHAIN_MAINNET"] = "unichain-mainnet";
    ChainName["PLASMA_TESTNET"] = "plasma-testnet";
    ChainName["ARC_TESTNET"] = "arc-testnet";
    ChainName["ADI_TESTNET"] = "adi-testnet";
    ChainName["CANTO_MAINNET"] = "canto-mainnet";
    ChainName["LINEA_MAINNET"] = "linea-mainnet";
    ChainName["LINEA_SEPOLIA_TESTNET"] = "linea-sepolia-testnet";
    ChainName["POLYGON_AMOY_TESTNET"] = "polygon-amoy-testnet";
    ChainName["MANTLE_MAINNET"] = "mantle-mainnet";
    ChainName["BASE_MAINNET"] = "base-mainnet";
    ChainName["BASE_SEPOLIA_TESTNET"] = "base-sepolia-testnet";
    ChainName["OASIS_SAPPHIRE_MAINNET"] = "oasis-sapphire-mainnet";
    ChainName["CELO_MAINNET"] = "celo-mainnet";
    ChainName["HYPEREVM_MAINNET"] = "hyperevm-mainnet";
    ChainName["ADI_MAINNET"] = "adi-mainnet";
    ChainName["REDSTONE_MAINNET"] = "redstone-mainnet";
    ChainName["SEI_MAINNET"] = "sei-mainnet";
    ChainName["APECHAIN_MAINNET"] = "apechain-mainnet";
    ChainName["UNICHAIN_SEPOLIA_TESTNET"] = "unichain-sepolia-testnet";
    ChainName["SONIC_MAINNET"] = "sonic-mainnet";
    ChainName["WORLD_MAINNET"] = "world-mainnet";
    ChainName["WORLD_SEPOLIA_TESTNET"] = "world-sepolia-testnet";
    ChainName["MANTA_SEPOLIA_TESTNET"] = "manta-sepolia-testnet";
    ChainName["INK_SEPOLIA_TESTNET"] = "ink-sepolia-testnet";
    ChainName["INK_MAINNET"] = "ink-mainnet";
    ChainName["ZKSYNC_MAINNET"] = "zksync-mainnet";
    ChainName["BNB_OPBNB_MAINNET"] = "bnb-opbnb-mainnet";
    ChainName["ZETACHAIN_MAINNET"] = "zetachain-mainnet";
    ChainName["GNOSIS_MAINNET"] = "gnosis-mainnet";
    ChainName["GNOSIS_TESTNET"] = "gnosis-testnet";
    ChainName["VICTION_MAINNET"] = "viction-mainnet";
    ChainName["TAIKO_MAINNET"] = "taiko-mainnet";
    ChainName["BLAST_MAINNET"] = "blast-mainnet";
    ChainName["SCROLL_MAINNET"] = "scroll-mainnet";
})(exports.ChainName || (exports.ChainName = {}));
exports.ChainID = void 0;
(function (ChainID) {
    ChainID[ChainID["ETH_MAINNET"] = 1] = "ETH_MAINNET";
    ChainID[ChainID["ETH_SEPOLIA"] = 11155111] = "ETH_SEPOLIA";
    ChainID[ChainID["ETH_HOLESKY"] = 17000] = "ETH_HOLESKY";
    ChainID[ChainID["MATIC_MAINNET"] = 137] = "MATIC_MAINNET";
    ChainID[ChainID["AVALANCHE_MAINNET"] = 43114] = "AVALANCHE_MAINNET";
    ChainID[ChainID["AVALANCHE_TESTNET"] = 43113] = "AVALANCHE_TESTNET";
    ChainID[ChainID["BSC_MAINNET"] = 56] = "BSC_MAINNET";
    ChainID[ChainID["BSC_TESTNET"] = 97] = "BSC_TESTNET";
    ChainID[ChainID["MOONBEAM_MAINNET"] = 1284] = "MOONBEAM_MAINNET";
    ChainID[ChainID["MOONBEAM_MOONRIVER"] = 1285] = "MOONBEAM_MOONRIVER";
    ChainID[ChainID["ARBITRUM_MAINNET"] = 42161] = "ARBITRUM_MAINNET";
    ChainID[ChainID["ARBITRUM_NOVA_MAINNET"] = 42170] = "ARBITRUM_NOVA_MAINNET";
    ChainID[ChainID["ARBITRUM_SEPOLIA"] = 421614] = "ARBITRUM_SEPOLIA";
    ChainID[ChainID["FANTOM_MAINNET"] = 250] = "FANTOM_MAINNET";
    ChainID[ChainID["FANTOM_TESTNET"] = 4002] = "FANTOM_TESTNET";
    ChainID[ChainID["BTC_MAINNET"] = 20090103] = "BTC_MAINNET";
    ChainID[ChainID["SOLANA_MAINNET"] = 1399811149] = "SOLANA_MAINNET";
    ChainID[ChainID["AXIE_MAINNET"] = 2020] = "AXIE_MAINNET";
    ChainID[ChainID["OPTIMISM_MAINNET"] = 10] = "OPTIMISM_MAINNET";
    ChainID[ChainID["OPTIMISM_SEPOLIA"] = 11155420] = "OPTIMISM_SEPOLIA";
    ChainID[ChainID["CRONOS_ZKEVM_MAINNET"] = 388] = "CRONOS_ZKEVM_MAINNET";
    ChainID[ChainID["EMERALD_PARATIME_MAINNET"] = 42262] = "EMERALD_PARATIME_MAINNET";
    ChainID[ChainID["MONAD_TESTNET"] = 10143] = "MONAD_TESTNET";
    ChainID[ChainID["MONAD_MAINNET"] = 143] = "MONAD_MAINNET";
    ChainID[ChainID["MEGAETH_MAINNET"] = 4326] = "MEGAETH_MAINNET";
    ChainID[ChainID["BERACHAIN_MAINNET"] = 80094] = "BERACHAIN_MAINNET";
    ChainID[ChainID["BERACHAIN_TESTNET"] = 80084] = "BERACHAIN_TESTNET";
    ChainID[ChainID["PLASMA_MAINNET"] = 9745] = "PLASMA_MAINNET";
    ChainID[ChainID["UNICHAIN_MAINNET"] = 130] = "UNICHAIN_MAINNET";
    ChainID[ChainID["PLASMA_TESTNET"] = 9746] = "PLASMA_TESTNET";
    ChainID[ChainID["ARC_TESTNET"] = 5042002] = "ARC_TESTNET";
    ChainID[ChainID["ADI_TESTNET"] = 99999] = "ADI_TESTNET";
    ChainID[ChainID["CANTO_MAINNET"] = 7700] = "CANTO_MAINNET";
    ChainID[ChainID["LINEA_MAINNET"] = 59144] = "LINEA_MAINNET";
    ChainID[ChainID["LINEA_SEPOLIA_TESTNET"] = 59141] = "LINEA_SEPOLIA_TESTNET";
    ChainID[ChainID["POLYGON_AMOY_TESTNET"] = 80002] = "POLYGON_AMOY_TESTNET";
    ChainID[ChainID["MANTLE_MAINNET"] = 5000] = "MANTLE_MAINNET";
    ChainID[ChainID["BASE_MAINNET"] = 8453] = "BASE_MAINNET";
    ChainID[ChainID["BASE_SEPOLIA_TESTNET"] = 84532] = "BASE_SEPOLIA_TESTNET";
    ChainID[ChainID["OASIS_SAPPHIRE_MAINNET"] = 23294] = "OASIS_SAPPHIRE_MAINNET";
    ChainID[ChainID["CELO_MAINNET"] = 42220] = "CELO_MAINNET";
    ChainID[ChainID["HYPEREVM_MAINNET"] = 999] = "HYPEREVM_MAINNET";
    ChainID[ChainID["ADI_MAINNET"] = 36900] = "ADI_MAINNET";
    ChainID[ChainID["REDSTONE_MAINNET"] = 690] = "REDSTONE_MAINNET";
    ChainID[ChainID["SEI_MAINNET"] = 1329] = "SEI_MAINNET";
    ChainID[ChainID["APECHAIN_MAINNET"] = 33139] = "APECHAIN_MAINNET";
    ChainID[ChainID["UNICHAIN_SEPOLIA_TESTNET"] = 1301] = "UNICHAIN_SEPOLIA_TESTNET";
    ChainID[ChainID["SONIC_MAINNET"] = 146] = "SONIC_MAINNET";
    ChainID[ChainID["WORLD_MAINNET"] = 480] = "WORLD_MAINNET";
    ChainID[ChainID["WORLD_SEPOLIA_TESTNET"] = 4801] = "WORLD_SEPOLIA_TESTNET";
    ChainID[ChainID["MANTA_SEPOLIA_TESTNET"] = 3441006] = "MANTA_SEPOLIA_TESTNET";
    ChainID[ChainID["INK_SEPOLIA_TESTNET"] = 763373] = "INK_SEPOLIA_TESTNET";
    ChainID[ChainID["INK_MAINNET"] = 57073] = "INK_MAINNET";
    ChainID[ChainID["ZKSYNC_MAINNET"] = 324] = "ZKSYNC_MAINNET";
    ChainID[ChainID["BNB_OPBNB_MAINNET"] = 204] = "BNB_OPBNB_MAINNET";
    ChainID[ChainID["ZETACHAIN_MAINNET"] = 7000] = "ZETACHAIN_MAINNET";
    ChainID[ChainID["GNOSIS_MAINNET"] = 100] = "GNOSIS_MAINNET";
    ChainID[ChainID["GNOSIS_TESTNET"] = 10200] = "GNOSIS_TESTNET";
    ChainID[ChainID["VICTION_MAINNET"] = 88] = "VICTION_MAINNET";
    ChainID[ChainID["TAIKO_MAINNET"] = 167000] = "TAIKO_MAINNET";
    ChainID[ChainID["BLAST_MAINNET"] = 81457] = "BLAST_MAINNET";
    ChainID[ChainID["SCROLL_MAINNET"] = 534352] = "SCROLL_MAINNET";
})(exports.ChainID || (exports.ChainID = {}));

/**
 * Bitcoin APIs
 *
 */
class BitcoinService {
    execution;
    constructor(execution) {
        this.execution = execution;
    }
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
    async getBitcoinHdWalletBalances(walletAddress, queryParamOpts) {
        const endpoint = endpointGenerator(`${exports.ChainName.BTC_MAINNET}/address/${walletAddress}/hd_wallets`, [
            {
                key: "quote-currency",
                value: queryParamOpts?.quoteCurrency,
            },
        ]);
        const parseData = (data) => {
            if (data.data) {
                data.data.updated_at = data.data.updated_at
                    ? new Date(data.data.updated_at)
                    : null;
                data.data.items = data.data.items
                    ? data.data.items.map((balanceItem) => ({
                        ...balanceItem,
                        balance: bigIntParser(balanceItem.balance),
                    }))
                    : null;
            }
            return data;
        };
        return await this.execution.execute(endpoint, parseData);
    }
    /**
     *
     * Used to fetch the full transaction history of a Bitcoin wallet.
     *
     * @param {GetTransactionsForBitcoinAddressParamOpts} queryParamOpts
     *   - `address`: The bitcoin address to query.
     *   - `pageSize`: Number of items per page. Omitting this parameter defaults to 100.
     *   - `pageNumber`: 0-indexed page number to begin pagination.
     */
    async getTransactionsForBtcAddress(queryParamOpts) {
        const endpoint = endpointGenerator(`cq/covalent/app/bitcoin/transactions/`, [
            {
                key: "address",
                value: queryParamOpts?.address,
            },
            {
                key: "page-size",
                value: queryParamOpts?.pageSize,
            },
            {
                key: "page-number",
                value: queryParamOpts?.pageNumber,
            },
        ]);
        const parseData = (data) => {
            if (data.data) {
                data.data.updated_at = data.data.updated_at
                    ? new Date(data.data.updated_at)
                    : null;
                data.data.items = data.data.items
                    ? data.data.items.map((txItem) => ({
                        ...txItem,
                        value: bigIntParser(txItem.value),
                        fees_paid: bigIntParser(txItem.fees_paid),
                        block_signed_at: txItem.block_signed_at
                            ? new Date(txItem.block_signed_at)
                            : null,
                    }))
                    : null;
            }
            return data;
        };
        return await this.execution.execute(endpoint, parseData);
    }
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
    async getBitcoinNonHdWalletBalances(walletAddress, queryParamOpts) {
        const endpoint = endpointGenerator(`${exports.ChainName.BTC_MAINNET}/address/${walletAddress}/balances_v2`, [
            {
                key: "quote-currency",
                value: queryParamOpts?.quoteCurrency,
            },
        ]);
        const parseData = (data) => {
            if (data.data) {
                data.data.updated_at = data.data.updated_at
                    ? new Date(data.data.updated_at)
                    : null;
                data.data.items = data.data.items
                    ? data.data.items.map((balanceItem) => ({
                        ...balanceItem,
                        balance: bigIntParser(balanceItem.balance),
                        balance_24h: bigIntParser(balanceItem.balance_24h),
                        last_transferred_at: balanceItem.last_transferred_at
                            ? new Date(balanceItem.last_transferred_at)
                            : null,
                        nft_data: balanceItem.nft_data
                            ? balanceItem.nft_data.map((nftItem) => ({
                                ...nftItem,
                                token_id: bigIntParser(nftItem.token_id),
                                token_balance: bigIntParser(nftItem.token_balance),
                                token_price_wei: bigIntParser(nftItem.token_price_wei),
                            }))
                            : null,
                    }))
                    : null;
            }
            return data;
        };
        return await this.execution.execute(endpoint, parseData);
    }
}

/**
 * NFTs API
 *
 */
class NftService {
    execution;
    constructor(execution) {
        this.execution = execution;
    }
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
    async getNftsForAddress(chainName, walletAddress, queryParamOpts) {
        const endpoint = endpointGenerator(`${chainName}/address/${walletAddress}/balances_nft`, [
            {
                key: "no-spam",
                value: queryParamOpts?.noSpam,
            },
            {
                key: "no-nft-asset-metadata",
                value: queryParamOpts?.noNftAssetMetadata,
            },
        ]);
        const parseData = (data) => {
            if (data.data) {
                data.data.updated_at = data.data.updated_at
                    ? new Date(data.data.updated_at)
                    : null;
                data.data.items = data.data.items
                    ? data.data.items.map((balanceItem) => ({
                        ...balanceItem,
                        balance: bigIntParser(balanceItem.balance),
                        balance_24h: bigIntParser(balanceItem.balance_24h),
                        nft_data: balanceItem.nft_data
                            ? balanceItem.nft_data.map((nftItem) => ({
                                ...nftItem,
                                token_id: bigIntParser(nftItem.token_id),
                            }))
                            : null,
                    }))
                    : null;
            }
            return data;
        };
        return await this.execution.execute(endpoint, parseData);
    }
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
    async checkOwnershipInNft(chainName, walletAddress, collectionContract, queryParamOpts) {
        const endpoint = endpointGenerator(`${chainName}/address/${walletAddress}/collection/${collectionContract}`, [
            {
                key: "traits-filter",
                value: queryParamOpts?.traitsFilter,
            },
            {
                key: "values-filter",
                value: queryParamOpts?.valuesFilter,
            },
        ]);
        const parseData = (data) => {
            if (data.data) {
                data.data.updated_at = data.data.updated_at
                    ? new Date(data.data.updated_at)
                    : null;
                data.data.items = data.data.items
                    ? data.data.items.map((nftItem) => ({
                        ...nftItem,
                        balance: bigIntParser(nftItem.balance),
                        balance_24h: bigIntParser(nftItem.balance_24h),
                        token_id: bigIntParser(nftItem.token_id),
                        nft_data: {
                            ...nftItem.nft_data,
                            token_id: bigIntParser(nftItem.nft_data?.token_id),
                        },
                    }))
                    : null;
            }
            return data;
        };
        return await this.execution.execute(endpoint, parseData);
    }
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
    async checkOwnershipInNftForSpecificTokenId(chainName, walletAddress, collectionContract, tokenId) {
        const endpoint = endpointGenerator(`${chainName}/address/${walletAddress}/collection/${collectionContract}/token/${tokenId}`, []);
        const parseData = (data) => {
            if (data.data) {
                data.data.updated_at = data.data.updated_at
                    ? new Date(data.data.updated_at)
                    : null;
                data.data.items = data.data.items
                    ? data.data.items.map((balanceItem) => ({
                        ...balanceItem,
                        balance: bigIntParser(balanceItem.balance),
                        balance_24h: bigIntParser(balanceItem.balance_24h),
                        token_id: bigIntParser(balanceItem.token_id),
                        last_transfered_at: balanceItem.last_transfered_at
                            ? new Date(balanceItem.last_transfered_at)
                            : null,
                    }))
                    : null;
            }
            return data;
        };
        return await this.execution.execute(endpoint, parseData);
    }
}

/**
 * Pricing API
 *
 */
class PricingService {
    execution;
    constructor(execution) {
        this.execution = execution;
    }
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
    async getTokenPrices(chainName, quoteCurrency, contractAddress, queryParamOpts) {
        const endpoint = endpointGenerator(`pricing/historical_by_addresses_v2/${chainName}/${quoteCurrency}/${contractAddress}`, [
            {
                key: "from",
                value: queryParamOpts?.from,
            },
            {
                key: "to",
                value: queryParamOpts?.to,
            },
            {
                key: "prices-at-asc",
                value: queryParamOpts?.pricesAtAsc,
            },
        ]);
        const parseData = (data) => {
            if (data.data) {
                data.data.forEach((dataItem) => {
                    dataItem.update_at = dataItem.update_at
                        ? new Date(dataItem.update_at)
                        : null;
                    dataItem.items = dataItem.items
                        ? dataItem.items.map((priceItem) => ({
                            ...priceItem,
                            date: priceItem.date
                                ? new Date(priceItem.date)
                                : null,
                        }))
                        : null;
                });
            }
            return data;
        };
        return await this.execution.execute(endpoint, parseData);
    }
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
    async getPoolSpotPrices(chainName, contractAddress, queryParamOpts) {
        const endpoint = endpointGenerator(`pricing/spot_prices/${chainName}/pools/${contractAddress}`, [
            {
                key: "quote-currency",
                value: queryParamOpts?.quoteCurrency,
            },
        ]);
        const parseData = (data) => {
            if (data.data) {
                data.data.forEach((dataItem) => {
                    dataItem.updated_at = dataItem.updated_at
                        ? new Date(dataItem.updated_at)
                        : null;
                });
            }
            return data;
        };
        return await this.execution.execute(endpoint, parseData);
    }
}

/**
 * Approvals API
 *
 */
class SecurityService {
    execution;
    constructor(execution) {
        this.execution = execution;
    }
    /**
     *
     * Commonly used to get a list of approvals across all token contracts categorized by spenders for a wallet’s assets.
     *
     * **Credit Cost**: 2 per call
     *
     * @param {Chain} chainName - The chain name eg: `eth-mainnet` or 1.
     * @param {string} walletAddress - The requested address. Passing in an `ENS`, `RNS`, `Lens Handle`, or an `Unstoppable Domain` resolves automatically.
     *
     */
    async getApprovals(chainName, walletAddress) {
        const endpoint = endpointGenerator(`${chainName}/approvals/${walletAddress}`, []);
        const parseData = (data) => {
            if (data.data) {
                data.data.updated_at = data.data.updated_at
                    ? new Date(data.data.updated_at)
                    : null;
                data.data.items = data.data.items
                    ? data.data.items.map((approvalItem) => ({
                        ...approvalItem,
                        balance: bigIntParser(approvalItem.balance),
                        spenders: approvalItem.spenders
                            ? approvalItem.spenders.map((spenderItem) => ({
                                ...spenderItem,
                                block_signed_at: spenderItem.block_signed_at
                                    ? new Date(spenderItem.block_signed_at)
                                    : null,
                            }))
                            : null,
                    }))
                    : null;
            }
            return data;
        };
        return await this.execution.execute(endpoint, parseData);
    }
}

function extendedTypeof(val) {
  if (val === null) {
    return "null";
  }
  if (Array.isArray(val)) {
    return "array";
  }
  return typeof val;
}
function isObject(val) {
  return extendedTypeof(val) === "object";
}
function areGraphQLFormattedErrors(obj) {
  return Array.isArray(obj) && // must be at least one error
  obj.length > 0 && // error has at least a message
  obj.every((ob) => "message" in ob);
}
function limitCloseReason(reason, whenTooLong) {
  return reason.length < 124 ? reason : whenTooLong;
}

const GRAPHQL_TRANSPORT_WS_PROTOCOL = "graphql-transport-ws";
var CloseCode = /* @__PURE__ */ ((CloseCode2) => {
  CloseCode2[CloseCode2["InternalServerError"] = 4500] = "InternalServerError";
  CloseCode2[CloseCode2["InternalClientError"] = 4005] = "InternalClientError";
  CloseCode2[CloseCode2["BadRequest"] = 4400] = "BadRequest";
  CloseCode2[CloseCode2["BadResponse"] = 4004] = "BadResponse";
  CloseCode2[CloseCode2["Unauthorized"] = 4401] = "Unauthorized";
  CloseCode2[CloseCode2["Forbidden"] = 4403] = "Forbidden";
  CloseCode2[CloseCode2["SubprotocolNotAcceptable"] = 4406] = "SubprotocolNotAcceptable";
  CloseCode2[CloseCode2["ConnectionInitialisationTimeout"] = 4408] = "ConnectionInitialisationTimeout";
  CloseCode2[CloseCode2["ConnectionAcknowledgementTimeout"] = 4504] = "ConnectionAcknowledgementTimeout";
  CloseCode2[CloseCode2["SubscriberAlreadyExists"] = 4409] = "SubscriberAlreadyExists";
  CloseCode2[CloseCode2["TooManyInitialisationRequests"] = 4429] = "TooManyInitialisationRequests";
  return CloseCode2;
})(CloseCode || {});
var MessageType = /* @__PURE__ */ ((MessageType2) => {
  MessageType2["ConnectionInit"] = "connection_init";
  MessageType2["ConnectionAck"] = "connection_ack";
  MessageType2["Ping"] = "ping";
  MessageType2["Pong"] = "pong";
  MessageType2["Subscribe"] = "subscribe";
  MessageType2["Next"] = "next";
  MessageType2["Error"] = "error";
  MessageType2["Complete"] = "complete";
  return MessageType2;
})(MessageType || {});
function validateMessage(val) {
  if (!isObject(val)) {
    throw new Error(
      `Message is expected to be an object, but got ${extendedTypeof(val)}`
    );
  }
  if (!val.type) {
    throw new Error(`Message is missing the 'type' property`);
  }
  if (typeof val.type !== "string") {
    throw new Error(
      `Message is expects the 'type' property to be a string, but got ${extendedTypeof(
        val.type
      )}`
    );
  }
  switch (val.type) {
    case "connection_init" /* ConnectionInit */:
    case "connection_ack" /* ConnectionAck */:
    case "ping" /* Ping */:
    case "pong" /* Pong */: {
      if (val.payload != null && !isObject(val.payload)) {
        throw new Error(
          `"${val.type}" message expects the 'payload' property to be an object or nullish or missing, but got "${val.payload}"`
        );
      }
      break;
    }
    case "subscribe" /* Subscribe */: {
      if (typeof val.id !== "string") {
        throw new Error(
          `"${val.type}" message expects the 'id' property to be a string, but got ${extendedTypeof(
            val.id
          )}`
        );
      }
      if (!val.id) {
        throw new Error(
          `"${val.type}" message requires a non-empty 'id' property`
        );
      }
      if (!isObject(val.payload)) {
        throw new Error(
          `"${val.type}" message expects the 'payload' property to be an object, but got ${extendedTypeof(
            val.payload
          )}`
        );
      }
      if (typeof val.payload.query !== "string") {
        throw new Error(
          `"${val.type}" message payload expects the 'query' property to be a string, but got ${extendedTypeof(
            val.payload.query
          )}`
        );
      }
      if (val.payload.variables != null && !isObject(val.payload.variables)) {
        throw new Error(
          `"${val.type}" message payload expects the 'variables' property to be a an object or nullish or missing, but got ${extendedTypeof(
            val.payload.variables
          )}`
        );
      }
      if (val.payload.operationName != null && extendedTypeof(val.payload.operationName) !== "string") {
        throw new Error(
          `"${val.type}" message payload expects the 'operationName' property to be a string or nullish or missing, but got ${extendedTypeof(
            val.payload.operationName
          )}`
        );
      }
      if (val.payload.extensions != null && !isObject(val.payload.extensions)) {
        throw new Error(
          `"${val.type}" message payload expects the 'extensions' property to be a an object or nullish or missing, but got ${extendedTypeof(
            val.payload.extensions
          )}`
        );
      }
      break;
    }
    case "next" /* Next */: {
      if (typeof val.id !== "string") {
        throw new Error(
          `"${val.type}" message expects the 'id' property to be a string, but got ${extendedTypeof(
            val.id
          )}`
        );
      }
      if (!val.id) {
        throw new Error(
          `"${val.type}" message requires a non-empty 'id' property`
        );
      }
      if (!isObject(val.payload)) {
        throw new Error(
          `"${val.type}" message expects the 'payload' property to be an object, but got ${extendedTypeof(
            val.payload
          )}`
        );
      }
      break;
    }
    case "error" /* Error */: {
      if (typeof val.id !== "string") {
        throw new Error(
          `"${val.type}" message expects the 'id' property to be a string, but got ${extendedTypeof(
            val.id
          )}`
        );
      }
      if (!val.id) {
        throw new Error(
          `"${val.type}" message requires a non-empty 'id' property`
        );
      }
      if (!areGraphQLFormattedErrors(val.payload)) {
        throw new Error(
          `"${val.type}" message expects the 'payload' property to be an array of GraphQL errors, but got ${JSON.stringify(
            val.payload
          )}`
        );
      }
      break;
    }
    case "complete" /* Complete */: {
      if (typeof val.id !== "string") {
        throw new Error(
          `"${val.type}" message expects the 'id' property to be a string, but got ${extendedTypeof(
            val.id
          )}`
        );
      }
      if (!val.id) {
        throw new Error(
          `"${val.type}" message requires a non-empty 'id' property`
        );
      }
      break;
    }
    default:
      throw new Error(`Invalid message 'type' property "${val.type}"`);
  }
  return val;
}
function parseMessage(data, reviver) {
  return validateMessage(
    typeof data === "string" ? JSON.parse(data, reviver) : data
  );
}
function stringifyMessage(msg, replacer) {
  validateMessage(msg);
  return JSON.stringify(msg, replacer);
}

function createClient(options) {
  const {
    url,
    connectionParams,
    lazy = true,
    onNonLazyError = console.error,
    lazyCloseTimeout: lazyCloseTimeoutMs = 0,
    keepAlive = 0,
    disablePong,
    connectionAckWaitTimeout = 0,
    retryAttempts = 5,
    retryWait = async function randomisedExponentialBackoff(retries2) {
      const retryDelaySeconds = Math.pow(2, retries2);
      await new Promise(
        (resolve) => setTimeout(
          resolve,
          retryDelaySeconds * 1e3 + // add random timeout from 300ms to 3s
          Math.floor(Math.random() * (3e3 - 300) + 300)
        )
      );
    },
    shouldRetry = isLikeCloseEvent,
    on,
    webSocketImpl,
    /**
     * Generates a v4 UUID to be used as the ID using `Math`
     * as the random number generator. Supply your own generator
     * in case you need more uniqueness.
     *
     * Reference: https://gist.github.com/jed/982883
     */
    generateID = function generateUUID() {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0, v = c == "x" ? r : r & 3 | 8;
        return v.toString(16);
      });
    },
    jsonMessageReplacer: replacer,
    jsonMessageReviver: reviver
  } = options;
  let ws;
  if (webSocketImpl) {
    if (!isWebSocket(webSocketImpl)) {
      throw new Error("Invalid WebSocket implementation provided");
    }
    ws = webSocketImpl;
  } else if (typeof WebSocket !== "undefined") {
    ws = WebSocket;
  } else if (typeof global !== "undefined") {
    ws = global.WebSocket || // @ts-expect-error: Support more browsers
    global.MozWebSocket;
  } else if (typeof window !== "undefined") {
    ws = window.WebSocket || // @ts-expect-error: Support more browsers
    window.MozWebSocket;
  }
  if (!ws)
    throw new Error(
      "WebSocket implementation missing; on Node you can `import WebSocket from 'ws';` and pass `webSocketImpl: WebSocket` to `createClient`"
    );
  const WebSocketImpl = ws;
  const emitter = (() => {
    const message = /* @__PURE__ */ (() => {
      const listeners2 = {};
      return {
        on(id, listener) {
          listeners2[id] = listener;
          return () => {
            delete listeners2[id];
          };
        },
        emit(message2) {
          if ("id" in message2) listeners2[message2.id]?.(message2);
        }
      };
    })();
    const listeners = {
      connecting: on?.connecting ? [on.connecting] : [],
      opened: on?.opened ? [on.opened] : [],
      connected: on?.connected ? [on.connected] : [],
      ping: on?.ping ? [on.ping] : [],
      pong: on?.pong ? [on.pong] : [],
      message: on?.message ? [message.emit, on.message] : [message.emit],
      closed: on?.closed ? [on.closed] : [],
      error: on?.error ? [on.error] : []
    };
    return {
      onMessage: message.on,
      on(event, listener) {
        const l = listeners[event];
        l.push(listener);
        return () => {
          l.splice(l.indexOf(listener), 1);
        };
      },
      emit(event, ...args) {
        for (const listener of [...listeners[event]]) {
          listener(...args);
        }
      }
    };
  })();
  function errorOrClosed(cb) {
    const listening = [
      // errors are fatal and more critical than close events, throw them first
      emitter.on("error", (err) => {
        listening.forEach((unlisten) => unlisten());
        cb(err);
      }),
      // closes can be graceful and not fatal, throw them second (if error didnt throw)
      emitter.on("closed", (event) => {
        listening.forEach((unlisten) => unlisten());
        cb(event);
      })
    ];
  }
  let connecting, locks = 0, lazyCloseTimeout, retrying = false, retries = 0, disposed = false;
  async function connect() {
    clearTimeout(lazyCloseTimeout);
    const [socket, throwOnClose] = await (connecting ?? (connecting = new Promise(
      (connected, denied) => (async () => {
        if (retrying) {
          await retryWait(retries);
          if (!locks) {
            connecting = void 0;
            return denied({ code: 1e3, reason: "All Subscriptions Gone" });
          }
          retries++;
        }
        emitter.emit("connecting", retrying);
        const socket2 = new WebSocketImpl(
          typeof url === "function" ? await url() : url,
          GRAPHQL_TRANSPORT_WS_PROTOCOL
        );
        let connectionAckTimeout, queuedPing;
        function enqueuePing() {
          if (isFinite(keepAlive) && keepAlive > 0) {
            clearTimeout(queuedPing);
            queuedPing = setTimeout(() => {
              if (socket2.readyState === WebSocketImpl.OPEN) {
                socket2.send(stringifyMessage({ type: MessageType.Ping }));
                emitter.emit("ping", false, void 0);
              }
            }, keepAlive);
          }
        }
        errorOrClosed((errOrEvent) => {
          connecting = void 0;
          clearTimeout(connectionAckTimeout);
          clearTimeout(queuedPing);
          denied(errOrEvent);
          if (errOrEvent instanceof TerminatedCloseEvent) {
            socket2.close(4499, "Terminated");
            socket2.onerror = null;
            socket2.onclose = null;
          }
        });
        socket2.onerror = (err) => emitter.emit("error", err);
        socket2.onclose = (event) => emitter.emit("closed", event);
        socket2.onopen = async () => {
          try {
            emitter.emit("opened", socket2);
            const payload = typeof connectionParams === "function" ? await connectionParams() : connectionParams;
            if (socket2.readyState !== WebSocketImpl.OPEN) return;
            socket2.send(
              stringifyMessage(
                payload ? {
                  type: MessageType.ConnectionInit,
                  payload
                } : {
                  type: MessageType.ConnectionInit
                  // payload is completely absent if not provided
                },
                replacer
              )
            );
            if (isFinite(connectionAckWaitTimeout) && connectionAckWaitTimeout > 0) {
              connectionAckTimeout = setTimeout(() => {
                socket2.close(
                  CloseCode.ConnectionAcknowledgementTimeout,
                  "Connection acknowledgement timeout"
                );
              }, connectionAckWaitTimeout);
            }
            enqueuePing();
          } catch (err) {
            emitter.emit("error", err);
            socket2.close(
              CloseCode.InternalClientError,
              limitCloseReason(
                err instanceof Error ? err.message : String(err),
                "Internal client error"
              )
            );
          }
        };
        let acknowledged = false;
        socket2.onmessage = ({ data }) => {
          try {
            const message = parseMessage(data, reviver);
            emitter.emit("message", message);
            if (message.type === "ping" || message.type === "pong") {
              emitter.emit(message.type, true, message.payload);
              if (message.type === "pong") {
                enqueuePing();
              } else if (!disablePong) {
                socket2.send(
                  stringifyMessage(
                    message.payload ? {
                      type: MessageType.Pong,
                      payload: message.payload
                    } : {
                      type: MessageType.Pong
                      // payload is completely absent if not provided
                    }
                  )
                );
                emitter.emit("pong", false, message.payload);
              }
              return;
            }
            if (acknowledged) return;
            if (message.type !== MessageType.ConnectionAck)
              throw new Error(
                `First message cannot be of type ${message.type}`
              );
            clearTimeout(connectionAckTimeout);
            acknowledged = true;
            emitter.emit("connected", socket2, message.payload, retrying);
            retrying = false;
            retries = 0;
            connected([
              socket2,
              new Promise((_, reject) => errorOrClosed(reject))
            ]);
          } catch (err) {
            socket2.onmessage = null;
            emitter.emit("error", err);
            socket2.close(
              CloseCode.BadResponse,
              limitCloseReason(
                err instanceof Error ? err.message : String(err),
                "Bad response"
              )
            );
          }
        };
      })()
    )));
    if (socket.readyState === WebSocketImpl.CLOSING) await throwOnClose;
    let release = () => {
    };
    const released = new Promise((resolve) => release = resolve);
    return [
      socket,
      release,
      Promise.race([
        // wait for
        released.then(() => {
          if (!locks) {
            const complete = () => socket.close(1e3, "Normal Closure");
            if (isFinite(lazyCloseTimeoutMs) && lazyCloseTimeoutMs > 0) {
              lazyCloseTimeout = setTimeout(() => {
                if (socket.readyState === WebSocketImpl.OPEN) complete();
              }, lazyCloseTimeoutMs);
            } else {
              complete();
            }
          }
        }),
        // or
        throwOnClose
      ])
    ];
  }
  function shouldRetryConnectOrThrow(errOrCloseEvent) {
    if (isLikeCloseEvent(errOrCloseEvent) && (isFatalInternalCloseCode(errOrCloseEvent.code) || [
      CloseCode.InternalServerError,
      CloseCode.InternalClientError,
      CloseCode.BadRequest,
      CloseCode.BadResponse,
      CloseCode.Unauthorized,
      // CloseCode.Forbidden, might grant access out after retry
      CloseCode.SubprotocolNotAcceptable,
      // CloseCode.ConnectionInitialisationTimeout, might not time out after retry
      // CloseCode.ConnectionAcknowledgementTimeout, might not time out after retry
      CloseCode.SubscriberAlreadyExists,
      CloseCode.TooManyInitialisationRequests
      // 4499, // Terminated, probably because the socket froze, we want to retry
    ].includes(errOrCloseEvent.code)))
      throw errOrCloseEvent;
    if (disposed) return false;
    if (isLikeCloseEvent(errOrCloseEvent) && errOrCloseEvent.code === 1e3)
      return locks > 0;
    if (!retryAttempts || retries >= retryAttempts) throw errOrCloseEvent;
    if (!shouldRetry(errOrCloseEvent)) throw errOrCloseEvent;
    return retrying = true;
  }
  if (!lazy) {
    (async () => {
      locks++;
      for (; ; ) {
        try {
          const [, , throwOnClose] = await connect();
          await throwOnClose;
        } catch (errOrCloseEvent) {
          try {
            if (!shouldRetryConnectOrThrow(errOrCloseEvent)) return;
          } catch (errOrCloseEvent2) {
            return onNonLazyError?.(errOrCloseEvent2);
          }
        }
      }
    })();
  }
  function subscribe(payload, sink) {
    const id = generateID(payload);
    let done = false, errored = false, releaser = () => {
      locks--;
      done = true;
    };
    (async () => {
      locks++;
      for (; ; ) {
        try {
          const [socket, release, waitForReleaseOrThrowOnClose] = await connect();
          if (done) return release();
          const unlisten = emitter.onMessage(id, (message) => {
            switch (message.type) {
              case MessageType.Next: {
                sink.next(message.payload);
                return;
              }
              case MessageType.Error: {
                errored = true, done = true;
                sink.error(message.payload);
                releaser();
                return;
              }
              case MessageType.Complete: {
                done = true;
                releaser();
                return;
              }
            }
          });
          socket.send(
            stringifyMessage(
              {
                id,
                type: MessageType.Subscribe,
                payload
              },
              replacer
            )
          );
          releaser = () => {
            if (!done && socket.readyState === WebSocketImpl.OPEN)
              socket.send(
                stringifyMessage(
                  {
                    id,
                    type: MessageType.Complete
                  },
                  replacer
                )
              );
            locks--;
            done = true;
            release();
          };
          await waitForReleaseOrThrowOnClose.finally(unlisten);
          return;
        } catch (errOrCloseEvent) {
          if (!shouldRetryConnectOrThrow(errOrCloseEvent)) return;
        }
      }
    })().then(() => {
      if (!errored) sink.complete();
    }).catch((err) => {
      sink.error(err);
    });
    return () => {
      if (!done) releaser();
    };
  }
  return {
    on: emitter.on,
    subscribe,
    iterate(request) {
      const pending = [];
      const deferred = {
        done: false,
        error: null,
        resolve: () => {
        }
      };
      const dispose = subscribe(request, {
        next(val) {
          pending.push(val);
          deferred.resolve();
        },
        error(err) {
          deferred.done = true;
          deferred.error = err;
          deferred.resolve();
        },
        complete() {
          deferred.done = true;
          deferred.resolve();
        }
      });
      const iterator = async function* iterator2() {
        for (; ; ) {
          if (!pending.length) {
            await new Promise((resolve) => deferred.resolve = resolve);
          }
          while (pending.length) {
            yield pending.shift();
          }
          if (deferred.error) {
            throw deferred.error;
          }
          if (deferred.done) {
            return;
          }
        }
      }();
      iterator.throw = async (err) => {
        if (!deferred.done) {
          deferred.done = true;
          deferred.error = err;
          deferred.resolve();
        }
        return { done: true, value: void 0 };
      };
      iterator.return = async () => {
        dispose();
        return { done: true, value: void 0 };
      };
      return iterator;
    },
    async dispose() {
      disposed = true;
      if (connecting) {
        const [socket] = await connecting;
        socket.close(1e3, "Normal Closure");
      }
    },
    terminate() {
      if (connecting) {
        emitter.emit("closed", new TerminatedCloseEvent());
      }
    }
  };
}
class TerminatedCloseEvent extends Error {
  name = "TerminatedCloseEvent";
  message = "4499: Terminated";
  code = 4499;
  reason = "Terminated";
  wasClean = false;
}
function isLikeCloseEvent(val) {
  return isObject(val) && "code" in val && "reason" in val;
}
function isFatalInternalCloseCode(code) {
  if ([
    1e3,
    // Normal Closure is not an erroneous close code
    1001,
    // Going Away
    1006,
    // Abnormal Closure
    1005,
    // No Status Received
    1012,
    // Service Restart
    1013,
    // Try Again Later
    1014
    // Bad Gateway
  ].includes(code))
    return false;
  return code >= 1e3 && code <= 1999;
}
function isWebSocket(val) {
  return typeof val === "function" && "constructor" in val && "CLOSED" in val && "CLOSING" in val && "CONNECTING" in val && "OPEN" in val;
}

/**
 * Streaming API Service
 *
 */
class StreamingService {
    defaultConfig = {
        shouldRetry: (retries) => retries < 5,
        maxReconnectAttempts: 5,
        onConnecting: () => {
            console.info("StreamingService Connection Connecting...");
        },
        onOpened: () => {
            console.info("StreamingService Connection Established Successfully!");
        },
        onClosed: () => {
            console.info("StreamingService Connection Closed");
        },
        onError: (err) => {
            console.error("StreamingService Connection Error:", err);
        },
    };
    constructor(apiKey, config) {
        StreamingWebSocketClient.configure(apiKey, {
            ...this.defaultConfig,
            ...config,
        });
        StreamingWebSocketClient.getInstance();
    }
    /**
     * Initialize the streaming connection
     */
    getClient() {
        return StreamingWebSocketClient.getClient();
    }
    /**
     * Disconnect from the streaming service
     */
    async disconnect() {
        await StreamingWebSocketClient.disconnect();
    }
    /**
     * Check if the client is connected
     */
    get isConnected() {
        return StreamingWebSocketClient.isConnected;
    }
    /**
     * Subscribe to a custom GraphQL subscription
     * This allows for advanced usage and future extensibility
     *
     * @param query - GraphQL subscription query
     * @param variables - Query variables
     * @param callbacks - Subscription callbacks
     * @returns Unsubscribe function
     */
    rawQuery(query, variables, callbacks) {
        const client = StreamingWebSocketClient.getClient();
        return client.subscribe({
            query,
            variables,
        }, {
            next: (data) => callbacks.next(data),
            error: callbacks.error || (() => { }),
            complete: callbacks.complete || (() => { }),
        });
    }
    /**
     *
     * The OHLCV Pairs stream provides real-time updates on the Open, High, Low, Close prices and Volume of one or many token pairs at configurable intervals.
     *
     * **Credit Cost**: 0 per call
     *
     * **Beta**: This endpoint is in beta.
     *
     * @param params - Parameters for the OHLCV pairs stream
     * @param callbacks - Subscription callbacks
     * @returns Unsubscribe function
     *
     * @example
     * ```typescript
     * const unsubscribe = streamingService.subscribeToOHLCVPairs(
     *   {
     *     chain_name: StreamingChain.BASE_MAINNET,
     *     pair_addresses: ["0x9c087Eb773291e50CF6c6a90ef0F4500e349B903"],
     *     interval: StreamingInterval.ONE_MINUTE,
     *     timeframe: StreamingTimeframe.ONE_HOUR
     *   },
     *   {
     *     next: (data) => console.log("OHLCV Data:", data),
     *     error: (err) => console.error("Error:", err),
     *     complete: () => console.log("Stream completed")
     *   }
     * );
     * ```
     */
    subscribeToOHLCVPairs(params, callbacks) {
        // Format the pair addresses array for the query
        const pairAddressesString = params.pair_addresses
            .map((addr) => `"${addr}"`)
            .join(", ");
        const query = `
      subscription {
        ohlcvCandlesForPair(
          chain_name: ${params.chain_name}
          pair_addresses: [${pairAddressesString}]
          interval: ${params.interval}
          timeframe: ${params.timeframe}
          ${params.limit ? `limit: ${params.limit}` : ""}
        ) {
          chain_name
          pair_address
          interval
          timeframe
          timestamp
          open
          high
          low
          close
          volume
          volume_usd
          quote_rate
          quote_rate_usd
          base_token {
            contract_name
            contract_address
            contract_decimals
            contract_ticker_symbol
          }
          quote_token {
            contract_name
            contract_address
            contract_decimals
            contract_ticker_symbol
          }
        }
      }
    `;
        const client = StreamingWebSocketClient.getClient();
        return client.subscribe({
            query,
        }, {
            next: (data) => {
                if (data.data) {
                    const ohlcvData = data.data.ohlcvCandlesForPair;
                    if (ohlcvData) {
                        callbacks.next(ohlcvData);
                    }
                }
                else if (data.errors) {
                    callbacks.error?.(data.errors);
                }
            },
            error: callbacks.error || (() => { }),
            complete: callbacks.complete || (() => { }),
        });
    }
    /**
     *
     * The OHLCV Tokens stream provides real-time updates on the Open, High, Low, Close prices and Volume of one or many tokens at configurable intervals.
     *
     * **Credit Cost**: 0 per call
     *
     * **Beta**: This endpoint is in beta.
     *
     * @param params - Parameters for the OHLCV tokens stream
     * @param callbacks - Subscription callbacks
     * @returns Unsubscribe function
     *
     * @example
     * ```typescript
     * const unsubscribe = streamingService.subscribeToOHLCVTokens(
     *   {
     *     chain_name: StreamingChain.BASE_MAINNET,
     *     token_addresses: ["0x4B6104755AfB5Da4581B81C552DA3A25608c73B8"],
     *     interval: StreamingInterval.ONE_MINUTE,
     *     timeframe: StreamingTimeframe.ONE_HOUR
     *   },
     *   {
     *     next: (data) => console.log("OHLCV Token Data:", data),
     *     error: (err) => console.error("Error:", err),
     *     complete: () => console.log("Stream completed")
     *   }
     * );
     * ```
     */
    subscribeToOHLCVTokens(params, callbacks) {
        // Format the token addresses array for the query
        const tokenAddressesString = params.token_addresses
            .map((addr) => `"${addr}"`)
            .join(", ");
        const query = `
      subscription {
        ohlcvCandlesForToken(
          chain_name: ${params.chain_name}
          token_addresses: [${tokenAddressesString}]
          interval: ${params.interval}
          timeframe: ${params.timeframe}
          ${params.limit ? `limit: ${params.limit}` : ""}
        ) {
          chain_name
          pair_address
          interval
          timeframe
          timestamp
          open
          high
          low
          close
          volume
          volume_usd
          quote_rate
          quote_rate_usd
          base_token {
            contract_name
            contract_address
            contract_decimals
            contract_ticker_symbol
          }
          quote_token {
            contract_name
            contract_address
            contract_decimals
            contract_ticker_symbol
          }
        }
      }
    `;
        const client = StreamingWebSocketClient.getClient();
        return client.subscribe({
            query,
        }, {
            next: (data) => {
                if (data.data) {
                    const ohlcvData = data.data.ohlcvCandlesForToken;
                    if (ohlcvData) {
                        callbacks.next(ohlcvData);
                    }
                }
                else if (data.errors) {
                    callbacks.error?.(data.errors);
                }
            },
            error: callbacks.error || (() => { }),
            complete: callbacks.complete || (() => { }),
        });
    }
    /**
     *
     * The New DEX Pairs stream provides real-time updates when new liquidity pairs are created on decentralized exchanges (DEXes). This documentation follows our standard streaming API structure.
     *
     * **Credit Cost**: 0 per call
     *
     * **Beta**: This endpoint is in beta.
     *
     * @param params - Parameters for the new pairs stream
     * @param callbacks - Subscription callbacks
     * @returns Unsubscribe function
     *
     * @example
     * ```typescript
     * const unsubscribe = streamingService.subscribeToNewPairs(
     *   {
     *     chain_name: StreamingChain.BASE_MAINNET,
     *     protocols: [StreamingProtocol.UNISWAP_V2, StreamingProtocol.UNISWAP_V3]
     *   },
     *   {
     *     next: (data) => console.log("New Pairs:", data),
     *     error: (err) => console.error("Error:", err),
     *     complete: () => console.log("Stream completed")
     *   }
     * );
     * ```
     */
    subscribeToNewPairs(params, callbacks) {
        const query = `
      subscription {
        newPairs(
          chain_name: ${params.chain_name},
          protocols: [${params.protocols.join(", ")}]
        ) {
          chain_name
          protocol
          protocol_version
          pair_address
          deployer_address
          tx_hash
          block_signed_at
          liquidity
          supply
          market_cap
          event_name
          quote_rate
          quote_rate_usd
          base_token {
            contract_address
            contract_decimals
            contract_name
            contract_ticker_symbol
          }
          pair {
            contract_address
            contract_decimals
            contract_name
            contract_ticker_symbol
          }
          quote_token {
            contract_address
            contract_decimals
            contract_name
            contract_ticker_symbol
          }
        }
      }
    `;
        const client = StreamingWebSocketClient.getClient();
        return client.subscribe({
            query,
        }, {
            next: (data) => {
                if (data.data) {
                    const newPairsData = data.data.newPairs;
                    if (newPairsData) {
                        callbacks.next(newPairsData);
                    }
                }
                else if (data.errors) {
                    callbacks.error?.(data.errors);
                }
            },
            error: callbacks.error || (() => { }),
            complete: callbacks.complete || (() => { }),
        });
    }
    /**
     *
     * The Update DEX Pairs stream provides real-time event updates on the prices, volumes, market cap and liquidity of one or many token pairs.
     *
     * **Credit Cost**: 0 per call
     *
     * **Beta**: This endpoint is in beta.
     *
     * @param params - Parameters for the update pairs stream
     * @param callbacks - Subscription callbacks
     * @returns Unsubscribe function
     *
     * @example
     * ```typescript
     * const unsubscribe = streamingService.subscribeToUpdatePairs(
     *   {
     *     chain_name: StreamingChain.BASE_MAINNET,
     *     pair_addresses: [
     *       "0x3f0296BF652e19bca772EC3dF08b32732F93014A"
     *     ]
     *   },
     *   {
     *     next: (data) => console.log("Pair Updates:", data),
     *     error: (err) => console.error("Error:", err),
     *     complete: () => console.log("Stream completed")
     *   }
     * );
     * ```
     */
    subscribeToUpdatePairs(params, callbacks) {
        const pairAddressesString = params.pair_addresses
            .map((addr) => `"${addr}"`)
            .join(", ");
        const timeframeFields = `
          volume { current_value previous_value pct_change }
          volume_usd { current_value previous_value pct_change }
          buy_volume { current_value previous_value pct_change }
          sell_volume { current_value previous_value pct_change }
          swap_count { current_value previous_value pct_change }
          buy_count { current_value previous_value pct_change }
          sell_count { current_value previous_value pct_change }
          unique_buyers { current_value previous_value pct_change }
          unique_sellers { current_value previous_value pct_change }
          price { current_value previous_value pct_change }
        `;
        const query = `
      subscription {
        updatePairs(
          chain_name: ${params.chain_name}
          pair_addresses: [${pairAddressesString}]
        ) {
          id
          chain_name
          pair_address
          timestamp
          quote_rate
          quote_rate_usd
          market_cap
          liquidity
          sender
          trader
          direction
          base_token {
            contract_name
            contract_address
            contract_decimals
            contract_ticker_symbol
          }
          quote_token {
            contract_name
            contract_address
            contract_decimals
            contract_ticker_symbol
          }
          last_5m { ${timeframeFields} }
          last_1hr { ${timeframeFields} }
          last_6hr { ${timeframeFields} }
          last_24hr { ${timeframeFields} }
        }
      }
    `;
        const client = StreamingWebSocketClient.getClient();
        return client.subscribe({
            query,
        }, {
            next: (data) => {
                if (data.data) {
                    const updatePairsData = data.data.updatePairs;
                    if (updatePairsData) {
                        callbacks.next(updatePairsData);
                    }
                }
                else if (data.errors) {
                    callbacks.error?.(data.errors);
                }
            },
            error: callbacks.error || (() => { }),
            complete: callbacks.complete || (() => { }),
        });
    }
    /**
     *
     * The Update Tokens stream provides real-time swap updates for the highest-volume pool of each specified token.
     *
     * **Credit Cost**: 0 per call
     *
     * **Beta**: This endpoint is in beta.
     *
     * @param params - Parameters for the update tokens stream
     * @param callbacks - Subscription callbacks
     * @returns Unsubscribe function
     *
     * @example
     * ```typescript
     * const unsubscribe = streamingService.subscribeToUpdateTokens(
     *   {
     *     chain_name: StreamingChain.BASE_MAINNET,
     *     token_addresses: [
     *       "0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b"
     *     ]
     *   },
     *   {
     *     next: (data) => console.log("Token Updates:", data),
     *     error: (err) => console.error("Error:", err),
     *     complete: () => console.log("Stream completed")
     *   }
     * );
     * ```
     */
    subscribeToUpdateTokens(params, callbacks) {
        const tokenAddressesString = params.token_addresses
            .map((addr) => `"${addr}"`)
            .join(", ");
        const timeframeFields = `
          volume { current_value previous_value pct_change }
          volume_usd { current_value previous_value pct_change }
          buy_volume { current_value previous_value pct_change }
          sell_volume { current_value previous_value pct_change }
          swap_count { current_value previous_value pct_change }
          buy_count { current_value previous_value pct_change }
          sell_count { current_value previous_value pct_change }
          unique_buyers { current_value previous_value pct_change }
          unique_sellers { current_value previous_value pct_change }
          price { current_value previous_value pct_change }
        `;
        const query = `
      subscription {
        updateTokens(
          chain_name: ${params.chain_name}
          token_addresses: [${tokenAddressesString}]
        ) {
          id
          chain_name
          pair_address
          timestamp
          quote_rate
          quote_rate_usd
          market_cap
          liquidity
          sender
          trader
          direction
          base_token {
            contract_name
            contract_address
            contract_decimals
            contract_ticker_symbol
          }
          quote_token {
            contract_name
            contract_address
            contract_decimals
            contract_ticker_symbol
          }
          last_5m { ${timeframeFields} }
          last_1hr { ${timeframeFields} }
          last_6hr { ${timeframeFields} }
          last_24hr { ${timeframeFields} }
        }
      }
    `;
        const client = StreamingWebSocketClient.getClient();
        return client.subscribe({
            query,
        }, {
            next: (data) => {
                if (data.data) {
                    const updateTokensData = data.data.updateTokens;
                    if (updateTokensData) {
                        callbacks.next(updateTokensData);
                    }
                }
                else if (data.errors) {
                    callbacks.error?.(data.errors);
                }
            },
            error: callbacks.error || (() => { }),
            complete: callbacks.complete || (() => { }),
        });
    }
    /**
     *
     * The Wallet Activity stream provides real-time updates on wallet transactions, token transfers, and interactions with smart contracts . This documentation follows our standard Streaming API structure.
     *
     * **Credit Cost**: 0 per call
     *
     * **Beta**: This endpoint is in beta.
     *
     * @param params - Parameters for the wallet activity stream
     * @param callbacks - Subscription callbacks
     * @returns Unsubscribe function
     *
     * @example
     * ```typescript
     * const unsubscribe = streamingService.subscribeToWalletActivity(
     *   {
     *     chain_name: StreamingChain.BASE_MAINNET,
     *     wallet_addresses: ["0x198ef79f1f515f02dfe9e3115ed9fc07183f02fc"]
     *   },
     *   {
     *     next: (data) => console.log("Wallet Activity:", data),
     *     error: (err) => console.error("Error:", err),
     *     complete: () => console.log("Stream completed")
     *   }
     * );
     * ```
     */
    subscribeToWalletActivity(params, callbacks) {
        // Format the wallet addresses array for the query
        const walletAddressesString = params.wallet_addresses
            .map((addr) => `"${addr}"`)
            .join(", ");
        const query = `
      subscription {
        walletTxs(
          chain_name: ${params.chain_name},
          wallet_addresses: [${walletAddressesString}]
        ) {
          tx_hash
          from_address
          to_address
          value
          chain_name
          block_signed_at
          block_height
          block_hash
          miner_address
          gas_used
          tx_offset
          successful
          decoded_type
          decoded_details {
            ... on TransferTransaction {
              from
              to
              amount
              quote_usd
              quote_rate_usd
              contract_metadata {
                contract_name
                contract_address
                contract_decimals
                contract_ticker_symbol
              }
            }
            ... on SwapTransaction {
              token_in {
                contract_name
                contract_address
                contract_decimals
                contract_ticker_symbol
              }
              token_out {
                contract_name
                contract_address
                contract_decimals
                contract_ticker_symbol
              }
              amount_in
              amount_out
            }
            ... on BridgeTransaction {
              type
              typeString
              from
              to
              amount
              quote_usd
              quote_rate_usd
              contract_metadata {
                contract_name
                contract_address
                contract_decimals
                contract_ticker_symbol
              }
            }
            ... on DepositTransaction {
              from
              to
              amount
              quote_usd
              quote_rate_usd
              contract_metadata {
                contract_name
                contract_address
                contract_decimals
                contract_ticker_symbol
              }
            }
            ... on WithdrawTransaction {
              from
              to
              amount
              quote_usd
              quote_rate_usd
              contract_metadata {
                contract_name
                contract_address
                contract_decimals
                contract_ticker_symbol
              }
            }
            ... on ApproveTransaction {
              spender
              amount
              quote_usd
              quote_rate_usd
              contract_metadata {
                contract_name
                contract_address
                contract_decimals
                contract_ticker_symbol
              }
            }
            ... on ErrorDetails {
              message
            }
          }
          logs {
            emitter_address
            log_offset
            data
            topics
          }
        }
      }
    `;
        const client = StreamingWebSocketClient.getClient();
        return client.subscribe({
            query,
        }, {
            next: (data) => {
                if (data.data) {
                    const walletActivityData = data.data.walletTxs;
                    if (walletActivityData) {
                        callbacks.next(walletActivityData);
                    }
                }
                else if (data.errors) {
                    callbacks.error?.(data.errors);
                }
            },
            error: callbacks.error || (() => { }),
            complete: callbacks.complete || (() => { }),
        });
    }
    /**
     * Search for tokens by keyword, ticker, or contract address
     *
     * @param params - Parameters for the token search query
     * @returns Promise resolving to an array of matching tokens
     *
     * @example
     * ```typescript
     * const results = await streamingService.searchToken({
     *   query: "PEPE"
     * });
     * console.log("Search Results:", results);
     * ```
     */
    searchToken(params) {
        const query = `
      query SearchToken($query: String!, $chain_name: ChainName) {
        searchToken(query: $query, chain_name: $chain_name) {
          pair_address
          chain_name
          quote_rate
          quote_rate_usd
          volume
          volume_usd
          market_cap
          base_token {
            contract_name
            contract_address
            contract_decimals
            contract_ticker_symbol
          }
          quote_token {
            contract_name
            contract_address
            contract_decimals
            contract_ticker_symbol
          }
        }
      }
    `;
        const client = StreamingWebSocketClient.getClient();
        return new Promise((resolve, reject) => {
            let result = [];
            client.subscribe({
                query,
                variables: {
                    query: params.query,
                    chain_name: params.chain_name,
                },
            }, {
                next: (data) => {
                    if (data.data) {
                        result = data.data.searchToken ?? [];
                    }
                    else if (data.errors) {
                        reject(data.errors);
                    }
                },
                error: (err) => reject(err),
                complete: () => resolve(result),
            });
        });
    }
    /**
     * Get top trader wallets and their PnL for a specific token
     *
     * @param params - Parameters for the UPnL token query
     * @returns Promise resolving to an array of top trader wallet data
     *
     * @example
     * ```typescript
     * const traders = await streamingService.getUPnLForToken({
     *   chain_name: StreamingChain.ETH_MAINNET,
     *   token_address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
     * });
     * console.log("Top Traders:", traders);
     * ```
     */
    getUPnLForToken(params) {
        const query = `
      query {
        upnlForToken(
          chain_name: ${params.chain_name}
          token_address: "${params.token_address}"
        ) {
          token_address
          wallet_address
          volume
          transactions_count
          pnl_realized_usd
          balance
          balance_pretty
          pnl_unrealized_usd
          contract_metadata {
            contract_name
            contract_address
            contract_decimals
            contract_ticker_symbol
          }
        }
      }
    `;
        const client = StreamingWebSocketClient.getClient();
        return new Promise((resolve, reject) => {
            let result = [];
            client.subscribe({
                query,
            }, {
                next: (data) => {
                    if (data.data) {
                        result = data.data.upnlForToken ?? [];
                    }
                    else if (data.errors) {
                        reject(data.errors);
                    }
                },
                error: (err) => reject(err),
                complete: () => resolve(result),
            });
        });
    }
    /**
     * Get unrealized and realized PnL for all tokens held by a wallet
     *
     * @param params - Parameters for the UPnL wallet query
     * @returns Promise resolving to an array of token PnL data for the wallet
     *
     * @example
     * ```typescript
     * const pnl = await streamingService.getUPnLForWallet({
     *   chain_name: StreamingChain.ETH_MAINNET,
     *   wallet_address: "0xfe97b0C517a84F98fc6eDe3CD26B43012d31992a"
     * });
     * console.log("Wallet PnL:", pnl);
     * ```
     */
    getUPnLForWallet(params) {
        const query = `
      query {
        upnlForWallet(
          chain_name: ${params.chain_name}
          wallet_address: "${params.wallet_address}"
        ) {
          token_address
          cost_basis
          current_price
          pnl_realized_usd
          pnl_unrealized_usd
          net_balance_change
          marketcap_usd
          contract_metadata {
            contract_name
            contract_address
            contract_decimals
            contract_ticker_symbol
          }
        }
      }
    `;
        const client = StreamingWebSocketClient.getClient();
        return new Promise((resolve, reject) => {
            let result = [];
            client.subscribe({
                query,
            }, {
                next: (data) => {
                    if (data.data) {
                        result = data.data.upnlForWallet ?? [];
                    }
                    else if (data.errors) {
                        reject(data.errors);
                    }
                },
                error: (err) => reject(err),
                complete: () => resolve(result),
            });
        });
    }
}
/**
 * Singleton WebSocket Client for GoldRush Streaming
 *
 */
class StreamingWebSocketClient {
    static apiKey;
    static instance = null;
    static client = null;
    static connected = false;
    static reconnectAttempts = 0;
    static config;
    constructor() { }
    static getInstance() {
        if (!StreamingWebSocketClient.instance) {
            StreamingWebSocketClient.instance = new StreamingWebSocketClient();
        }
        return StreamingWebSocketClient.instance;
    }
    static configure(apiKey, config) {
        StreamingWebSocketClient.apiKey = apiKey;
        StreamingWebSocketClient.config = config;
    }
    static getClient() {
        if (!StreamingWebSocketClient.client ||
            !StreamingWebSocketClient.connected) {
            StreamingWebSocketClient.connect();
        }
        return StreamingWebSocketClient.client;
    }
    static connect() {
        if (StreamingWebSocketClient.client)
            return;
        StreamingWebSocketClient.client = createClient({
            url: "wss://streaming.goldrushdata.com/graphql",
            lazyCloseTimeout: 3000,
            connectionParams: {
                GOLDRUSH_API_KEY: StreamingWebSocketClient.apiKey,
            },
            shouldRetry: () => StreamingWebSocketClient.config.shouldRetry(StreamingWebSocketClient.reconnectAttempts),
            on: {
                connecting: () => {
                    StreamingWebSocketClient.config.onConnecting();
                },
                opened: () => {
                    StreamingWebSocketClient.config.onOpened();
                    StreamingWebSocketClient.reconnectAttempts = 0;
                    StreamingWebSocketClient.connected = true;
                },
                closed: () => {
                    StreamingWebSocketClient.config.onClosed();
                    StreamingWebSocketClient.connected = false;
                },
                error: (err) => {
                    StreamingWebSocketClient.config.onError(err);
                    StreamingWebSocketClient.connected = false;
                },
            },
        });
    }
    static get isConnected() {
        return StreamingWebSocketClient.connected;
    }
    static async disconnect() {
        if (!StreamingWebSocketClient.client)
            return;
        if (!StreamingWebSocketClient.connected)
            return;
        // * INFO: Is a fire & forget
        await StreamingWebSocketClient.client.dispose();
        StreamingWebSocketClient.client = null;
        StreamingWebSocketClient.connected = false;
        // * INFO: Wait for the client to disconnect
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
}

/**
 * Transactions API
 *
 */
class TransactionService {
    execution;
    constructor(execution) {
        this.execution = execution;
    }
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
    async getTransaction(chainName, txHash, queryParamOpts) {
        const endpoint = endpointGenerator(`${chainName}/transaction_v2/${txHash}`, [
            {
                key: "quote-currency",
                value: queryParamOpts?.quoteCurrency,
            },
            {
                key: "no-logs",
                value: queryParamOpts?.noLogs,
            },
            {
                key: "with-internal",
                value: queryParamOpts?.withInternal,
            },
            {
                key: "with-state",
                value: queryParamOpts?.withState,
            },
            {
                key: "with-input-data",
                value: queryParamOpts?.withInputData,
            },
        ]);
        const parseData = (data) => {
            if (data.data) {
                data.data.updated_at = data.data.updated_at
                    ? new Date(data.data.updated_at)
                    : null;
                data.data.items = data.data.items
                    ? data.data.items.map((txItem) => ({
                        ...txItem,
                        value: bigIntParser(txItem.value),
                        fees_paid: bigIntParser(txItem.fees_paid),
                        block_signed_at: txItem.block_signed_at
                            ? new Date(txItem.block_signed_at)
                            : null,
                        log_events: txItem.log_events
                            ? txItem.log_events.map((logItem) => ({
                                ...logItem,
                                block_signed_at: logItem.block_signed_at
                                    ? new Date(logItem.block_signed_at)
                                    : null,
                            }))
                            : null,
                    }))
                    : null;
            }
            return data;
        };
        return await this.execution.execute(endpoint, parseData);
    }
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
    async getTransactionSummary(chainName, walletAddress, queryParamOpts) {
        const endpoint = endpointGenerator(`${chainName}/address/${walletAddress}/transactions_summary`, [
            {
                key: "quote-currency",
                value: queryParamOpts?.quoteCurrency,
            },
            {
                key: "with-gas",
                value: queryParamOpts?.withGas,
            },
            {
                key: "with-transfer-count",
                value: queryParamOpts?.withTransferCount,
            },
        ]);
        const parseData = (data) => {
            if (data.data) {
                data.data.updated_at = data.data.updated_at
                    ? new Date(data.data.updated_at)
                    : null;
                data.data.items = data.data.items
                    ? data.data.items.map((txsItem) => ({
                        ...txsItem,
                        earliest_transaction: {
                            ...txsItem.earliest_transaction,
                            block_signed_at: txsItem?.earliest_transaction
                                ?.block_signed_at
                                ? new Date(txsItem.earliest_transaction
                                    .block_signed_at)
                                : null,
                        },
                        latest_transaction: {
                            ...txsItem.latest_transaction,
                            block_signed_at: txsItem?.latest_transaction
                                ?.block_signed_at
                                ? new Date(txsItem?.latest_transaction
                                    ?.block_signed_at)
                                : null,
                        },
                        // ? API vs docs non-consistent
                        // gas_summary: {
                        //   ...txsItem.gas_summary,
                        //   total_fees_paid: bigIntParser(
                        //     txsItem.gas_summary.total_fees_paid
                        //   ),
                        // },
                    }))
                    : null;
            }
            return data;
        };
        return await this.execution.execute(endpoint, parseData);
    }
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
    async getEarliestTransactionsForAddress(chainName, walletAddress, queryParamOpts) {
        const searchParams = [
            {
                key: "quote-currency",
                value: queryParamOpts?.quoteCurrency,
            },
            {
                key: "no-logs",
                value: queryParamOpts?.noLogs,
            },
        ];
        const endpoint = endpointGenerator(`${chainName}/bulk/transactions/${walletAddress}`, searchParams);
        const parseData = (data) => {
            if (data.data) {
                data.data.prev = data.data?.links?.prev
                    ? async () => this.execution.execute(endpointGenerator(data.data?.links?.prev, searchParams), parseData)
                    : null;
                data.data.next = data.data?.links?.next
                    ? async () => this.execution.execute(endpointGenerator(data.data?.links?.next, searchParams), parseData)
                    : null;
                data.data.updated_at = data.data.updated_at
                    ? new Date(data.data.updated_at)
                    : null;
                data.data.items = data.data.items
                    ? data.data.items.map((txItem) => ({
                        ...txItem,
                        value: bigIntParser(txItem.value),
                        fees_paid: bigIntParser(txItem.fees_paid),
                        block_signed_at: txItem.block_signed_at
                            ? new Date(txItem.block_signed_at)
                            : null,
                        log_events: txItem.log_events
                            ? txItem.log_events.map((logItem) => ({
                                ...logItem,
                                block_signed_at: logItem.block_signed_at
                                    ? new Date(logItem.block_signed_at)
                                    : null,
                            }))
                            : null,
                    }))
                    : null;
            }
            return data;
        };
        return await this.execution.execute(endpoint, parseData);
    }
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
    async *getAllTransactionsForAddress(chainName, walletAddress, queryParamOpts) {
        const endpoint = endpointGenerator(`${chainName}/address/${walletAddress}/transactions_v3`, [
            {
                key: "quote-currency",
                value: queryParamOpts?.quoteCurrency,
            },
            {
                key: "no-logs",
                value: queryParamOpts?.noLogs,
            },
            {
                key: "block-signed-at-asc",
                value: queryParamOpts?.blockSignedAtAsc,
            },
            {
                key: "with-internal",
                value: queryParamOpts?.withInternal,
            },
            {
                key: "with-state",
                value: queryParamOpts?.withState,
            },
            {
                key: "with-input-data",
                value: queryParamOpts?.withInputData,
            },
        ]);
        const parseData = (data) => {
            if (data.data) {
                data.data.updated_at = data.data.updated_at
                    ? new Date(data.data.updated_at)
                    : null;
                data.data.items = data.data.items
                    ? data.data.items.map((txItem) => ({
                        ...txItem,
                        value: bigIntParser(txItem.value),
                        fees_paid: bigIntParser(txItem.fees_paid),
                        block_signed_at: txItem.block_signed_at
                            ? new Date(txItem.block_signed_at)
                            : null,
                        log_events: txItem.log_events
                            ? txItem.log_events.map((logItem) => ({
                                ...logItem,
                                block_signed_at: logItem.block_signed_at
                                    ? new Date(logItem.block_signed_at)
                                    : null,
                            }))
                            : null,
                    }))
                    : null;
            }
            return data;
        };
        for await (const data of paginateEndpoint(endpoint, this.execution, parseData, "links")) {
            yield data;
        }
    }
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
    async getAllTransactionsForAddressByPage(chainName, walletAddress, queryParamOpts) {
        const searchParams = [
            {
                key: "quote-currency",
                value: queryParamOpts?.quoteCurrency,
            },
            {
                key: "no-logs",
                value: queryParamOpts?.noLogs,
            },
            {
                key: "block-signed-at-asc",
                value: queryParamOpts?.blockSignedAtAsc,
            },
            {
                key: "with-internal",
                value: queryParamOpts?.withInternal,
            },
            {
                key: "with-state",
                value: queryParamOpts?.withState,
            },
            {
                key: "with-input-data",
                value: queryParamOpts?.withInputData,
            },
        ];
        const endpoint = endpointGenerator(`${chainName}/address/${walletAddress}/transactions_v3`, searchParams);
        const parseData = (data) => {
            if (data.data) {
                data.data.prev = data.data?.links?.prev
                    ? async () => this.execution.execute(endpointGenerator(data.data?.links?.prev, searchParams), parseData)
                    : null;
                data.data.next = data.data?.links?.next
                    ? async () => this.execution.execute(endpointGenerator(data.data?.links?.next, searchParams), parseData)
                    : null;
                data.data.updated_at = data.data.updated_at
                    ? new Date(data.data.updated_at)
                    : null;
                data.data.items = data.data.items
                    ? data.data.items.map((txItem) => ({
                        ...txItem,
                        value: bigIntParser(txItem.value),
                        fees_paid: bigIntParser(txItem.fees_paid),
                        block_signed_at: txItem.block_signed_at
                            ? new Date(txItem.block_signed_at)
                            : null,
                        log_events: txItem.log_events
                            ? txItem.log_events.map((logItem) => ({
                                ...logItem,
                                block_signed_at: logItem.block_signed_at
                                    ? new Date(logItem.block_signed_at)
                                    : null,
                            }))
                            : null,
                    }))
                    : null;
            }
            return data;
        };
        return await this.execution.execute(endpoint, parseData);
    }
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
    async getPaginatedTransactionsForAddress(chainName, walletAddress, page, queryParamOpts) {
        const searchParams = [
            {
                key: "quote-currency",
                value: queryParamOpts?.quoteCurrency,
            },
            {
                key: "no-logs",
                value: queryParamOpts?.noLogs,
            },
            {
                key: "block-signed-at-asc",
                value: queryParamOpts?.blockSignedAtAsc,
            },
        ];
        const endpoint = endpointGenerator(`${chainName}/address/${walletAddress}/transactions_v3/page/${page}`, searchParams);
        const parseData = (data) => {
            if (data.data) {
                data.data.prev = data.data?.links?.prev
                    ? async () => this.execution.execute(endpointGenerator(data.data?.links?.prev, searchParams), parseData)
                    : null;
                data.data.next = data.data?.links?.next
                    ? async () => this.execution.execute(endpointGenerator(data.data?.links?.next, searchParams), parseData)
                    : null;
                data.data.updated_at = data.data.updated_at
                    ? new Date(data.data.updated_at)
                    : null;
                data.data.items = data.data.items
                    ? data.data.items.map((txItem) => ({
                        ...txItem,
                        value: bigIntParser(txItem.value),
                        fees_paid: bigIntParser(txItem.fees_paid),
                        block_signed_at: txItem.block_signed_at
                            ? new Date(txItem.block_signed_at)
                            : null,
                        log_events: txItem.log_events
                            ? txItem.log_events.map((logItem) => ({
                                ...logItem,
                                block_signed_at: logItem.block_signed_at
                                    ? new Date(logItem.block_signed_at)
                                    : null,
                            }))
                            : null,
                    }))
                    : null;
            }
            return data;
        };
        return await this.execution.execute(endpoint, parseData);
    }
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
    async getTimeBucketTransactionsForAddress(chainName, walletAddress, timeBucket, queryParamOpts) {
        const searchParams = [
            {
                key: "quote-currency",
                value: queryParamOpts?.quoteCurrency,
            },
            {
                key: "no-logs",
                value: queryParamOpts?.noLogs,
            },
        ];
        const endpoint = endpointGenerator(`${chainName}/bulk/transactions/${walletAddress}/${timeBucket}`, searchParams);
        const parseData = (data) => {
            if (data.data) {
                data.data.prev = data.data?.links?.prev
                    ? async () => this.execution.execute(endpointGenerator(data.data?.links?.prev, searchParams), parseData)
                    : null;
                data.data.next = data.data?.links?.next
                    ? async () => this.execution.execute(endpointGenerator(data.data?.links?.next, searchParams), parseData)
                    : null;
                data.data.updated_at = data.data.updated_at
                    ? new Date(data.data.updated_at)
                    : null;
                data.data.items = data.data.items
                    ? data.data.items.map((txItem) => ({
                        ...txItem,
                        value: bigIntParser(txItem.value),
                        fees_paid: bigIntParser(txItem.fees_paid),
                        block_signed_at: txItem.block_signed_at
                            ? new Date(txItem.block_signed_at)
                            : null,
                        log_events: txItem.log_events
                            ? txItem.log_events.map((logItem) => ({
                                ...logItem,
                                block_signed_at: logItem.block_signed_at
                                    ? new Date(logItem.block_signed_at)
                                    : null,
                            }))
                            : null,
                    }))
                    : null;
            }
            return data;
        };
        return await this.execution.execute(endpoint, parseData);
    }
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
    async getTransactionsForBlockByPage(chainName, blockHeight, page, queryParamOpts) {
        const searchParams = [
            {
                key: "quote-currency",
                value: queryParamOpts?.quoteCurrency,
            },
            {
                key: "no-logs",
                value: queryParamOpts?.noLogs,
            },
        ];
        const endpoint = endpointGenerator(`${chainName}/block/${blockHeight}/transactions_v3/page/${page}`, searchParams);
        const parseData = (data) => {
            if (data.data) {
                data.data.updated_at = data.data.updated_at
                    ? new Date(data.data.updated_at)
                    : null;
                data.data.prev = data.data?.links?.prev
                    ? async () => this.execution.execute(endpointGenerator(data.data?.links?.prev, searchParams), parseData)
                    : null;
                data.data.next = data.data?.links?.next
                    ? async () => this.execution.execute(endpointGenerator(data.data?.links?.next, searchParams), parseData)
                    : null;
                data.data.items = data.data.items
                    ? data.data.items.map((txItem) => ({
                        ...txItem,
                        value: bigIntParser(txItem.value),
                        fees_paid: bigIntParser(txItem.fees_paid),
                        block_signed_at: txItem.block_signed_at
                            ? new Date(txItem.block_signed_at)
                            : null,
                        log_events: txItem.log_events
                            ? txItem.log_events.map((logItem) => ({
                                ...logItem,
                                block_signed_at: logItem.block_signed_at
                                    ? new Date(logItem.block_signed_at)
                                    : null,
                            }))
                            : null,
                    }))
                    : null;
            }
            return data;
        };
        return await this.execution.execute(endpoint, parseData);
    }
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
    async getTransactionsForBlock(chainName, blockHash, queryParamOpts) {
        const searchParams = [
            {
                key: "quote-currency",
                value: queryParamOpts?.quoteCurrency,
            },
            {
                key: "no-logs",
                value: queryParamOpts?.noLogs,
            },
        ];
        const endpoint = endpointGenerator(`${chainName}/block_hash/${blockHash}/transactions_v3`, searchParams);
        const parseData = (data) => {
            if (data.data) {
                data.data.updated_at = data.data.updated_at
                    ? new Date(data.data.updated_at)
                    : null;
                data.data.items = data.data.items
                    ? data.data.items.map((txItem) => ({
                        ...txItem,
                        value: bigIntParser(txItem.value),
                        fees_paid: bigIntParser(txItem.fees_paid),
                        block_signed_at: txItem.block_signed_at
                            ? new Date(txItem.block_signed_at)
                            : null,
                        log_events: txItem.log_events
                            ? txItem.log_events.map((logItem) => ({
                                ...logItem,
                                block_signed_at: logItem.block_signed_at
                                    ? new Date(logItem.block_signed_at)
                                    : null,
                            }))
                            : null,
                    }))
                    : null;
            }
            return data;
        };
        return await this.execution.execute(endpoint, parseData);
    }
}

async function debugOutput(settings, ...content) {
    if (settings.debug) {
        content.forEach((c) => {
            console.info("[DEBUG] |", c);
        });
    }
}

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

class Node {
	/// value;
	/// next;

	constructor(value) {
		this.value = value;

		// TODO: Remove this when targeting Node.js 12.
		this.next = undefined;
	}
}

let Queue$1 = class Queue {
	// TODO: Use private class fields when targeting Node.js 12.
	// #_head;
	// #_tail;
	// #_size;

	constructor() {
		this.clear();
	}

	enqueue(value) {
		const node = new Node(value);

		if (this._head) {
			this._tail.next = node;
			this._tail = node;
		} else {
			this._head = node;
			this._tail = node;
		}

		this._size++;
	}

	dequeue() {
		const current = this._head;
		if (!current) {
			return;
		}

		this._head = this._head.next;
		this._size--;
		return current.value;
	}

	clear() {
		this._head = undefined;
		this._tail = undefined;
		this._size = 0;
	}

	get size() {
		return this._size;
	}

	* [Symbol.iterator]() {
		let current = this._head;

		while (current) {
			yield current.value;
			current = current.next;
		}
	}
};

var yoctoQueue = Queue$1;

const Queue = yoctoQueue;

const pLimit = concurrency => {
	if (!((Number.isInteger(concurrency) || concurrency === Infinity) && concurrency > 0)) {
		throw new TypeError('Expected `concurrency` to be a number from 1 and up');
	}

	const queue = new Queue();
	let activeCount = 0;

	const next = () => {
		activeCount--;

		if (queue.size > 0) {
			queue.dequeue()();
		}
	};

	const run = async (fn, resolve, ...args) => {
		activeCount++;

		const result = (async () => fn(...args))();

		resolve(result);

		try {
			await result;
		} catch {}

		next();
	};

	const enqueue = (fn, resolve, ...args) => {
		queue.enqueue(run.bind(null, fn, resolve, ...args));

		(async () => {
			// This function needs to wait until the next microtask before comparing
			// `activeCount` to `concurrency`, because `activeCount` is updated asynchronously
			// when the run function is dequeued and called. The comparison in the if-statement
			// needs to happen asynchronously as well to get an up-to-date value for `activeCount`.
			await Promise.resolve();

			if (activeCount < concurrency && queue.size > 0) {
				queue.dequeue()();
			}
		})();
	};

	const generator = (fn, ...args) => new Promise(resolve => {
		enqueue(fn, resolve, ...args);
	});

	Object.defineProperties(generator, {
		activeCount: {
			get: () => activeCount
		},
		pendingCount: {
			get: () => queue.size
		},
		clearQueue: {
			value: () => {
				queue.clear();
			}
		}
	});

	return generator;
};

var pLimit_1 = pLimit;

var pLimit$1 = /*@__PURE__*/getDefaultExportFromCjs(pLimit_1);

class Execution {
    settings;
    headers;
    maxRetries;
    retryDelay;
    enableRetry;
    processes;
    constructor(settings, headers) {
        this.settings = settings;
        this.headers = headers;
        this.processes = pLimit$1(this.settings.threadCount ?? 2);
        this.maxRetries = settings.maxRetries ?? 2;
        this.retryDelay = settings.retryDelay ?? 1500;
        this.enableRetry = settings.enableRetry ?? true;
    }
    async execute(endpoint, parseData) {
        let retryCount = 0;
        let completed = false;
        while (!completed) {
            try {
                const startTime = new Date();
                const response = await this.processes(() => fetch(endpoint, {
                    headers: this.headers,
                }));
                debugOutput(this.settings, `Request URL: ${response ? new URL(response.url) : endpoint} | Response code: ${response ? response.status : 429} | Response time: ${(new Date().getTime() - startTime.getTime()).toFixed(2)}ms`);
                if (response.status === null || response.status === 429) {
                    throw new Error(`Received status code: ${response.status ?? 429}`);
                }
                const data = (await response.json());
                if (data.error) {
                    throw data;
                }
                const parsedData = parseData(data);
                completed = true;
                return {
                    data: parsedData.data,
                    error: false,
                    error_code: null,
                    error_message: null,
                };
            }
            catch (error) {
                const err = error;
                debugOutput(this.settings, `Request URL: ${endpoint} | Retry Enabled: ${this.enableRetry} | Retry Count: ${retryCount} | Max Retries: ${this.maxRetries} | Retry Delay: ${this.retryDelay}ms`, error);
                if (this.enableRetry &&
                    (err?.error_code === 429 || err?.cause?.code === 429)) {
                    if (retryCount >= this.maxRetries) {
                        completed = true;
                        return {
                            data: null,
                            error: true,
                            error_code: 429,
                            error_message: `${this.maxRetries} retries exceeded`,
                        };
                    }
                    else {
                        retryCount++;
                        await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
                        completed = false;
                    }
                }
                else {
                    completed = true;
                    return {
                        data: null,
                        error: true,
                        error_code: err?.cause?.code || err?.error_code || 500,
                        error_message: err?.cause?.message ||
                            err?.error_message ||
                            "Internal server error",
                    };
                }
            }
        }
        return {
            data: null,
            error: true,
            error_code: 500,
            error_message: "Internal server error",
        };
    }
}

const _apiKeyV1Pattern = /^ckey_([a-f0-9]{27})$/;
const _apiKeyV2Pattern = /^cqt_(wF|rQ)([bcdfghjkmpqrtvwxyBCDFGHJKMPQRTVWXY346789]{26})$/;
const isValidApiKey = (apiKey) => {
    return _apiKeyV1Pattern.test(apiKey) || _apiKeyV2Pattern.test(apiKey);
};

/**
 * GoldRushClient Class
 */
class GoldRushClient {
    userAgent = `com.covalenthq.sdk.typescript/${version}`;
    AllChainsService;
    BalanceService;
    BaseService;
    BitcoinService;
    NftService;
    PricingService;
    SecurityService;
    StreamingService;
    TransactionService;
    constructor(apiKey, settings = {}, streamingConfig = {}) {
        const validKey = isValidApiKey(apiKey);
        if (!validKey) {
            throw {
                data: null,
                error: true,
                error_code: 401,
                error_message: "Invalid or missing API key (sign up at https://goldrush.dev/platform/apikey)",
            };
        }
        const execution = new Execution(settings, {
            Authorization: `Bearer ${apiKey}`,
            "X-Requested-With": settings.source
                ? `${settings.source} (${this.userAgent})`
                : this.userAgent,
        });
        this.AllChainsService = new AllChainsService(execution);
        this.BalanceService = new BalanceService(execution);
        this.BaseService = new BaseService(execution);
        this.BitcoinService = new BitcoinService(execution);
        this.NftService = new NftService(execution);
        this.PricingService = new PricingService(execution);
        this.SecurityService = new SecurityService(execution);
        this.TransactionService = new TransactionService(execution);
        this.StreamingService = new StreamingService(apiKey, streamingConfig);
    }
}

/*
 *  big.js v6.2.2
 *  A small, fast, easy-to-use library for arbitrary-precision decimal arithmetic.
 *  Copyright (c) 2024 Michael Mclaughlin
 *  https://github.com/MikeMcl/big.js/LICENCE.md
 */


/************************************** EDITABLE DEFAULTS *****************************************/


  // The default values below must be integers within the stated ranges.

  /*
   * The maximum number of decimal places (DP) of the results of operations involving division:
   * div and sqrt, and pow with negative exponents.
   */
var DP = 20,          // 0 to MAX_DP

  /*
   * The rounding mode (RM) used when rounding to the above decimal places.
   *
   *  0  Towards zero (i.e. truncate, no rounding).       (ROUND_DOWN)
   *  1  To nearest neighbour. If equidistant, round up.  (ROUND_HALF_UP)
   *  2  To nearest neighbour. If equidistant, to even.   (ROUND_HALF_EVEN)
   *  3  Away from zero.                                  (ROUND_UP)
   */
  RM = 1,             // 0, 1, 2 or 3

  // The maximum value of DP and Big.DP.
  MAX_DP = 1E6,       // 0 to 1000000

  // The maximum magnitude of the exponent argument to the pow method.
  MAX_POWER = 1E6,    // 1 to 1000000

  /*
   * The negative exponent (NE) at and beneath which toString returns exponential notation.
   * (JavaScript numbers: -7)
   * -1000000 is the minimum recommended exponent value of a Big.
   */
  NE = -7,            // 0 to -1000000

  /*
   * The positive exponent (PE) at and above which toString returns exponential notation.
   * (JavaScript numbers: 21)
   * 1000000 is the maximum recommended exponent value of a Big, but this limit is not enforced.
   */
  PE = 21,            // 0 to 1000000

  /*
   * When true, an error will be thrown if a primitive number is passed to the Big constructor,
   * or if valueOf is called, or if toNumber is called on a Big which cannot be converted to a
   * primitive number without a loss of precision.
   */
  STRICT = false,     // true or false


/**************************************************************************************************/


  // Error messages.
  NAME = '[big.js] ',
  INVALID = NAME + 'Invalid ',
  INVALID_DP = INVALID + 'decimal places',
  INVALID_RM = INVALID + 'rounding mode',
  DIV_BY_ZERO = NAME + 'Division by zero',

  // The shared prototype object.
  P = {},
  UNDEFINED = void 0,
  NUMERIC = /^-?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;


/*
 * Create and return a Big constructor.
 */
function _Big_() {

  /*
   * The Big constructor and exported function.
   * Create and return a new instance of a Big number object.
   *
   * n {number|string|Big} A numeric value.
   */
  function Big(n) {
    var x = this;

    // Enable constructor usage without new.
    if (!(x instanceof Big)) return n === UNDEFINED ? _Big_() : new Big(n);

    // Duplicate.
    if (n instanceof Big) {
      x.s = n.s;
      x.e = n.e;
      x.c = n.c.slice();
    } else {
      if (typeof n !== 'string') {
        if (Big.strict === true && typeof n !== 'bigint') {
          throw TypeError(INVALID + 'value');
        }

        // Minus zero?
        n = n === 0 && 1 / n < 0 ? '-0' : String(n);
      }

      parse(x, n);
    }

    // Retain a reference to this Big constructor.
    // Shadow Big.prototype.constructor which points to Object.
    x.constructor = Big;
  }

  Big.prototype = P;
  Big.DP = DP;
  Big.RM = RM;
  Big.NE = NE;
  Big.PE = PE;
  Big.strict = STRICT;
  Big.roundDown = 0;
  Big.roundHalfUp = 1;
  Big.roundHalfEven = 2;
  Big.roundUp = 3;

  return Big;
}


/*
 * Parse the number or string value passed to a Big constructor.
 *
 * x {Big} A Big number instance.
 * n {number|string} A numeric value.
 */
function parse(x, n) {
  var e, i, nl;

  if (!NUMERIC.test(n)) {
    throw Error(INVALID + 'number');
  }

  // Determine sign.
  x.s = n.charAt(0) == '-' ? (n = n.slice(1), -1) : 1;

  // Decimal point?
  if ((e = n.indexOf('.')) > -1) n = n.replace('.', '');

  // Exponential form?
  if ((i = n.search(/e/i)) > 0) {

    // Determine exponent.
    if (e < 0) e = i;
    e += +n.slice(i + 1);
    n = n.substring(0, i);
  } else if (e < 0) {

    // Integer.
    e = n.length;
  }

  nl = n.length;

  // Determine leading zeros.
  for (i = 0; i < nl && n.charAt(i) == '0';) ++i;

  if (i == nl) {

    // Zero.
    x.c = [x.e = 0];
  } else {

    // Determine trailing zeros.
    for (; nl > 0 && n.charAt(--nl) == '0';);
    x.e = e - i - 1;
    x.c = [];

    // Convert string to array of digits without leading/trailing zeros.
    for (e = 0; i <= nl;) x.c[e++] = +n.charAt(i++);
  }

  return x;
}


/*
 * Round Big x to a maximum of sd significant digits using rounding mode rm.
 *
 * x {Big} The Big to round.
 * sd {number} Significant digits: integer, 0 to MAX_DP inclusive.
 * rm {number} Rounding mode: 0 (down), 1 (half-up), 2 (half-even) or 3 (up).
 * [more] {boolean} Whether the result of division was truncated.
 */
function round(x, sd, rm, more) {
  var xc = x.c;

  if (rm === UNDEFINED) rm = x.constructor.RM;
  if (rm !== 0 && rm !== 1 && rm !== 2 && rm !== 3) {
    throw Error(INVALID_RM);
  }

  if (sd < 1) {
    more =
      rm === 3 && (more || !!xc[0]) || sd === 0 && (
      rm === 1 && xc[0] >= 5 ||
      rm === 2 && (xc[0] > 5 || xc[0] === 5 && (more || xc[1] !== UNDEFINED))
    );

    xc.length = 1;

    if (more) {

      // 1, 0.1, 0.01, 0.001, 0.0001 etc.
      x.e = x.e - sd + 1;
      xc[0] = 1;
    } else {

      // Zero.
      xc[0] = x.e = 0;
    }
  } else if (sd < xc.length) {

    // xc[sd] is the digit after the digit that may be rounded up.
    more =
      rm === 1 && xc[sd] >= 5 ||
      rm === 2 && (xc[sd] > 5 || xc[sd] === 5 &&
        (more || xc[sd + 1] !== UNDEFINED || xc[sd - 1] & 1)) ||
      rm === 3 && (more || !!xc[0]);

    // Remove any digits after the required precision.
    xc.length = sd;

    // Round up?
    if (more) {

      // Rounding up may mean the previous digit has to be rounded up.
      for (; ++xc[--sd] > 9;) {
        xc[sd] = 0;
        if (sd === 0) {
          ++x.e;
          xc.unshift(1);
          break;
        }
      }
    }

    // Remove trailing zeros.
    for (sd = xc.length; !xc[--sd];) xc.pop();
  }

  return x;
}


/*
 * Return a string representing the value of Big x in normal or exponential notation.
 * Handles P.toExponential, P.toFixed, P.toJSON, P.toPrecision, P.toString and P.valueOf.
 */
function stringify(x, doExponential, isNonzero) {
  var e = x.e,
    s = x.c.join(''),
    n = s.length;

  // Exponential notation?
  if (doExponential) {
    s = s.charAt(0) + (n > 1 ? '.' + s.slice(1) : '') + (e < 0 ? 'e' : 'e+') + e;

  // Normal notation.
  } else if (e < 0) {
    for (; ++e;) s = '0' + s;
    s = '0.' + s;
  } else if (e > 0) {
    if (++e > n) {
      for (e -= n; e--;) s += '0';
    } else if (e < n) {
      s = s.slice(0, e) + '.' + s.slice(e);
    }
  } else if (n > 1) {
    s = s.charAt(0) + '.' + s.slice(1);
  }

  return x.s < 0 && isNonzero ? '-' + s : s;
}


// Prototype/instance methods


/*
 * Return a new Big whose value is the absolute value of this Big.
 */
P.abs = function () {
  var x = new this.constructor(this);
  x.s = 1;
  return x;
};


/*
 * Return 1 if the value of this Big is greater than the value of Big y,
 *       -1 if the value of this Big is less than the value of Big y, or
 *        0 if they have the same value.
 */
P.cmp = function (y) {
  var isneg,
    x = this,
    xc = x.c,
    yc = (y = new x.constructor(y)).c,
    i = x.s,
    j = y.s,
    k = x.e,
    l = y.e;

  // Either zero?
  if (!xc[0] || !yc[0]) return !xc[0] ? !yc[0] ? 0 : -j : i;

  // Signs differ?
  if (i != j) return i;

  isneg = i < 0;

  // Compare exponents.
  if (k != l) return k > l ^ isneg ? 1 : -1;

  j = (k = xc.length) < (l = yc.length) ? k : l;

  // Compare digit by digit.
  for (i = -1; ++i < j;) {
    if (xc[i] != yc[i]) return xc[i] > yc[i] ^ isneg ? 1 : -1;
  }

  // Compare lengths.
  return k == l ? 0 : k > l ^ isneg ? 1 : -1;
};


/*
 * Return a new Big whose value is the value of this Big divided by the value of Big y, rounded,
 * if necessary, to a maximum of Big.DP decimal places using rounding mode Big.RM.
 */
P.div = function (y) {
  var x = this,
    Big = x.constructor,
    a = x.c,                  // dividend
    b = (y = new Big(y)).c,   // divisor
    k = x.s == y.s ? 1 : -1,
    dp = Big.DP;

  if (dp !== ~~dp || dp < 0 || dp > MAX_DP) {
    throw Error(INVALID_DP);
  }

  // Divisor is zero?
  if (!b[0]) {
    throw Error(DIV_BY_ZERO);
  }

  // Dividend is 0? Return +-0.
  if (!a[0]) {
    y.s = k;
    y.c = [y.e = 0];
    return y;
  }

  var bl, bt, n, cmp, ri,
    bz = b.slice(),
    ai = bl = b.length,
    al = a.length,
    r = a.slice(0, bl),   // remainder
    rl = r.length,
    q = y,                // quotient
    qc = q.c = [],
    qi = 0,
    p = dp + (q.e = x.e - y.e) + 1;    // precision of the result

  q.s = k;
  k = p < 0 ? 0 : p;

  // Create version of divisor with leading zero.
  bz.unshift(0);

  // Add zeros to make remainder as long as divisor.
  for (; rl++ < bl;) r.push(0);

  do {

    // n is how many times the divisor goes into current remainder.
    for (n = 0; n < 10; n++) {

      // Compare divisor and remainder.
      if (bl != (rl = r.length)) {
        cmp = bl > rl ? 1 : -1;
      } else {
        for (ri = -1, cmp = 0; ++ri < bl;) {
          if (b[ri] != r[ri]) {
            cmp = b[ri] > r[ri] ? 1 : -1;
            break;
          }
        }
      }

      // If divisor < remainder, subtract divisor from remainder.
      if (cmp < 0) {

        // Remainder can't be more than 1 digit longer than divisor.
        // Equalise lengths using divisor with extra leading zero?
        for (bt = rl == bl ? b : bz; rl;) {
          if (r[--rl] < bt[rl]) {
            ri = rl;
            for (; ri && !r[--ri];) r[ri] = 9;
            --r[ri];
            r[rl] += 10;
          }
          r[rl] -= bt[rl];
        }

        for (; !r[0];) r.shift();
      } else {
        break;
      }
    }

    // Add the digit n to the result array.
    qc[qi++] = cmp ? n : ++n;

    // Update the remainder.
    if (r[0] && cmp) r[rl] = a[ai] || 0;
    else r = [a[ai]];

  } while ((ai++ < al || r[0] !== UNDEFINED) && k--);

  // Leading zero? Do not remove if result is simply zero (qi == 1).
  if (!qc[0] && qi != 1) {

    // There can't be more than one zero.
    qc.shift();
    q.e--;
    p--;
  }

  // Round?
  if (qi > p) round(q, p, Big.RM, r[0] !== UNDEFINED);

  return q;
};


/*
 * Return true if the value of this Big is equal to the value of Big y, otherwise return false.
 */
P.eq = function (y) {
  return this.cmp(y) === 0;
};


/*
 * Return true if the value of this Big is greater than the value of Big y, otherwise return
 * false.
 */
P.gt = function (y) {
  return this.cmp(y) > 0;
};


/*
 * Return true if the value of this Big is greater than or equal to the value of Big y, otherwise
 * return false.
 */
P.gte = function (y) {
  return this.cmp(y) > -1;
};


/*
 * Return true if the value of this Big is less than the value of Big y, otherwise return false.
 */
P.lt = function (y) {
  return this.cmp(y) < 0;
};


/*
 * Return true if the value of this Big is less than or equal to the value of Big y, otherwise
 * return false.
 */
P.lte = function (y) {
  return this.cmp(y) < 1;
};


/*
 * Return a new Big whose value is the value of this Big minus the value of Big y.
 */
P.minus = P.sub = function (y) {
  var i, j, t, xlty,
    x = this,
    Big = x.constructor,
    a = x.s,
    b = (y = new Big(y)).s;

  // Signs differ?
  if (a != b) {
    y.s = -b;
    return x.plus(y);
  }

  var xc = x.c.slice(),
    xe = x.e,
    yc = y.c,
    ye = y.e;

  // Either zero?
  if (!xc[0] || !yc[0]) {
    if (yc[0]) {
      y.s = -b;
    } else if (xc[0]) {
      y = new Big(x);
    } else {
      y.s = 1;
    }
    return y;
  }

  // Determine which is the bigger number. Prepend zeros to equalise exponents.
  if (a = xe - ye) {

    if (xlty = a < 0) {
      a = -a;
      t = xc;
    } else {
      ye = xe;
      t = yc;
    }

    t.reverse();
    for (b = a; b--;) t.push(0);
    t.reverse();
  } else {

    // Exponents equal. Check digit by digit.
    j = ((xlty = xc.length < yc.length) ? xc : yc).length;

    for (a = b = 0; b < j; b++) {
      if (xc[b] != yc[b]) {
        xlty = xc[b] < yc[b];
        break;
      }
    }
  }

  // x < y? Point xc to the array of the bigger number.
  if (xlty) {
    t = xc;
    xc = yc;
    yc = t;
    y.s = -y.s;
  }

  /*
   * Append zeros to xc if shorter. No need to add zeros to yc if shorter as subtraction only
   * needs to start at yc.length.
   */
  if ((b = (j = yc.length) - (i = xc.length)) > 0) for (; b--;) xc[i++] = 0;

  // Subtract yc from xc.
  for (b = i; j > a;) {
    if (xc[--j] < yc[j]) {
      for (i = j; i && !xc[--i];) xc[i] = 9;
      --xc[i];
      xc[j] += 10;
    }

    xc[j] -= yc[j];
  }

  // Remove trailing zeros.
  for (; xc[--b] === 0;) xc.pop();

  // Remove leading zeros and adjust exponent accordingly.
  for (; xc[0] === 0;) {
    xc.shift();
    --ye;
  }

  if (!xc[0]) {

    // n - n = +0
    y.s = 1;

    // Result must be zero.
    xc = [ye = 0];
  }

  y.c = xc;
  y.e = ye;

  return y;
};


/*
 * Return a new Big whose value is the value of this Big modulo the value of Big y.
 */
P.mod = function (y) {
  var ygtx,
    x = this,
    Big = x.constructor,
    a = x.s,
    b = (y = new Big(y)).s;

  if (!y.c[0]) {
    throw Error(DIV_BY_ZERO);
  }

  x.s = y.s = 1;
  ygtx = y.cmp(x) == 1;
  x.s = a;
  y.s = b;

  if (ygtx) return new Big(x);

  a = Big.DP;
  b = Big.RM;
  Big.DP = Big.RM = 0;
  x = x.div(y);
  Big.DP = a;
  Big.RM = b;

  return this.minus(x.times(y));
};


/*
 * Return a new Big whose value is the value of this Big negated.
 */
P.neg = function () {
  var x = new this.constructor(this);
  x.s = -x.s;
  return x;
};


/*
 * Return a new Big whose value is the value of this Big plus the value of Big y.
 */
P.plus = P.add = function (y) {
  var e, k, t,
    x = this,
    Big = x.constructor;

  y = new Big(y);

  // Signs differ?
  if (x.s != y.s) {
    y.s = -y.s;
    return x.minus(y);
  }

  var xe = x.e,
    xc = x.c,
    ye = y.e,
    yc = y.c;

  // Either zero?
  if (!xc[0] || !yc[0]) {
    if (!yc[0]) {
      if (xc[0]) {
        y = new Big(x);
      } else {
        y.s = x.s;
      }
    }
    return y;
  }

  xc = xc.slice();

  // Prepend zeros to equalise exponents.
  // Note: reverse faster than unshifts.
  if (e = xe - ye) {
    if (e > 0) {
      ye = xe;
      t = yc;
    } else {
      e = -e;
      t = xc;
    }

    t.reverse();
    for (; e--;) t.push(0);
    t.reverse();
  }

  // Point xc to the longer array.
  if (xc.length - yc.length < 0) {
    t = yc;
    yc = xc;
    xc = t;
  }

  e = yc.length;

  // Only start adding at yc.length - 1 as the further digits of xc can be left as they are.
  for (k = 0; e; xc[e] %= 10) k = (xc[--e] = xc[e] + yc[e] + k) / 10 | 0;

  // No need to check for zero, as +x + +y != 0 && -x + -y != 0

  if (k) {
    xc.unshift(k);
    ++ye;
  }

  // Remove trailing zeros.
  for (e = xc.length; xc[--e] === 0;) xc.pop();

  y.c = xc;
  y.e = ye;

  return y;
};


/*
 * Return a Big whose value is the value of this Big raised to the power n.
 * If n is negative, round to a maximum of Big.DP decimal places using rounding
 * mode Big.RM.
 *
 * n {number} Integer, -MAX_POWER to MAX_POWER inclusive.
 */
P.pow = function (n) {
  var x = this,
    one = new x.constructor('1'),
    y = one,
    isneg = n < 0;

  if (n !== ~~n || n < -MAX_POWER || n > MAX_POWER) {
    throw Error(INVALID + 'exponent');
  }

  if (isneg) n = -n;

  for (;;) {
    if (n & 1) y = y.times(x);
    n >>= 1;
    if (!n) break;
    x = x.times(x);
  }

  return isneg ? one.div(y) : y;
};


/*
 * Return a new Big whose value is the value of this Big rounded to a maximum precision of sd
 * significant digits using rounding mode rm, or Big.RM if rm is not specified.
 *
 * sd {number} Significant digits: integer, 1 to MAX_DP inclusive.
 * rm? {number} Rounding mode: 0 (down), 1 (half-up), 2 (half-even) or 3 (up).
 */
P.prec = function (sd, rm) {
  if (sd !== ~~sd || sd < 1 || sd > MAX_DP) {
    throw Error(INVALID + 'precision');
  }
  return round(new this.constructor(this), sd, rm);
};


/*
 * Return a new Big whose value is the value of this Big rounded to a maximum of dp decimal places
 * using rounding mode rm, or Big.RM if rm is not specified.
 * If dp is negative, round to an integer which is a multiple of 10**-dp.
 * If dp is not specified, round to 0 decimal places.
 *
 * dp? {number} Integer, -MAX_DP to MAX_DP inclusive.
 * rm? {number} Rounding mode: 0 (down), 1 (half-up), 2 (half-even) or 3 (up).
 */
P.round = function (dp, rm) {
  if (dp === UNDEFINED) dp = 0;
  else if (dp !== ~~dp || dp < -MAX_DP || dp > MAX_DP) {
    throw Error(INVALID_DP);
  }
  return round(new this.constructor(this), dp + this.e + 1, rm);
};


/*
 * Return a new Big whose value is the square root of the value of this Big, rounded, if
 * necessary, to a maximum of Big.DP decimal places using rounding mode Big.RM.
 */
P.sqrt = function () {
  var r, c, t,
    x = this,
    Big = x.constructor,
    s = x.s,
    e = x.e,
    half = new Big('0.5');

  // Zero?
  if (!x.c[0]) return new Big(x);

  // Negative?
  if (s < 0) {
    throw Error(NAME + 'No square root');
  }

  // Estimate.
  s = Math.sqrt(+stringify(x, true, true));

  // Math.sqrt underflow/overflow?
  // Re-estimate: pass x coefficient to Math.sqrt as integer, then adjust the result exponent.
  if (s === 0 || s === 1 / 0) {
    c = x.c.join('');
    if (!(c.length + e & 1)) c += '0';
    s = Math.sqrt(c);
    e = ((e + 1) / 2 | 0) - (e < 0 || e & 1);
    r = new Big((s == 1 / 0 ? '5e' : (s = s.toExponential()).slice(0, s.indexOf('e') + 1)) + e);
  } else {
    r = new Big(s + '');
  }

  e = r.e + (Big.DP += 4);

  // Newton-Raphson iteration.
  do {
    t = r;
    r = half.times(t.plus(x.div(t)));
  } while (t.c.slice(0, e).join('') !== r.c.slice(0, e).join(''));

  return round(r, (Big.DP -= 4) + r.e + 1, Big.RM);
};


/*
 * Return a new Big whose value is the value of this Big times the value of Big y.
 */
P.times = P.mul = function (y) {
  var c,
    x = this,
    Big = x.constructor,
    xc = x.c,
    yc = (y = new Big(y)).c,
    a = xc.length,
    b = yc.length,
    i = x.e,
    j = y.e;

  // Determine sign of result.
  y.s = x.s == y.s ? 1 : -1;

  // Return signed 0 if either 0.
  if (!xc[0] || !yc[0]) {
    y.c = [y.e = 0];
    return y;
  }

  // Initialise exponent of result as x.e + y.e.
  y.e = i + j;

  // If array xc has fewer digits than yc, swap xc and yc, and lengths.
  if (a < b) {
    c = xc;
    xc = yc;
    yc = c;
    j = a;
    a = b;
    b = j;
  }

  // Initialise coefficient array of result with zeros.
  for (c = new Array(j = a + b); j--;) c[j] = 0;

  // Multiply.

  // i is initially xc.length.
  for (i = b; i--;) {
    b = 0;

    // a is yc.length.
    for (j = a + i; j > i;) {

      // Current sum of products at this digit position, plus carry.
      b = c[j] + yc[i] * xc[j - i - 1] + b;
      c[j--] = b % 10;

      // carry
      b = b / 10 | 0;
    }

    c[j] = b;
  }

  // Increment result exponent if there is a final carry, otherwise remove leading zero.
  if (b) ++y.e;
  else c.shift();

  // Remove trailing zeros.
  for (i = c.length; !c[--i];) c.pop();
  y.c = c;

  return y;
};


/*
 * Return a string representing the value of this Big in exponential notation rounded to dp fixed
 * decimal places using rounding mode rm, or Big.RM if rm is not specified.
 *
 * dp? {number} Decimal places: integer, 0 to MAX_DP inclusive.
 * rm? {number} Rounding mode: 0 (down), 1 (half-up), 2 (half-even) or 3 (up).
 */
P.toExponential = function (dp, rm) {
  var x = this,
    n = x.c[0];

  if (dp !== UNDEFINED) {
    if (dp !== ~~dp || dp < 0 || dp > MAX_DP) {
      throw Error(INVALID_DP);
    }
    x = round(new x.constructor(x), ++dp, rm);
    for (; x.c.length < dp;) x.c.push(0);
  }

  return stringify(x, true, !!n);
};


/*
 * Return a string representing the value of this Big in normal notation rounded to dp fixed
 * decimal places using rounding mode rm, or Big.RM if rm is not specified.
 *
 * dp? {number} Decimal places: integer, 0 to MAX_DP inclusive.
 * rm? {number} Rounding mode: 0 (down), 1 (half-up), 2 (half-even) or 3 (up).
 *
 * (-0).toFixed(0) is '0', but (-0.1).toFixed(0) is '-0'.
 * (-0).toFixed(1) is '0.0', but (-0.01).toFixed(1) is '-0.0'.
 */
P.toFixed = function (dp, rm) {
  var x = this,
    n = x.c[0];

  if (dp !== UNDEFINED) {
    if (dp !== ~~dp || dp < 0 || dp > MAX_DP) {
      throw Error(INVALID_DP);
    }
    x = round(new x.constructor(x), dp + x.e + 1, rm);

    // x.e may have changed if the value is rounded up.
    for (dp = dp + x.e + 1; x.c.length < dp;) x.c.push(0);
  }

  return stringify(x, false, !!n);
};


/*
 * Return a string representing the value of this Big.
 * Return exponential notation if this Big has a positive exponent equal to or greater than
 * Big.PE, or a negative exponent equal to or less than Big.NE.
 * Omit the sign for negative zero.
 */
P[Symbol.for('nodejs.util.inspect.custom')] = P.toJSON = P.toString = function () {
  var x = this,
    Big = x.constructor;
  return stringify(x, x.e <= Big.NE || x.e >= Big.PE, !!x.c[0]);
};


/*
 * Return the value of this Big as a primitve number.
 */
P.toNumber = function () {
  var n = +stringify(this, true, true);
  if (this.constructor.strict === true && !this.eq(n.toString())) {
    throw Error(NAME + 'Imprecise conversion');
  }
  return n;
};


/*
 * Return a string representing the value of this Big rounded to sd significant digits using
 * rounding mode rm, or Big.RM if rm is not specified.
 * Use exponential notation if sd is less than the number of digits necessary to represent
 * the integer part of the value in normal notation.
 *
 * sd {number} Significant digits: integer, 1 to MAX_DP inclusive.
 * rm? {number} Rounding mode: 0 (down), 1 (half-up), 2 (half-even) or 3 (up).
 */
P.toPrecision = function (sd, rm) {
  var x = this,
    Big = x.constructor,
    n = x.c[0];

  if (sd !== UNDEFINED) {
    if (sd !== ~~sd || sd < 1 || sd > MAX_DP) {
      throw Error(INVALID + 'precision');
    }
    x = round(new Big(x), sd, rm);
    for (; x.c.length < sd;) x.c.push(0);
  }

  return stringify(x, sd <= x.e || x.e <= Big.NE || x.e >= Big.PE, !!n);
};


/*
 * Return a string representing the value of this Big.
 * Return exponential notation if this Big has a positive exponent equal to or greater than
 * Big.PE, or a negative exponent equal to or less than Big.NE.
 * Include the sign for negative zero.
 */
P.valueOf = function () {
  var x = this,
    Big = x.constructor;
  if (Big.strict === true) {
    throw Error(NAME + 'valueOf disallowed');
  }
  return stringify(x, x.e <= Big.NE || x.e >= Big.PE, true);
};


// Export


var Big = _Big_();

const calculatePrettyBalance = (value, decimals = 18, roundOff = true, precision = 0) => {
    const bigDecimalValue = new Big(value.toString());
    const bigDecimalExpo = new Big(Math.pow(10, decimals).toString());
    const calculated = bigDecimalValue.div(bigDecimalExpo);
    if (decimals === 0 || !roundOff) {
        return calculated.toString();
    }
    const decimalFixed = precision || (calculated.lt(100) ? 6 : 2);
    return calculated.toFixed(decimalFixed);
};

const LESS_THAN_ZERO = "0.01";
const ZERO = "0.00";
const currencyMap = {
    USD: "$",
    CAD: "CA$",
    EUR: "€",
    SGD: "S$",
    INR: "₹",
    JPY: "¥",
    VND: "₫",
    CNY: "CN¥",
    KRW: "₩",
    RUB: "₽",
    TRY: "₺",
    NGN: "₦",
    ARS: "ARS",
    AUD: "A$",
    CHF: "CHF",
    GBP: "£",
};
const prettifyCurrency = (value, decimals = 2, currency = "USD", ignoreSmallValue = false, ignoreMinus = true, ignoreZero = false) => {
    let numValue = Number(value);
    let minus = "";
    let currencySuffix = "";
    if (!ignoreMinus && numValue < 0) {
        numValue = Math.abs(numValue);
        minus = "-";
    }
    const currencySymbol = currencyMap[currency] ?? "$";
    if (numValue === 0 || isNaN(numValue)) {
        return ignoreZero
            ? `<${currencySymbol}${LESS_THAN_ZERO}`
            : `${currencySymbol}${ZERO}`;
    }
    if (numValue < 0.01 && ignoreSmallValue) {
        return `<${currencySymbol}${LESS_THAN_ZERO}`;
    }
    if (numValue > 999999999) {
        numValue /= 1000000000;
        currencySuffix = "B";
    }
    else if (numValue > 999999) {
        numValue /= 1000000;
        currencySuffix = "M";
    }
    const factor = Math.pow(10, decimals);
    numValue = Math.floor(numValue * factor) / factor;
    const formatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
        maximumFractionDigits: decimals,
        currencyDisplay: "symbol",
    });
    const formattedValue = formatter
        .format(numValue)
        .replace(new RegExp(`${currency}\\s?`), currencySymbol);
    return minus + formattedValue + currencySuffix;
};

const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];
const timestampParser = (timestamp, type) => {
    const _unix = new Date(timestamp);
    switch (type) {
        case "descriptive": {
            const _minutes = _unix.getMinutes();
            const _hours = _unix.getHours();
            const _seconds = _unix.getSeconds();
            const _parsedSeconds = `${_seconds <= 9 ? "0" : ""}${_seconds}`;
            const _parsedMinutes = `${_minutes <= 9 ? "0" : ""}${_minutes}`;
            const _parsedHours = `${_hours <= 9 ? "0" : ""}${_hours}`;
            return `${months[_unix.getMonth()]} ${_unix.getDate()} ${_unix.getFullYear()} at ${_parsedHours}:${_parsedMinutes}:${_parsedSeconds}`;
        }
        case "DD MMM YY": {
            const day = _unix.getDate().toString().padStart(2, "0");
            const month = months[_unix.getMonth()].substring(0, 3);
            const year = _unix.getFullYear();
            return `${day} ${month} ${year}`;
        }
        case "relative": {
            const currentTime = new Date();
            const unixTime = new Date(_unix);
            const timeDifference = currentTime.getTime() - unixTime.getTime();
            const secondsDifference = Math.floor(timeDifference / 1000);
            const minutesDifference = Math.floor(secondsDifference / 60);
            const hoursDifference = Math.floor(minutesDifference / 60);
            const daysDifference = Math.floor(hoursDifference / 24);
            const monthsDifference = Math.floor(daysDifference / 30);
            const yearsDifference = Math.floor(daysDifference / 365);
            if (yearsDifference > 0) {
                return `${yearsDifference} year${yearsDifference > 1 ? "s" : ""} ago`;
            }
            else if (monthsDifference > 0) {
                return `${monthsDifference} month${monthsDifference > 1 ? "s" : ""} ago`;
            }
            else if (daysDifference > 0) {
                return `${daysDifference} day${daysDifference > 1 ? "s" : ""} ago`;
            }
            else if (hoursDifference > 0) {
                return `${hoursDifference} hour${hoursDifference > 1 ? "s" : ""} ago`;
            }
            else if (minutesDifference > 0) {
                return `${minutesDifference} minute${minutesDifference > 1 ? "s" : ""} ago`;
            }
            else if (secondsDifference > 0) {
                return `${secondsDifference} second${secondsDifference > 1 ? "s" : ""} ago`;
            }
            else {
                return `just now`;
            }
        }
        case "YYYY-MM-DD": {
            const offsetMinutes = _unix.getTimezoneOffset();
            const offsetMilliseconds = offsetMinutes * 60 * 1000;
            const utcTime = _unix.getTime() + offsetMilliseconds;
            const _utc_unix = new Date(utcTime);
            const year = _utc_unix.getFullYear();
            const month = String(_utc_unix.getMonth() + 1).padStart(2, "0");
            const day = String(_utc_unix.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        }
        default: {
            return _unix.toISOString();
        }
    }
};

/**
 * Common enums and types for Streaming API
 */
exports.StreamingChain = void 0;
(function (StreamingChain) {
    StreamingChain["BASE_MAINNET"] = "BASE_MAINNET";
    StreamingChain["SOLANA_MAINNET"] = "SOLANA_MAINNET";
    StreamingChain["SONIC_MAINNET"] = "SONIC_MAINNET";
    StreamingChain["ETH_MAINNET"] = "ETH_MAINNET";
    StreamingChain["BSC_MAINNET"] = "BSC_MAINNET";
    StreamingChain["HYPERCORE_MAINNET"] = "HYPERCORE_MAINNET";
    StreamingChain["HYPEREVM_MAINNET"] = "HYPEREVM_MAINNET";
    StreamingChain["MONAD_MAINNET"] = "MONAD_MAINNET";
    StreamingChain["POLYGON_MAINNET"] = "POLYGON_MAINNET";
    StreamingChain["MEGAETH_MAINNET"] = "MEGAETH_MAINNET";
})(exports.StreamingChain || (exports.StreamingChain = {}));
exports.StreamingInterval = void 0;
(function (StreamingInterval) {
    StreamingInterval["ONE_SECOND"] = "ONE_SECOND";
    StreamingInterval["FIVE_SECONDS"] = "FIVE_SECONDS";
    StreamingInterval["FIFTEEN_SECONDS"] = "FIFTEEN_SECONDS";
    StreamingInterval["ONE_MINUTE"] = "ONE_MINUTE";
    StreamingInterval["FIVE_MINUTES"] = "FIVE_MINUTES";
    StreamingInterval["FIFTEEN_MINUTES"] = "FIFTEEN_MINUTES";
    StreamingInterval["ONE_HOUR"] = "ONE_HOUR";
    StreamingInterval["FOUR_HOURS"] = "FOUR_HOURS";
    StreamingInterval["ONE_DAY"] = "ONE_DAY";
})(exports.StreamingInterval || (exports.StreamingInterval = {}));
exports.StreamingTimeframe = void 0;
(function (StreamingTimeframe) {
    StreamingTimeframe["ONE_MINUTE"] = "ONE_MINUTE";
    StreamingTimeframe["FIVE_MINUTES"] = "FIVE_MINUTES";
    StreamingTimeframe["FIFTEEN_MINUTES"] = "FIFTEEN_MINUTES";
    StreamingTimeframe["ONE_HOUR"] = "ONE_HOUR";
    StreamingTimeframe["FOUR_HOURS"] = "FOUR_HOURS";
    StreamingTimeframe["ONE_DAY"] = "ONE_DAY";
    StreamingTimeframe["SEVEN_DAYS"] = "SEVEN_DAYS";
})(exports.StreamingTimeframe || (exports.StreamingTimeframe = {}));
exports.StreamingProtocol = void 0;
(function (StreamingProtocol) {
    StreamingProtocol["UNISWAP_V2"] = "UNISWAP_V2";
    StreamingProtocol["UNISWAP_V3"] = "UNISWAP_V3";
    StreamingProtocol["VIRTUALS_V2"] = "VIRTUALS_V2";
    StreamingProtocol["CLANKER_V3"] = "CLANKER";
    StreamingProtocol["RAYDIUM_AMM"] = "RAYDIUM_AMM";
    StreamingProtocol["RAYDIUM_CLMM"] = "RAYDIUM_CLMM";
    StreamingProtocol["RAYDIUM_CPMM"] = "RAYDIUM_CPMM";
    StreamingProtocol["PUMP_DOT_FUN"] = "PUMP_DOT_FUN";
    StreamingProtocol["PUMP_FUN_AMM"] = "PUMP_FUN_AMM";
    StreamingProtocol["MOONSHOT"] = "MOONSHOT";
    StreamingProtocol["RAYDIUM_LAUNCH_LAB"] = "RAYDIUM_LAUNCH_LAB";
    StreamingProtocol["METEORA_DAMM"] = "METEORA_DAMM";
    StreamingProtocol["METEORA_DLMM"] = "METEORA_DLMM";
    StreamingProtocol["METEORA_DBC"] = "METEORA_DBC";
    StreamingProtocol["PANCAKESWAP_V2"] = "PANCAKESWAP_V2";
    StreamingProtocol["PANCAKESWAP_V3"] = "PANCAKESWAP_V3";
    StreamingProtocol["SHADOW_V2"] = "SHADOW_V2";
    StreamingProtocol["SHADOW_V3"] = "SHADOW_V3";
    StreamingProtocol["OCTOSWAP_V2"] = "OCTOSWAP_V2";
    StreamingProtocol["OCTOSWAP_V3"] = "OCTOSWAP_V3";
    StreamingProtocol["QUICKSWAP_V2"] = "QUICKSWAP_V2";
    StreamingProtocol["QUICKSWAP_V3"] = "QUICKSWAP_V3";
    StreamingProtocol["SUSHISWAP_V2"] = "SUSHISWAP_V2";
    StreamingProtocol["PROJECT_X"] = "PROJECT_X";
    StreamingProtocol["KUMBAYA_V1"] = "KUMBAYA_V1";
    StreamingProtocol["JOE_V2"] = "JOE_V2";
})(exports.StreamingProtocol || (exports.StreamingProtocol = {}));

exports.GoldRushClient = GoldRushClient;
exports.bigIntParser = bigIntParser;
exports.calculatePrettyBalance = calculatePrettyBalance;
exports.isValidApiKey = isValidApiKey;
exports.prettifyCurrency = prettifyCurrency;
exports.timestampParser = timestampParser;
//# sourceMappingURL=index.js.map
