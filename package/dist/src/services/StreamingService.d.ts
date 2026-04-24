import { type NewPairsStreamParams, type NewPairsStreamResponse, type OHLCVPairsStreamParams, type OHLCVPairsStreamResponse, type OHLCVTokensStreamParams, type OHLCVTokensStreamResponse, type StreamingServiceConfig, type StreamSubscriptionOptions, type TokenSearchParams, type TokenSearchResponse, type UnsubscribeFunction, type UpdatePairsStreamParams, type UpdatePairsStreamResponse, type UpdateTokensStreamParams, type UpdateTokensStreamResponse, type UPnLForTokenParams, type UPnLForTokenResponse, type UPnLForWalletParams, type UPnLForWalletResponse, type WalletActivityStreamParams, type WalletActivityStreamResponse } from "../utils/types/StreamingService.types";
import { type Client } from "graphql-ws";
/**
 * Streaming API Service
 *
 */
export declare class StreamingService {
    private defaultConfig;
    constructor(apiKey: string, config?: StreamingServiceConfig);
    /**
     * Initialize the streaming connection
     */
    getClient(): Client;
    /**
     * Disconnect from the streaming service
     */
    disconnect(): Promise<void>;
    /**
     * Check if the client is connected
     */
    get isConnected(): boolean;
    /**
     * Subscribe to a custom GraphQL subscription
     * This allows for advanced usage and future extensibility
     *
     * @param query - GraphQL subscription query
     * @param variables - Query variables
     * @param callbacks - Subscription callbacks
     * @returns Unsubscribe function
     */
    rawQuery<T = Array<object>>(query: string, variables: Record<string, unknown>, callbacks: StreamSubscriptionOptions<T>): UnsubscribeFunction;
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
    subscribeToOHLCVPairs(params: OHLCVPairsStreamParams, callbacks: StreamSubscriptionOptions<OHLCVPairsStreamResponse[]>): UnsubscribeFunction;
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
    subscribeToOHLCVTokens(params: OHLCVTokensStreamParams, callbacks: StreamSubscriptionOptions<OHLCVTokensStreamResponse[]>): UnsubscribeFunction;
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
    subscribeToNewPairs(params: NewPairsStreamParams, callbacks: StreamSubscriptionOptions<NewPairsStreamResponse[]>): UnsubscribeFunction;
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
    subscribeToUpdatePairs(params: UpdatePairsStreamParams, callbacks: StreamSubscriptionOptions<UpdatePairsStreamResponse>): UnsubscribeFunction;
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
    subscribeToUpdateTokens(params: UpdateTokensStreamParams, callbacks: StreamSubscriptionOptions<UpdateTokensStreamResponse>): UnsubscribeFunction;
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
    subscribeToWalletActivity(params: WalletActivityStreamParams, callbacks: StreamSubscriptionOptions<WalletActivityStreamResponse[]>): UnsubscribeFunction;
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
    searchToken(params: TokenSearchParams): Promise<TokenSearchResponse[]>;
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
    getUPnLForToken(params: UPnLForTokenParams): Promise<UPnLForTokenResponse[]>;
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
    getUPnLForWallet(params: UPnLForWalletParams): Promise<UPnLForWalletResponse[]>;
}
