import { type ChainID, type ChainName, type Nullable, type Quote } from "./Generic.types";
export type ApprovalsResponse = Nullable<{
    /** * The requested address. */
    address: string;
    /** * The timestamp when the response was generated. Useful to show data staleness to users. */
    updated_at: Date;
    /** * The requested quote currency eg: `USD`. */
    quote_currency: Quote;
    /** * The requested chain ID eg: `1`. */
    chain_id: ChainID;
    /** * The requested chain name eg: `eth-mainnet`. */
    chain_name: ChainName;
    /** * List of response items. */
    items: TokensApprovalItem[];
}>;
export type TokensApprovalItem = Nullable<{
    /** * The address for the token that has approvals. */
    token_address: string;
    /** * The name for the token that has approvals. */
    token_address_label: string;
    /** * The ticker symbol for this contract. This field is set by a developer and non-unique across a network. */
    ticker_symbol: string;
    /** * Use contract decimals to format the token balance for display purposes - divide the balance by `10^{contract_decimals}`. */
    contract_decimals: number;
    /** * The contract logo URL. */
    logo_url: string;
    /** * The exchange rate for the requested quote currency. */
    quote_rate: number;
    /** * Wallet balance of the token. */
    balance: bigint;
    /** * Value of the wallet balance of the token. */
    balance_quote: number;
    /** * A prettier version of the quote for rendering purposes. */
    pretty_balance_quote: string;
    /** * Total amount at risk across all spenders. */
    value_at_risk: string;
    /** * Value of total amount at risk across all spenders. */
    value_at_risk_quote: number;
    /** * A prettier version of the quote for rendering purposes. */
    pretty_value_at_risk_quote: string;
    /** * Contracts with non-zero approvals for this token. */
    spenders: TokenSpenderItem[];
}>;
export type TokenSpenderItem = Nullable<{
    /** * The height of the block. */
    block_height: number;
    /** * The offset is the position of the tx in the block. */
    tx_offset: number;
    /** * The offset is the position of the log entry within an event log." */
    log_offset: number;
    /** * The block signed timestamp in UTC. */
    block_signed_at: Date;
    /** * Most recent transaction that updated approval amounts for the token. */
    tx_hash: string;
    /** * Address of the contract with approval for the token. */
    spender_address: string;
    /** * Name of the contract with approval for the token. */
    spender_address_label: string;
    /** * Remaining number of tokens granted to the spender by the approval. */
    allowance: string;
    /** * Value of the remaining allowance specified by the approval. */
    allowance_quote: number;
    /** * A prettier version of the quote for rendering purposes. */
    pretty_allowance_quote: string;
    /** * Amount at risk for spender. */
    value_at_risk: string;
    /** * Value of amount at risk for spender. */
    value_at_risk_quote: number;
    /** * A prettier version of the quote for rendering purposes. */
    pretty_value_at_risk_quote: string;
    risk_factor: string;
}>;
