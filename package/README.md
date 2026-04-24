<div align="center">
  <a href="https://goldrush.dev/"  target="_blank" rel="noopener noreferrer">
    <img alt="GoldRush TS SDK Logo" src="../../repo-static/ts-sdk-banner.png" style="max-width: 100%;"/>
  </a>
</div>

<br/>

<p align="center">
  <a href="https://www.npmjs.com/package/@covalenthq/client-sdk">
    <img src="https://img.shields.io/npm/v/@covalenthq/client-sdk" alt="NPM">
  </a>
  <a href="https://www.npmjs.com/package/@covalenthq/client-sdk">
    <img src="https://img.shields.io/npm/dm/@covalenthq/client-sdk" alt="NPM downloads">
  </a>
  <img src="https://img.shields.io/github/license/covalenthq/goldrush-services-monorepo" alt="Apache-2.0">
</p>

# GoldRush SDK for TypeScript

The GoldRush SDK is the fastest way to integrate the GoldRush API for working with blockchain data. The SDK works with all [supported chains](https://goldrush.dev/chains/) including Mainnets and Testnets.

> Use with [`NodeJS v18`](https://nodejs.org/en) or above for best results.

> The GoldRush API Key is required. You can register for a free key on [GoldRush's website](https://goldrush.dev/platform/apikey)

## Using the SDK

1. Install the dependencies

    ```bash
    npm install @covalenthq/client-sdk
    ```

2. Create a client using the `GoldRushClient`

    ```ts
    import { GoldRushClient, Chains } from "@covalenthq/client-sdk";

    const client = new GoldRushClient("<YOUR_API_KEY>");

    const ApiServices = async () => {
        try {
            const balanceResp =
                await client.BalanceService.getTokenBalancesForWalletAddress(
                    "eth-mainnet",
                    "0xfc43f5f9dd45258b3aff31bdbe6561d97e8b71de"
                );

            if (balanceResp.error) {
                throw balanceResp;
            }

            console.log(balanceResp.data);
        } catch (error) {
            console.error(error);
        }
    };
    ```

    The `GoldRushClient` can be configured with a second object argument, `settings`, and a third argument for `streamingConfig`. The settings offered are
    1. **debug**: A boolean that enables server logs of the API calls, enhanced with the request URL, response time and code, and other settings. It is set as `false` by default.
    2. **threadCount**: A number that sets the number of concurrent requests allowed. It is set as `2` by default.
    3. **enableRetry**: A boolean that enables retrying the API endpoint in case of a `429 - rate limit` error. It is set as `true` by default.
    4. **maxRetries**: A number that sets the number of retries to be made in case of `429 - rate limit` error. To be in effect, it requires `enableRetry` to be enabled. It is set as `2` by default.
    5. **retryDelay**: A number that sets the delay in `ms` for retrying the API endpoint in case of `429 - rate limit` error. To be in effect, it requires `enableRetry` to be enabled. It is set as `1500` by default.
    6. **source**: A string that defines the `source` of the request for better analytics. Predefined values include `"Ponder"`, `"GoldRush"`, and `"Viem"`, but any custom string is accepted.

    The `streamingConfig` is optional and configures the real-time streaming service. The available options are:
    1. **shouldRetry**: A function that determines whether to retry connection based on retry count. Defaults to retry up to 5 times.
    2. **maxReconnectAttempts**: Maximum number of reconnection attempts. Defaults to `5`.
    3. **onConnecting**: Callback function triggered when connecting to the streaming service.
    4. **onOpened**: Callback function triggered when connection is successfully established.
    5. **onClosed**: Callback function triggered when connection is closed.
    6. **onError**: Callback function triggered when an error occurs.

## Features

### 1. Name Resolution

The GoldRush SDK natively resolves the underlying wallet address for the following

1. ENS Domains (e.g. `demo.eth`)
2. Lens Handles (e.g. `demo.lens`)
3. Unstoppable Domains (e.g. `demo.x`)
4. RNS Domains (e.g. `demo.ron`)

### 2. Query Parameters

All the API call arguments have an option to pass `typed objects` as Query parameters.

For example, the following sets the `quoteCurrency` query parameter to `CAD` and the parameter `nft` to `true` for fetching all the token balances, including NFTs, for a wallet address:

```ts
const resp = await client.BalanceService.getTokenBalancesForWalletAddress(
    "eth-mainnet",
    "0xfc43f5f9dd45258b3aff31bdbe6561d97e8b71de",
    {
        quoteCurrency: "CAD",
        nft: true,
    }
);
```

### 3. Exported Types

All the `interface`s used, for arguments, query parameters and responses are also exported from the package which can be used for custom usage.

For example, explicitly typecasting the response

```ts
import {
    GoldRushClient,
    type BalancesResponse,
    type BalanceItem,
} from "@covalenthq/client-sdk";

const resp = await client.BalanceService.getTokenBalancesForWalletAddress(
    "eth-mainnet",
    "0xfc43f5f9dd45258b3aff31bdbe6561d97e8b71de",
    {
        quoteCurrency: "CAD",
        nft: true,
    }
);

const data: BalancesResponse = resp.data;
const items: BalanceItem[] = resp.data.items;
```

### 4. Multiple Chain input formats

The SDK supports the following formats for the chain input:

1. Chain Name (e.g. `eth-mainnet`)
2. Chain ID (e.g. `1`)
3. Chain Name Enum (e.g. `ChainName.ETH_MAINNET`)
4. Chain ID Enum (e.g. `ChainID.ETH_MAINNET`)

### 5. Additional Non-Paginated methods

For paginated responses, the GoldRush API can at max support 100 items per page. However, the GoldRush SDK leverages generators to _seamlessly fetch all items without the user having to deal with pagination_.

For example, the following fetches ALL transactions for `0xfc43f5f9dd45258b3aff31bdbe6561d97e8b71de` on Ethereum:

```ts
import { GoldRushClient } from "@covalenthq/client-sdk";

const ApiServices = async () => {
    const client = new GoldRushClient("<YOUR_API_KEY>");
    try {
        for await (const tx of client.TransactionService.getAllTransactionsForAddress(
            "eth-mainnet",
            "0xfc43f5f9dd45258b3aff31bdbe6561d97e8b71de"
        )) {
            console.log("tx", tx);
        }
    } catch (error) {
        console.log(error.message);
    }
};
```

### 6. Executable pagination functions

Paginated methods have been enhanced with the introduction of `next()` and `prev()` support functions. These functions facilitate a smoother transition for developers navigating through our `links` object, which includes `prev` and `next` fields. Instead of requiring developers to manually extract values from these fields and create JavaScript API fetch calls for the URL values, the new `next()` and `prev()` functions provide a streamlined approach, allowing developers to simulate this behavior more efficiently.

```ts
import { GoldRushClient } from "@covalenthq/client-sdk";

const client = new GoldRushClient("<YOUR_API_KEY>");
const resp = await client.TransactionService.getAllTransactionsForAddressByPage(
    "eth-mainnet",
    "0xfc43f5f9dd45258b3aff31bdbe6561d97e8b71de"
); // assuming resp.data.current_page is 10
if (resp.data !== null) {
    const prevPage = await resp.data.prev(); // will retrieve page 9
    console.log(prevPage.data);
}
```

### 7. Utility Functions

1. **bigIntParser**: Formats input as a `bigint` value. For example

    ```ts
    bigIntParser("-123"); // -123n
    ```

    You can explore more examples [here](./test/unit/bigint-parser.test.ts)

2. **calculatePrettyBalance**: Formats large and raw numbers and bigints to human friendly format. For example

    ```ts
    calculatePrettyBalance(1.5, 3, true, 4); // "0.0015"
    ```

    You can explore more examples [here](./test/unit/calculate-pretty-balance.test.ts)

3. **isValidApiKey**: Checks for the input as a valid GoldRush API Key. For example

    ```ts
    isValidApiKey(cqt_wF123); // false
    ```

    You can explore more examples [here](./test/unit/is-valid-api-key.test.ts)

4. **prettifyCurrency**: Formats large and raw numbers and bigints to human friendly currency format. For example

    ```ts
    prettifyCurrency(89.0, 2, "CAD"); // "CA$89.00"
    ```

    You can explore more examples [here](./test/unit/prettify-currency.test.ts)

5. **timestampParser**: Convert ISO timestamps to various human-readable formats

    ```ts
    timestampParser("2024-10-16T12:39:23.000Z", "descriptive"); // "October 16 2024 at 18:09:23"
    ```

    You can explore more examples [here](./test/unit/timestamp-parser.test.ts)

### 8. Real-time Streaming

The GoldRush SDK now supports real-time streaming of blockchain data via WebSocket connections. This allows you to subscribe to live data feeds for OHLCV (Open, High, Low, Close, Volume) data for trading pairs and tokens, new DEX pair creations, wallet activity, and more.

```ts
import {
    GoldRushClient,
    StreamingChain,
    StreamingInterval,
    StreamingTimeframe,
    StreamingProtocol,
} from "@covalenthq/client-sdk";

const client = new GoldRushClient(
    "<YOUR_API_KEY>",
    {},
    {
        onConnecting: () => console.log("Connecting to streaming service..."),
        onOpened: () => console.log("Connected to streaming service!"),
        onClosed: () => console.log("Disconnected from streaming service"),
        onError: (error) => console.error("Streaming error:", error),
    }
);

// Subscribe to OHLCV data for trading pairs
const unsubscribePairs = client.StreamingService.subscribeToOHLCVPairs(
    {
        chain_name: StreamingChain.BASE_MAINNET,
        pair_addresses: ["0x9c087Eb773291e50CF6c6a90ef0F4500e349B903"],
        interval: StreamingInterval.ONE_MINUTE,
        timeframe: StreamingTimeframe.ONE_HOUR,
    },
    {
        next: (data) => {
            console.log("Received OHLCV pair data:", data);
        },
        error: (error) => {
            console.error("Streaming error:", error);
        },
        complete: () => {
            console.log("Stream completed");
        },
    }
);

// Unsubscribe when done
// unsubscribePairs();

// Disconnect from streaming service when finished
// await client.StreamingService.disconnect();
```

#### Multiple Subscriptions

The SDK uses a singleton WebSocket client internally, allowing you to create multiple subscriptions through the same `GoldRushClient`.

```ts
// Create a single client
const client = new GoldRushClient("<YOUR_API_KEY>");

// Create multiple subscriptions through the same connection
const unsubscribePairs = client.StreamingService.subscribeToOHLCVPairs(
    {
        chain_name: StreamingChain.BASE_MAINNET,
        pair_addresses: ["0x9c087Eb773291e50CF6c6a90ef0F4500e349B903"],
        interval: StreamingInterval.ONE_MINUTE,
        timeframe: StreamingTimeframe.ONE_HOUR,
    },
    {
        next: (data) => console.log("OHLCV Pairs:", data),
    }
);

const unsubscribeTokens = client.StreamingService.subscribeToOHLCVTokens(
    {
        chain_name: StreamingChain.BASE_MAINNET,
        token_addresses: ["0x4B6104755AfB5Da4581B81C552DA3A25608c73B8"],
        interval: StreamingInterval.ONE_MINUTE,
        timeframe: StreamingTimeframe.ONE_HOUR,
    },
    {
        next: (data) => console.log("OHLCV Tokens:", data),
    }
);

const unsubscribeWallet = client.StreamingService.subscribeToWalletActivity(
    {
        chain_name: StreamingChain.BASE_MAINNET,
        wallet_addresses: ["0xbaed383ede0e5d9d72430661f3285daa77e9439f"],
    },
    {
        next: (data) => console.log("Wallet Activity:", data),
    }
);

// Unsubscribe from individual streams when needed
// unsubscribePairs();
// unsubscribeTokens();
// unsubscribeWallet();

// Or disconnect from all streams at once
// await client.StreamingService.disconnect();
```

#### React Integration

For React applications, use the `useEffect` hook to properly manage subscription lifecycle:

```tsx
useEffect(() => {
    const unsubscribe = client.StreamingService.rawQuery(
        `subscription {
        ohlcvCandlesForPair(
          chain_name: BASE_MAINNET
          pair_addresses: ["0x9c087Eb773291e50CF6c6a90ef0F4500e349B903"],
          interval: StreamingInterval.ONE_MINUTE,
          timeframe: StreamingTimeframe.ONE_HOUR,
        ) {
          open
          high
          low
          close
          volume
          quote_rate
          volume_usd
          chain_name
          pair_address
          interval
          timeframe
          timestamp
        }
      }`,
        {},
        {
            next: (data) => console.log("Received streaming data:", data),
            error: (err) => console.error("Subscription error:", err),
            complete: () => console.info("Subscription completed"),
        }
    );

    // Cleanup function - unsubscribe when component unmounts
    return () => {
        unsubscribe();
    };
}, []);
```

#### Raw Queries

You can also use raw GraphQL queries for more streamlined and selective data scenarios:

```ts
const unsubscribeNewPairs = client.StreamingService.rawQuery(
    `subscription {
       newPairs(
         chain_name: BASE_MAINNET,
         protocols: [UNISWAP_V2, UNISWAP_V3]
       ) {
         chain_name
         protocol
         pair_address
         tx_hash
         liquidity
         base_token {
           contract_name
           contract_ticker_symbol
         }
         quote_token {
           contract_name
           contract_ticker_symbol
         }
       }
     }`,
    {},
    {
        next: (data) => console.log("Raw new pairs data:", data),
        error: (error) => console.error("Error:", error),
    }
);

// Raw query for token OHLCV data
const unsubscribeTokenOHLCV = client.StreamingService.rawQuery(
    `subscription {
      ohlcvCandlesForToken(
        chain_name: BASE_MAINNET
        token_addresses: ["0x4B6104755AfB5Da4581B81C552DA3A25608c73B8"]
        interval: ONE_MINUTE
        timeframe: ONE_HOUR
      ) {
        open
        high
        low
        close
        volume
        volume_usd
        quote_rate
        quote_rate_usd
        timestamp
        base_token {
          contract_name
          contract_ticker_symbol
        }
      }
    }`,
    {},
    {
        next: (data) => console.log("Raw token OHLCV data:", data),
        error: (error) => console.error("Error:", error),
    }
);
```

### 9. Standardized (Error) Responses

All the responses are of the same standardized format

```ts
❴
    "data": <object>,
    "error": <boolean>,
    "error_message": <string>,
    "error_code": <number>
❵
```

## Supported Endpoints

The GoldRush SDK provides comprehensive support for all Class A, Class B, and Pricing endpoints that are grouped under the following _Service_ namespaces:

<details>
  <summary>
   1. <strong>All Chains Service</strong>: Access to the data across multiple chains and addresses.
  </summary>

- `getAddressActivity(walletAddress: string, queryParamOpts?: GetAddressActivityQueryParamOpts): Promise<GoldRushResponse<ChainActivityResponse>>`: Commonly used to locate chains which an address is active on with a single API call.
- `getMultiChainMultiAddressTransactions(queryParamOpts?: GetMultiChainMultiAddressTransactionsParamOtps): Promise<GoldRushResponse<MultiChainMultiAddressTransactionsResponse>>`: Fetch paginated transactions for up to 10 EVM addresses and 10 EVM chains with one API call. Useful for building Activity Feeds.
- `getMultiChainBalances(walletAddress: string, queryParamOpts?: GetMultiChainBalanceQueryParamOpts): Promise<GoldRushResponse<MultiChainBalanceResponse>>`: Fetch paginated spot & historical native and token balances for a single address on up to 10 EVM chains with one API call.
      </details>

<details>
  <summary>
    2. <strong>Security Service</strong>: Access to the token approvals API endpoints
  </summary>

- `getApprovals(chainName: Chain, walletAddress: string): Promise<GoldRushResponse<ApprovalsResponse>>`: Commonly used to get a list of approvals across all token contracts categorized by spenders for a wallet's assets.
      </details>

<details>
  <summary>
    3. <strong>Balance Service</strong>: Access to the balances endpoints
  </summary>

- `getTokenBalancesForWalletAddress(chainName: Chain, walletAddress: string, queryParamOpts?: GetTokenBalancesForWalletAddressQueryParamOpts): Promise<GoldRushResponse<BalancesResponse>>`: Commonly used to fetch the native and fungible (ERC20) tokens held by an address. Response includes spot prices and other metadata.
- `getHistoricalTokenBalancesForWalletAddress(chainName: Chain, walletAddress: string, queryParamOpts?: GetHistoricalTokenBalancesForWalletAddressQueryParamOpts): Promise<GoldRushResponse<HistoricalBalancesResponse>>`: Commonly used to fetch the historical native and fungible (ERC20) tokens held by an address at a given block height or date. Response includes daily prices and other metadata.
- `getHistoricalPortfolioForWalletAddress(chainName: Chain, walletAddress: string, queryParamOpts?: GetHistoricalPortfolioForWalletAddressQueryParamOpts): Promise<GoldRushResponse<PortfolioResponse>>`: Commonly used to render a daily portfolio balance for an address broken down by the token. The timeframe is user-configurable, defaults to 30 days.
- `getErc20TransfersForWalletAddress(chainName: Chain, walletAddress: string, queryParamOpts: GetErc20TransfersForWalletAddressQueryParamOpts): AsyncIterable<GoldRushResponse<Erc20TransfersResponse>>`: Commonly used to render the transfer-in and transfer-out of a token along with historical prices from an address. (Paginated)
- `getErc20TransfersForWalletAddressByPage(chainName: Chain, walletAddress: string, queryParamOpts: GetErc20TransfersForWalletAddressQueryParamOpts): Promise<GoldRushResponse<Erc20TransfersResponse>>`: Commonly used to render the transfer-in and transfer-out of a token along with historical prices from an address. (Nonpaginated)
- `getTokenHoldersV2ForTokenAddress(chainName: Chain, tokenAddress: string, queryParamOpts?: GetTokenHoldersV2ForTokenAddressQueryParamOpts): AsyncIterable<GoldRushResponse<TokenHoldersResponse>>`: Used to get a paginated list of current or historical token holders for a specified ERC20 or ERC721 token. (Paginated)
- `getTokenHoldersV2ForTokenAddressByPage(chainName: Chain, tokenAddress: string, queryParamOpts?: GetTokenHoldersV2ForTokenAddressQueryParamOpts): Promise<GoldRushResponse<TokenHoldersResponse>>`: Used to get a paginated list of current or historical token holders for a specified ERC20 or ERC721 token. (Nonpaginated)
- `getNativeTokenBalance(chainName: Chain, walletAddress: string, queryParamOpts?: GetNativeTokenBalanceQueryParamOpts): Promise<GoldRushResponse<TokenBalanceNativeResponse>>`: Lightweight endpoint to just get the native token balance for an EVM address.
      </details>

<details>
  <summary>
    4. <strong>Base Service</strong>: Access to the address activity, log events, chain status, and block retrieval endpoints
  </summary>

- `getBlock(chainName: Chain, blockHeight: string): Promise<GoldRushResponse<BlockResponse>>`: Commonly used to fetch and render a single block for a block explorer.
- `getLogs(chainName: Chain, queryParamOpts?: GetLogsQueryParamOpts): Promise<GoldRushResponse<GetLogsResponse>>`: Commonly used to get all the event logs of the latest block, or for a range of blocks. Includes sender contract metadata as well as decoded logs.
- `getResolvedAddress(chainName: Chain, walletAddress: string): Promise<GoldRushResponse<ResolvedAddress>>`: Commonly used to resolve ENS, RNS and Unstoppable Domains addresses. Only supports the resolution of a registered domain to an address.
- `getBlockHeights(chainName: Chain, startDate: string, endDate: string | "latest", queryParamOpts?: GetBlockHeightsQueryParamOpts): AsyncIterable<GoldRushResponse<BlockHeightsResponse>>`: Commonly used to get all the block heights within a particular date range. Useful for rendering a display where you sort blocks by day. (Paginated)
- `getBlockHeightsByPage(chainName: Chain, startDate: string, endDate: string | "latest", queryParamOpts?: GetBlockHeightsQueryParamOpts): Promise<GoldRushResponse<BlockHeightsResponse>>`: Commonly used to get all the block heights within a particular date range. Useful for rendering a display where you sort blocks by day. (Nonpaginated)
- `getLogEventsByAddress(chainName: Chain, contractAddress: string, queryParamOpts?: GetLogEventsByAddressQueryParamOpts): AsyncIterable<GoldRushResponse<LogEventsByAddressResponse>>`: Commonly used to get all the event logs emitted from a particular contract address. Useful for building dashboards that examine on-chain interactions. (Paginated)
- `getLogEventsByAddressByPage(chainName: Chain, contractAddress: string, queryParamOpts?: GetLogEventsByAddressQueryParamOpts): Promise<GoldRushResponse<LogEventsByAddressResponse>>`: Commonly used to get all the event logs emitted from a particular contract address. Useful for building dashboards that examine on-chain interactions. (Nonpaginated)
- `getLogEventsByTopicHash(chainName: Chain, topicHash: string, queryParamOpts?: GetLogEventsByTopicHashQueryParamOpts): AsyncIterable<GoldRushResponse<LogEventsByTopicHashResponse>>`: Commonly used to get all event logs of the same topic hash across all contracts within a particular chain. Useful for cross-sectional analysis of event logs that are emitted on-chain. (Paginated)
- `getLogEventsByTopicHashByPage(chainName: Chain, topicHash: string, queryParamOpts?: GetLogEventsByTopicHashQueryParamOpts): Promise<GoldRushResponse<LogEventsByTopicHashResponse>>`: Commonly used to get all event logs of the same topic hash across all contracts within a particular chain. Useful for cross-sectional analysis of event logs that are emitted on-chain. (Nonpaginated)
- `getAllChains(): Promise<GoldRushResponse<AllChainsResponse>>`: Commonly used to build internal dashboards for all supported chains on GoldRush.
- `getAllChainStatus(): Promise<GoldRushResponse<AllChainStatusResponse>>`: Commonly used to build internal status dashboards of all supported chains.
- `getGasPrices(chainName: Chain, eventType: "erc20" | "nativetokens" | "uniswapv3", queryParamOpts?: GetGasPricesQueryParamOpts): Promise<GoldRushResponse<GasPricesResponse>>`: Get real-time gas estimates for different transaction speeds on a specific network, enabling users to optimize transaction costs and confirmation times.
      </details>

<details>
  <summary>
    5. <strong>Bitcoin Service</strong>: Access to the Bitcoin wallet endpoints
  </summary>

- `getBitcoinHdWalletBalances(walletAddress: string, queryParamOpts?: GetBitcoinHdWalletBalancesQueryParamOpts): Promise<GoldRushResponse<BitcoinHdWalletBalancesResponse>>`: Commonly used to fetch the historical Bitcoin balance held by an address at a given block height or date. Response includes daily prices and other metadata.
- `getBitcoinNonHdWalletBalances(walletAddress: string, queryParamOpts?: GetBitcoinNonHdWalletBalancesQueryParamOpts): Promise<GoldRushResponse<BalancesResponse>>`: Fetch Bitcoin balance for a non-HD address. Response includes spot prices and other metadata.
- `getTransactionsForBtcAddress(queryParamOpts?: GetTransactionsForBitcoinAddressParamOpts): Promise<GoldRushResponse<BitcoinTransactionResponse>>`: Used to fetch the full transaction history of a Bitcoin non-HD wallet address.
      </details>

<details>
  <summary>
    6. <strong>NFT Service</strong>: Access to the NFT endpoints
  </summary>

- `getNftsForAddress(chainName: Chain, walletAddress: string, queryParamOpts?: GetNftsForAddressQueryParamOpts): Promise<GoldRushResponse<NftAddressBalanceNftResponse>>`: Commonly used to render the NFTs (including ERC721 and ERC1155) held by an address.
- `checkOwnershipInNft(chainName: Chain, walletAddress: string, collectionContract: string, queryParamOpts?: CheckOwnershipInNftQueryParamOpts): Promise<GoldRushResponse<NftOwnershipForCollectionResponse>>`: Commonly used to verify ownership of NFTs (including ERC-721 and ERC-1155) within a collection.
- `checkOwnershipInNftForSpecificTokenId(chainName: Chain, walletAddress: string, collectionContract: string, tokenId: string): Promise<GoldRushResponse<NftOwnershipForCollectionResponse>>`: Commonly used to verify ownership of a specific token (ERC-721 or ERC-1155) within a collection.
      </details>

<details>
  <summary>
    7. <strong>Pricing Service</strong>: Access to the historical token prices endpoint
  </summary>

- `getTokenPrices(chainName: Chain, quoteCurrency: Quote, contractAddress: string, queryParamOpts?: GetTokenPricesQueryParamOpts): Promise<GoldRushResponse<TokenPricesResponse[]>>`: Get the historical prices of one (or many) large cap ERC20 tokens between specified date ranges. Also supports native tokens.
- `getPoolSpotPrices(chainName: Chain, contractAddress: string, queryParamOpts?: PoolSpotPriceQueryParamsOpts): Promise<GoldRushResponse<PoolSpotPricesResponse[]>>`: Get the spot token pair prices for a specified pool contract address. Supports pools on Uniswap V2, V3 and their forks.
      </details>

<details>
  <summary>
   8. <strong>Transaction Service</strong>: Access to the transactions endpoints
  </summary>

- `getAllTransactionsForAddress(chainName: Chain, walletAddress: string, queryParamOpts?: GetAllTransactionsForAddressQueryParamOpts): AsyncIterable<GoldRushResponse<RecentTransactionsResponse>>`: Commonly used to fetch and render the most recent transactions involving an address. Frequently seen in wallet applications. (Paginated)
- `getAllTransactionsForAddressByPage(chainName: Chain, walletAddress: string, queryParamOpts?: GetAllTransactionsForAddressQueryParamOpts): Promise<GoldRushResponse<RecentTransactionsResponse>>`: Commonly used to fetch and render the most recent transactions involving an address. Frequently seen in wallet applications. (Nonpaginated)
- `getPaginatedTransactionsForAddress(chainName: Chain, walletAddress: string, page: number, queryParamOpts?: getPaginatedTransactionsForAddressQueryParamOpts): Promise<GoldRushResponse<TransactionsResponse>>`: Commonly used to fetch the transactions involving an address including the decoded log events in a paginated fashion.
- `getTransaction(chainName: Chain, txHash: string, queryParamOpts?: GetTransactionQueryParamOpts): Promise<GoldRushResponse<TransactionResponse>>`: Used to fetch and render a single transaction including its decoded event logs. For foundational chains, can also retrieve internal transactions, state changes and method ID where available.
- `getTransactionsForBlockByPage(chainName: Chain, blockHeight: number | string | "latest", page: number, queryParamOpts?: getTransactionsForBlockByPageQueryParamOpts): Promise<GoldRushResponse<TransactionsBlockResponse>>`: Commonly used to fetch all transactions including their decoded log events in a block and further flag interesting wallets or transactions.
- `getTransactionsForBlock(chainName: Chain, blockHash: string, queryParamOpts?: getTransactionsForBlockByPageQueryParamOpts): Promise<GoldRushResponse<TransactionsForBlockResponse>>`: Commonly used to fetch all transactions including their decoded log events in a block and further flag interesting wallets or transactions.
- `getTransactionSummary(chainName: Chain, walletAddress: string, queryParamOpts?: GetTransactionSummaryQueryParamOpts): Promise<GoldRushResponse<TransactionsSummaryResponse>>`: Used to fetch the earliest and latest transactions, and the transaction count for a wallet. Also enriched with gas expenditure details and total ERC20 token transfers count.
- `getTimeBucketTransactionsForAddress(chainName: Chain, walletAddress: string, timeBucket: number, queryParamOpts?: GetTimeBucketTransactionsForAddressQueryParamOpts): Promise<GoldRushResponse<TransactionsTimeBucketResponse>>`: Commonly used to fetch all transactions including their decoded log events in a 15-minute time bucket interval.
- `getEarliestTransactionsForAddress(chainName: Chain, walletAddress: string, queryParamOpts?: GetEarliestTransactionsForAddressQueryParamOpts): Promise<GoldRushResponse<EarliestTransactionsForAddressResponse>>`: Commonly used to fetch and render the earliest transactions involving an address. Frequently seen in wallet applications.
      </details>

<details>
  <summary>
   9. <strong>Streaming Service</strong>: Real-time blockchain data streaming via WebSocket connections
  </summary>

- `getClient(): Client`: Get the underlying GraphQL WebSocket client for direct access.
- `isConnected: boolean`: Check the connection status of the streaming service.
- `subscribeToOHLCVPairs(params: OHLCVPairsStreamParams, callbacks: StreamSubscriptionOptions<OHLCVPairsStreamResponse[]>): UnsubscribeFunction`: Subscribe to real-time OHLCV (Open, High, Low, Close, Volume) data for specific trading pairs. Supports multiple chains and configurable intervals and timeframes.
- `subscribeToOHLCVTokens(params: OHLCVTokensStreamParams, callbacks: StreamSubscriptionOptions<OHLCVTokensStreamResponse[]>): UnsubscribeFunction`: Subscribe to real-time OHLCV (Open, High, Low, Close, Volume) data for specific tokens. Tracks token prices across their primary DEX pools with configurable intervals and timeframes.
- `subscribeToWalletActivity(params: WalletActivityStreamParams, callbacks: StreamSubscriptionOptions<WalletActivityStreamResponse[]>): UnsubscribeFunction`: Subscribe to real-time wallet activity including transactions, token transfers, and smart contract interactions. Provides decoded transaction details for swaps, transfers, bridges, deposits, withdrawals, and approvals.
- `subscribeToNewPairs(params: NewPairsStreamParams, callbacks: StreamSubscriptionOptions<NewPairsStreamResponse[]>): UnsubscribeFunction`: Subscribe to real-time notifications when new liquidity pairs are created on supported decentralized exchanges (DEXes). Supports Uniswap V2/V3 across Base, Ethereum, and BSC networks.
- `subscribeToUpdatePairs(params: UpdatePairsStreamParams, callbacks: StreamSubscriptionOptions<UpdatePairsStreamResponse>): UnsubscribeFunction`: Subscribe to real-time updates for specific trading pairs including quote rate, volume, liquidity data, price deltas, and swap counts.
- `rawQuery<T = Array<object>>(query: string, variables: Record<string, unknown>, callbacks: StreamSubscriptionOptions<T>): UnsubscribeFunction`: Execute custom GraphQL subscription queries for advanced streaming scenarios and future extensibility.
- `searchToken(params: TokenSearchParams): Promise<TokenSearchResponse[]>`: Search for tokens by keyword, ticker, or contract address. Optionally filter by chain.
- `getUPnLForToken(params: UPnLForTokenParams): Promise<UPnLForTokenResponse[]>`: Get top trader wallets and their realized/unrealized PnL for a specific token.
- `getUPnLForWallet(params: UPnLForWalletParams): Promise<UPnLForWalletResponse[]>`: Get realized and unrealized PnL for all tokens held by a wallet.
- `disconnect(): Promise<void>`: Properly disconnect from the streaming service.

</details>

## Contributing

Contributions, issues and feature requests are welcome!
Feel free to check [issues](https://github.com/covalenthq/goldrush-services-monorepo/issues) page.

## Show your support

Give a ⭐️ if this project helped you!

## License

This project is [Apache-2.0](./LICENSE) licensed.
