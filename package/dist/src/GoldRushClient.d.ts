import { AllChainsService } from "./services/AllChainsService";
import { BalanceService } from "./services/BalanceService";
import { BaseService } from "./services/BaseService";
import { BitcoinService } from "./services/BitcoinService";
import { NftService } from "./services/NftService";
import { PricingService } from "./services/PricingService";
import { SecurityService } from "./services/SecurityService";
import { StreamingService } from "./services/StreamingService";
import { TransactionService } from "./services/TransactionService";
import { type GoldRushClientSettings } from "./utils/types/Generic.types";
import { type StreamingServiceConfig } from "./utils/types/StreamingService.types";
/**
 * GoldRushClient Class
 */
export declare class GoldRushClient {
    private readonly userAgent;
    AllChainsService: AllChainsService;
    BalanceService: BalanceService;
    BaseService: BaseService;
    BitcoinService: BitcoinService;
    NftService: NftService;
    PricingService: PricingService;
    SecurityService: SecurityService;
    StreamingService: StreamingService;
    TransactionService: TransactionService;
    constructor(apiKey: string, settings?: GoldRushClientSettings, streamingConfig?: StreamingServiceConfig);
}
