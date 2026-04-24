import type { ContractMetadata } from "./Generic.types";
/**
 * Common enums and types for Streaming API
 */
export declare enum StreamingChain {
    BASE_MAINNET = "BASE_MAINNET",
    SOLANA_MAINNET = "SOLANA_MAINNET",
    SONIC_MAINNET = "SONIC_MAINNET",
    ETH_MAINNET = "ETH_MAINNET",
    BSC_MAINNET = "BSC_MAINNET",
    HYPERCORE_MAINNET = "HYPERCORE_MAINNET",
    HYPEREVM_MAINNET = "HYPEREVM_MAINNET",
    MONAD_MAINNET = "MONAD_MAINNET",
    POLYGON_MAINNET = "POLYGON_MAINNET",
    MEGAETH_MAINNET = "MEGAETH_MAINNET"
}
export declare enum StreamingInterval {
    ONE_SECOND = "ONE_SECOND",
    FIVE_SECONDS = "FIVE_SECONDS",
    FIFTEEN_SECONDS = "FIFTEEN_SECONDS",
    ONE_MINUTE = "ONE_MINUTE",
    FIVE_MINUTES = "FIVE_MINUTES",
    FIFTEEN_MINUTES = "FIFTEEN_MINUTES",
    ONE_HOUR = "ONE_HOUR",
    FOUR_HOURS = "FOUR_HOURS",
    ONE_DAY = "ONE_DAY"
}
export declare enum StreamingTimeframe {
    ONE_MINUTE = "ONE_MINUTE",
    FIVE_MINUTES = "FIVE_MINUTES",
    FIFTEEN_MINUTES = "FIFTEEN_MINUTES",
    ONE_HOUR = "ONE_HOUR",
    FOUR_HOURS = "FOUR_HOURS",
    ONE_DAY = "ONE_DAY",
    SEVEN_DAYS = "SEVEN_DAYS"
}
export declare enum StreamingProtocol {
    UNISWAP_V2 = "UNISWAP_V2",
    UNISWAP_V3 = "UNISWAP_V3",
    VIRTUALS_V2 = "VIRTUALS_V2",
    CLANKER_V3 = "CLANKER",
    RAYDIUM_AMM = "RAYDIUM_AMM",
    RAYDIUM_CLMM = "RAYDIUM_CLMM",
    RAYDIUM_CPMM = "RAYDIUM_CPMM",
    PUMP_DOT_FUN = "PUMP_DOT_FUN",
    PUMP_FUN_AMM = "PUMP_FUN_AMM",
    MOONSHOT = "MOONSHOT",
    RAYDIUM_LAUNCH_LAB = "RAYDIUM_LAUNCH_LAB",
    METEORA_DAMM = "METEORA_DAMM",
    METEORA_DLMM = "METEORA_DLMM",
    METEORA_DBC = "METEORA_DBC",
    PANCAKESWAP_V2 = "PANCAKESWAP_V2",
    PANCAKESWAP_V3 = "PANCAKESWAP_V3",
    SHADOW_V2 = "SHADOW_V2",
    SHADOW_V3 = "SHADOW_V3",
    OCTOSWAP_V2 = "OCTOSWAP_V2",
    OCTOSWAP_V3 = "OCTOSWAP_V3",
    QUICKSWAP_V2 = "QUICKSWAP_V2",
    QUICKSWAP_V3 = "QUICKSWAP_V3",
    SUSHISWAP_V2 = "SUSHISWAP_V2",
    PROJECT_X = "PROJECT_X",
    KUMBAYA_V1 = "KUMBAYA_V1",
    JOE_V2 = "JOE_V2"
}
/**
 * OHLCV Pairs Stream Types
 */
export interface OHLCVPairsStreamParams {
    chain_name: StreamingChain;
    pair_addresses: string[];
    interval: StreamingInterval;
    timeframe: StreamingTimeframe;
    limit?: number;
}
export interface OHLCVPairsStreamResponse {
    chain_name: StreamingChain;
    pair_address: string;
    interval: StreamingInterval;
    timeframe: StreamingTimeframe;
    timestamp: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    volume_usd: number;
    quote_rate: number;
    quote_rate_usd: number;
    base_token: ContractMetadata;
    quote_token: ContractMetadata;
}
/**
 * OHLCV Tokens Stream Types
 */
export interface OHLCVTokensStreamParams {
    chain_name: StreamingChain;
    token_addresses: string[];
    interval: StreamingInterval;
    timeframe: StreamingTimeframe;
    limit?: number;
}
export interface OHLCVTokensStreamResponse {
    chain_name: StreamingChain;
    pair_address: string;
    interval: StreamingInterval;
    timeframe: StreamingTimeframe;
    timestamp: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    volume_usd: number;
    quote_rate: number;
    quote_rate_usd: number;
    base_token: ContractMetadata;
    quote_token: ContractMetadata;
}
/**
 * New DEX Pairs Stream Types
 */
export interface NewPairsStreamParams {
    chain_name: StreamingChain;
    protocols: StreamingProtocol[];
}
export interface MetricValue {
    current_value: number;
    previous_value: number;
    pct_change: number;
}
export interface TimeframeMetrics {
    volume: MetricValue;
    volume_usd: MetricValue;
    buy_volume: MetricValue;
    sell_volume: MetricValue;
    swap_count: MetricValue;
    buy_count: MetricValue;
    sell_count: MetricValue;
    unique_buyers: MetricValue;
    unique_sellers: MetricValue;
    price: MetricValue;
}
export interface NewPairsStreamResponse {
    chain_name: string;
    protocol: string;
    protocol_version: string;
    pair_address: string;
    deployer_address: string;
    tx_hash: string;
    block_signed_at: string;
    liquidity: number;
    supply: number;
    market_cap: number;
    event_name: string;
    quote_rate: number;
    quote_rate_usd: number;
    base_token: ContractMetadata;
    quote_token: ContractMetadata;
    pair: ContractMetadata;
}
/**
 * Update Pairs Stream Types
 */
export interface UpdatePairsStreamParams {
    chain_name: StreamingChain;
    pair_addresses: string[];
}
/**
 * Update Tokens Stream Types
 */
export interface UpdateTokensStreamParams {
    chain_name: StreamingChain;
    token_addresses: string[];
}
export interface UpdatePairsStreamResponse {
    id: string;
    chain_name: string;
    pair_address: string;
    timestamp: string;
    quote_rate: number;
    quote_rate_usd: number;
    market_cap: number;
    liquidity: number;
    sender: string;
    trader: string;
    direction: string;
    base_token: ContractMetadata;
    quote_token: ContractMetadata;
    last_5m: TimeframeMetrics;
    last_1hr: TimeframeMetrics;
    last_6hr: TimeframeMetrics;
    last_24hr: TimeframeMetrics;
}
export type UpdateTokensStreamResponse = UpdatePairsStreamResponse;
/**
 * Wallet Activity Stream Types
 */
export interface WalletActivityStreamParams {
    chain_name: StreamingChain;
    wallet_addresses: string[];
}
export interface WalletActivityLogItem {
    emitter_address: string;
    log_offset: number;
    data: string;
    topics: string[];
}
/**
 * Decoded transaction detail types for wallet activity
 */
export interface TransferTransaction {
    from: string;
    to: string;
    amount: string;
    quote_usd: number;
    quote_rate_usd: number;
    contract_metadata: ContractMetadata;
}
export interface SwapTransaction {
    token_in: string;
    token_out: string;
    amount_in: string;
    amount_out: string;
}
export interface BridgeTransaction {
    type: string;
    typeString: string;
    from: string;
    to: string;
    amount: string;
    quote_usd: number;
    quote_rate_usd: number;
    contract_metadata: ContractMetadata;
}
export interface DepositTransaction {
    from: string;
    to: string;
    amount: string;
    quote_usd: number;
    quote_rate_usd: number;
    contract_metadata: ContractMetadata;
}
export interface WithdrawTransaction {
    from: string;
    to: string;
    amount: string;
    quote_usd: number;
    quote_rate_usd: number;
    contract_metadata: ContractMetadata;
}
export interface ApproveTransaction {
    spender: string;
    amount: string;
    quote_usd: number;
    quote_rate_usd: number;
    contract_metadata: ContractMetadata;
}
export interface ErrorDetails {
    message: string;
}
export type DecodedTransactionDetails = TransferTransaction | SwapTransaction | BridgeTransaction | DepositTransaction | WithdrawTransaction | ApproveTransaction | ErrorDetails;
export interface WalletActivityStreamResponse {
    tx_hash: string;
    from_address: string;
    to_address: string;
    value: number;
    chain_name: string;
    block_signed_at: string;
    block_height: number;
    block_hash: string;
    miner_address: string;
    gas_used: number;
    tx_offset: number;
    successful: boolean;
    decoded_type: string;
    decoded_details?: DecodedTransactionDetails;
    logs: WalletActivityLogItem[];
}
/**
 * Token Search Query Types
 */
export interface TokenSearchParams {
    query: string;
    chain_name?: StreamingChain;
}
export interface TokenSearchResponse {
    pair_address: string;
    chain_name: string;
    quote_rate: number;
    quote_rate_usd: number;
    volume: number;
    volume_usd: number;
    market_cap: number;
    base_token: ContractMetadata;
    quote_token: ContractMetadata;
}
/**
 * Unrealized PnL for Token Query Types
 */
export interface UPnLForTokenParams {
    chain_name: StreamingChain;
    token_address: string;
}
export interface UPnLForTokenResponse {
    token_address: string;
    wallet_address: string;
    volume: string;
    transactions_count: number;
    pnl_realized_usd: number;
    balance: string;
    balance_pretty: string;
    pnl_unrealized_usd: number;
    contract_metadata: ContractMetadata;
}
/**
 * Unrealized PnL for Wallet Query Types
 */
export interface UPnLForWalletParams {
    chain_name: StreamingChain;
    wallet_address: string;
}
export interface UPnLForWalletResponse {
    token_address: string;
    cost_basis: number;
    current_price: number;
    pnl_realized_usd: number | null;
    pnl_unrealized_usd: number;
    net_balance_change: string;
    marketcap_usd: string;
    contract_metadata: ContractMetadata;
}
/**
 * Streaming service configuration
 */
export interface StreamingServiceConfig {
    shouldRetry?: (retries: number) => boolean;
    maxReconnectAttempts?: number;
    onConnecting?: () => void;
    onOpened?: () => void;
    onClosed?: () => void;
    onError?: (error: unknown) => void;
}
/**
 * Stream subscription options
 */
export interface StreamSubscriptionOptions<T = Array<object>> {
    next: (payload: T) => void;
    error?: (error: unknown) => void;
    complete?: () => void;
}
/**
 * Unsubscribe function type
 */
export type UnsubscribeFunction = () => void;
