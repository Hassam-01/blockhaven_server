import axios, { AxiosResponse } from "axios";
import { config } from "dotenv";
import { Repository } from "typeorm";
import { Currencies } from "../entities/currencies.entity";
import { ExchangeService } from "./exchange.service";

config();

// ChangeNow API Types
export interface CurrencyOptions {
  active?: boolean;
  flow?: "standard" | "fixed-rate";
  buy?: boolean;
  sell?: boolean;
}

export interface EstimatedAmountOptions {
  fromAmount?: number;
  toAmount?: number;
  fromNetwork?: string;
  toNetwork?: string;
  flow?: "standard" | "fixed-rate";
  type?: "direct" | "reverse";
  useRateId?: boolean;
  isTopUp?: boolean;
}

export interface MinAmountOptions {
  fromNetwork?: string;
  toNetwork?: string;
  flow?: "standard" | "fixed-rate";
}

export interface ExchangeRangeOptions {
  fromNetwork?: string;
  toNetwork?: string;
  flow?: "standard" | "fixed-rate";
}

export interface NetworkFeeOptions {
  fromNetwork?: string;
  toNetwork?: string;
  convertedCurrency?: string;
  convertedNetwork?: string;
}

export interface FiatMarketInfoOptions {
  fromNetwork?: string;
  toNetwork?: string;
}

export interface FiatEstimateRequest {
  from_currency: string;
  from_amount: number;
  to_currency: string;
  from_network?: string;
  to_network?: string;
  deposit_type?: string;
  payout_type?: string;
}

export interface FiatTransactionRequest {
  from_currency: string;
  from_amount: number;
  to_currency: string;
  to_amount: number;
  to_address: string;
  from_network?: string;
  to_network?: string;
  deposit_type?: string;
  payout_type?: string;
  user_refund_address?: string;
  user_refund_extra_id?: string;
}

export interface RefundExchangeRequest {
  id: string;
  address: string;
  extraId?: string;
}

export interface ContinueExchangeRequest {
  id: string;
}

export interface CreateExchangeRequest {
  fromCurrency: string;
  fromNetwork: string;
  toCurrency: string;
  toNetwork: string;
  fromAmount?: string;
  toAmount?: string;
  address: string;
  extraId?: string;
  refundAddress?: string;
  refundExtraId?: string;
  userId?: string;
  payload?: Record<string, any>;
  contactEmail?: string;
  flow: "standard" | "fixed-rate";
  type?: "direct" | "reverse";
  rateId?: string;
}

export interface CreateExchangeResponse {
  id: string;
  fromAmount: number;
  toAmount: number;
  flow: "standard" | "fixed-rate";
  type: "direct" | "reverse";
  payinAddress: string;
  payoutAddress: string;
  payinExtraId?: string;
  payoutExtraId?: string;
  fromCurrency: string;
  fromNetwork: string;
  toCurrency: string;
  toNetwork: string;
  refundAddress?: string;
  refundExtraId?: string;
  payoutExtraIdName?: string;
  rateId?: string;
}

export interface ExchangeStatusResponse {
  id: string;
  status:
    | "waiting"
    | "confirming"
    | "exchanging"
    | "sending"
    | "finished"
    | "failed"
    | "refunded"
    | "verifying";
  fromAmount: number;
  toAmount: number;
  fromCurrency: string;
  toCurrency: string;
  fromNetwork: string;
  toNetwork: string;
  payinAddress: string;
  payoutAddress: string;
  payinHash?: string;
  payoutHash?: string;
  refundHash?: string;
  validUntil?: string;
  payinExtraId?: string;
  payoutExtraId?: string;
  refundAddress?: string;
  refundExtraId?: string;
}

export interface ExchangeApiError {
  error: string;
  message: string;
}

class ChangeNowService {
  private readonly baseUrl = "https://api.changenow.io/v2";
  private readonly apiKey: string;
  private readonly XapiKey: string;

  private currencyRepo?: Repository<Currencies>;
  private pairsSvc?: ExchangeService;

  constructor() {
    this.apiKey = process.env.CHANGENOW_API_KEY || '';
    this.XapiKey = process.env.X_API_KEY || process.env.CHANGENOW_API_KEY || '';
  }

  private getPairsService(): ExchangeService {
    if (!this.pairsSvc) {
      this.pairsSvc = new ExchangeService();
    }
    return this.pairsSvc;
  }

  // Method to set currency repository for data persistence
  setCurrencyRepository(repo: Repository<Currencies>) {
    this.currencyRepo = repo;
  }

  private getHeaders(useApiKey: boolean = false): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (useApiKey) {
      headers["x-api-key"] = this.XapiKey;
      headers["x-changenow-api-key"] = this.apiKey;
    } else {
      headers["x-changenow-api-key"] = this.apiKey;
    }

    return headers;
  }

  // ========================= EXISTING METHODS =========================

  async createExchange(
    exchangeData: CreateExchangeRequest,
    userIp?: string
  ): Promise<CreateExchangeResponse> {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-changenow-api-key": this.apiKey,
      };

      if (userIp) {
        headers["x-forwarded-for"] = userIp;
      }
      const response = await axios.post<CreateExchangeResponse>(
        `${this.baseUrl}/exchange`,
        exchangeData,
        { headers }
      );
      if (!response.data) {
        throw new Error("Empty response from Exchange API");
      }

      return response.data;
    } catch (error: any) {
      console.error(
        "Exchange API Error:",
        error.response?.data || error.message
      );
      console.error("Exchange API Status:", error.response?.status);
      console.error("Exchange API Headers:", error.response?.headers);

      if (axios.isAxiosError(error) && error.response?.data) {
        const apiError = error.response.data as ExchangeApiError;
        throw new Error(
          `Exchange API Error: ${apiError.message || apiError.error}`
        );
      }

      throw new Error("Failed to create exchange transaction");
    }
  }

  async getExchangeStatus(
    transactionId: string
  ): Promise<ExchangeStatusResponse> {
    try {
      const headers = {
        "x-changenow-api-key": this.apiKey,
      };

      const response = await axios.get<ExchangeStatusResponse>(
        `${this.baseUrl}/exchange/by-id/${transactionId}`,
        { headers }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "Exchange API Error:",
        error.response?.data || error.message
      );

      if (axios.isAxiosError(error) && error.response?.data) {
        const apiError = error.response.data as ExchangeApiError;
        throw new Error(
          `Exchange API Error: ${apiError.message || apiError.error}`
        );
      }

      throw new Error("Failed to get exchange status");
    }
  }

  // ========================= NEW METHODS FROM SAMPLE =========================

  /**
   * 1. Get available currencies
   */
  async getAvailableCurrencies(options: CurrencyOptions = {}) {
    try {
      // Get currencies from database instead of API
      const dbCurrencies = await this.getPairsService().getAvailableCurrencies();

      // Transform DB fields to match ChangNow API response format
      const baseUrl = process.env.API_BASE_URL || "http://localhost:3000";
      const transformedCurrencies = dbCurrencies.map((currency: any) => ({
        ticker: currency.ticker,
        name: currency.name,
        image: currency.image && currency.image.includes("changenow.io") 
          ? `${baseUrl}/api/blockhaven/coin-image/${currency.ticker}`
          : currency.image,
        hasExternalId: currency.has_external_id,
        isExtraIdSupported: currency.is_extra_id_supported,
        isFiat: currency.is_fiat,
        featured: currency.featured,
        isStable: currency.is_stable,
        supportsFixedRate: currency.support_fixed_rate,
        network: currency.network,
        tokenContract: currency.token_contract,
        buy: currency.buy_enabled,
        sell: currency.sell_enabled,
        legacyTicker: currency.legacy_ticker,
        isActive: currency.is_active
      }));

      // Apply filters based on options
      let filteredCurrencies = transformedCurrencies;
      
      if (options.active !== undefined) {
        filteredCurrencies = filteredCurrencies.filter((c: any) => c.isActive === options.active);
      }
      if (options.flow) {
        // For now, include all since DB doesn't have flow-specific filtering
      }
      if (options.buy !== undefined) {
        filteredCurrencies = filteredCurrencies.filter((c: any) => c.buy === options.buy);
      }
      if (options.sell !== undefined) {
        filteredCurrencies = filteredCurrencies.filter((c: any) => c.sell === options.sell);
      }

      return filteredCurrencies;
    } catch (error: any) {
      console.error(
        "Error fetching currencies from database:",
        error.message
      );
      throw error;
    }
  }

  /**
   * 2. Get available pairs
   */
  async getAvailablePairs(
    fromCurrency?: string,
    toCurrency?: string,
    fromNetwork?: string,
    toNetwork?: string,
    flow?: "standard" | "fixed-rate"
  ) {
    try {
      const params = new URLSearchParams();
      if (fromCurrency) params.append("fromCurrency", fromCurrency);
      if (toCurrency) params.append("toCurrency", toCurrency);
      if (fromNetwork) params.append("fromNetwork", fromNetwork);
      if (toNetwork) params.append("toNetwork", toNetwork);
      if (flow) params.append("flow", flow);

      const response: AxiosResponse = await axios.get(
        `${this.baseUrl}/exchange/available-pairs?${params.toString()}`,
        { headers: this.getHeaders(true) }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "Error fetching available pairs:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * 3. Get minimal exchange amount
   */
  async getMinimalExchangeAmount(
    fromCurrency: string,
    toCurrency: string,
    options?: MinAmountOptions
  ) {
    try {
      const params = new URLSearchParams({
        fromCurrency,
        toCurrency,
      });

      if (options?.fromNetwork)
        params.append("fromNetwork", options.fromNetwork);
      if (options?.toNetwork) params.append("toNetwork", options.toNetwork);
      if (options?.flow) params.append("flow", options.flow);

      const response: AxiosResponse = await axios.get(
        `${this.baseUrl}/exchange/min-amount?${params.toString()}`,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "Error fetching minimal exchange amount:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * 4. Get estimated exchange amount
   */
  async getEstimatedExchangeAmount(
    fromCurrency: string,
    toCurrency: string,
    options: EstimatedAmountOptions
  ) {
    try {
      // Automatically set useRateId to true for fixed-rate flow to get rateId
      const modifiedOptions = {
        ...options,
        useRateId: options.flow === "fixed-rate" ? true : options.useRateId,
      };

      const params = new URLSearchParams({ fromCurrency, toCurrency });
      Object.entries(modifiedOptions).forEach(
        ([k, v]) => v !== undefined && params.append(k, String(v))
      );

      const response: AxiosResponse = await axios.get(
        `${this.baseUrl}/exchange/estimated-amount?${params.toString()}`,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "Error fetching estimated exchange amount:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * 5. Get transaction status by ID
   */
  async getTransactionStatus(transactionId: string) {
    try {
      const params = new URLSearchParams({ id: transactionId });

      const response: AxiosResponse = await axios.get(
        `${this.baseUrl}/exchange/by-id?${params.toString()}`,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "Error fetching transaction status:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * 6. Get user addresses
   */
  async getUserAddresses(name: string, apiKey?: string) {
    try {
      const headers = apiKey
        ? { "x-changenow-api-key": apiKey }
        : this.getHeaders();

      const response: AxiosResponse = await axios.get(
        `${this.baseUrl}/addresses-by-name?name=${encodeURIComponent(name)}`,
        { headers }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "Error fetching user addresses:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * 7. Get estimated network fee
   */
  async getEstimatedNetworkFee(
    fromCurrency: string,
    toCurrency: string,
    fromAmount: number,
    options?: NetworkFeeOptions
  ) {
    try {
      const params = new URLSearchParams({
        fromCurrency,
        toCurrency,
        fromAmount: String(fromAmount),
      });

      if (options?.fromNetwork)
        params.append("fromNetwork", options.fromNetwork);
      if (options?.toNetwork) params.append("toNetwork", options.toNetwork);
      if (options?.convertedCurrency)
        params.append("convertedCurrency", options.convertedCurrency);
      if (options?.convertedNetwork)
        params.append("convertedNetwork", options.convertedNetwork);

      const response: AxiosResponse = await axios.get(
        `${this.baseUrl}/exchange/network-fee?${params.toString()}`,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "Error fetching network fee estimate:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * 8. Get exchange range
   */
  async getExchangeRange(
    fromCurrency: string,
    toCurrency: string,
    options?: ExchangeRangeOptions
  ) {
    try {
      const params = new URLSearchParams({
        fromCurrency,
        toCurrency,
      });

      if (options?.fromNetwork)
        params.append("fromNetwork", options.fromNetwork);
      if (options?.toNetwork) params.append("toNetwork", options.toNetwork);
      if (options?.flow) params.append("flow", options.flow);
      const response: AxiosResponse = await axios.get(
        `${this.baseUrl}/exchange/range?${params.toString()}`,
        { headers: this.getHeaders(true) }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "Error fetching exchange range:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * 9. Create fiat transaction
   */
  async createFiatTransaction(request: FiatTransactionRequest) {
    try {
      const response: AxiosResponse = await axios.post(
        `${this.baseUrl}/fiat-transaction`,
        request,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "Error creating fiat transaction:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * 10. Get fiat market info
   */
  async getFiatMarketInfo(
    fromCurrency: string,
    toCurrency: string,
    options?: FiatMarketInfoOptions
  ) {
    try {
      const fromCurrencyWithNetwork = options?.fromNetwork
        ? `${fromCurrency}_${options.fromNetwork}`
        : fromCurrency;
      const toCurrencyWithNetwork = options?.toNetwork
        ? `${toCurrency}_${options.toNetwork}`
        : toCurrency;

      const pair = `${fromCurrencyWithNetwork}-${toCurrencyWithNetwork}`;

      const response: AxiosResponse = await axios.get(
        `${this.baseUrl}/fiat-market-info/min-max-range/${pair}`,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "Error fetching fiat market info:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * 11. Get fiat health check
   */
  async getFiatHealthCheck() {
    try {
      const response: AxiosResponse = await axios.get(
        `${this.baseUrl}/fiat-status`,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "Error fetching fiat health check:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * 12. Get exchange actions
   */
  async getExchangeActions(transactionId: string) {
    try {
      const params = new URLSearchParams({ id: transactionId });

      const response: AxiosResponse = await axios.get(
        `${this.baseUrl}/exchange/actions?${params.toString()}`,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "Error fetching exchange actions:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * 13. Refund exchange
   */
  async refundExchange(request: RefundExchangeRequest) {
    try {
      const response: AxiosResponse = await axios.post(
        `${this.baseUrl}/exchange/refund`,
        {
          id: request.id,
          address: request.address,
          ...(request.extraId && { extraId: request.extraId }),
        },
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "Error refunding exchange:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * 14. Continue exchange
   */
  async continueExchange(request: ContinueExchangeRequest) {
    try {
      const response: AxiosResponse = await axios.post(
        `${this.baseUrl}/exchange/continue`,
        { id: request.id },
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "Error continuing exchange:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * 15. Get fiat transaction status (uses x-api-key)
   */
  async getFiatTransactionStatus(transactionId: string) {
    try {
      const params = new URLSearchParams({ id: transactionId });

      const response: AxiosResponse = await axios.get(
        `${this.baseUrl}/fiat-status?${params.toString()}`,
        { headers: this.getHeaders(true) } // Use x-api-key
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "Error fetching fiat transaction status:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * 16. Get fiat estimate (uses x-api-key)
   */
  async getFiatEstimate(request: FiatEstimateRequest) {
    try {
      const params = new URLSearchParams();
      params.append("from_currency", request.from_currency);
      params.append("from_amount", request.from_amount.toString());
      params.append("to_currency", request.to_currency);

      if (request.from_network)
        params.append("from_network", request.from_network);
      if (request.to_network) params.append("to_network", request.to_network);
      if (request.deposit_type)
        params.append("deposit_type", request.deposit_type);
      if (request.payout_type)
        params.append("payout_type", request.payout_type);

      const response: AxiosResponse = await axios.get(
        `${this.baseUrl}/fiat-estimate?${params.toString()}`,
        { headers: this.getHeaders(true) } // Use x-api-key
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "Error fetching fiat estimate:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  // ========================= ADDITIONAL ENDPOINTS FROM SAMPLE2 =========================

  /**
   * 17. Validate address
   */
  async validateAddress(currency: string, address: string) {
    try {
      const params = new URLSearchParams({
        currency,
        address,
      });

      const response: AxiosResponse = await axios.get(
        `${this.baseUrl}/validate/address?${params.toString()}`
        // Note: This endpoint doesn't require API key according to documentation
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "Error validating address:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * 18. Get fiat currencies
   */
  async getFiatCurrencies() {
    try {
      const response: AxiosResponse = await axios.get(
        `${this.baseUrl}/fiat-currencies/fiat`
        // Note: This endpoint doesn't require API key according to documentation
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "Error fetching fiat currencies:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * 19. Get crypto currencies for fiat
   */
  async getCryptoCurrenciesForFiat() {
    try {
      const response: AxiosResponse = await axios.get(
        `${this.baseUrl}/fiat-currencies/crypto`
        // Note: This endpoint doesn't require API key according to documentation
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "Error fetching crypto currencies for fiat:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  // ========================= LEGACY METHODS (DEPRECATED) =========================

  /**
   * @deprecated Use getAvailableCurrencies() instead
   */
  async getAvailableCurrenciesLegacy(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/exchange/currencies`);

      // Replace ChangeNOW image URLs with our own proxied URLs
      const baseUrl = process.env.API_BASE_URL || "http://localhost:3000";
      const filteredData = response.data.map((currency: any) => {
        if (currency.image && currency.image.includes("changenow.io")) {
          // Replace with our own image proxy URL
          currency.image = `${baseUrl}/api/blockhaven/coin-image/${currency.ticker}`;
        }
        return currency;
      });

      return filteredData;
    } catch (error: any) {
      console.error(
        "Exchange API Error:",
        error.response?.data || error.message
      );
      throw new Error("Failed to get available currencies");
    }
  }

  /**
   * @deprecated Use getEstimatedExchangeAmount() instead
   */
  async getEstimatedAmount(
    fromCurrency: string,
    toCurrency: string,
    fromAmount: string,
    fromNetwork?: string,
    toNetwork?: string,
    flow: "standard" | "fixed-rate" = "standard",
    type: "direct" | "reverse" = "direct"
  ): Promise<any> {
    try {
      const params = new URLSearchParams({
        fromCurrency,
        toCurrency,
        fromAmount,
        flow,
        type,
      });

      if (fromNetwork) params.append("fromNetwork", fromNetwork);
      if (toNetwork) params.append("toNetwork", toNetwork);

      const response = await axios.get(
        `${this.baseUrl}/exchange/estimated-amount?${params}`
      );
      return response.data;
    } catch (error: any) {
      console.error(
        "Exchange API Error:",
        error.response?.data || error.message
      );
      throw new Error("Failed to get estimated amount");
    }
  }

  /**
   * Fetch currencies from ChangeNOW API and store in database
   */
  async fetchAndStoreCurrencies(): Promise<void> {
    try {
      console.log("Fetching currencies from ChangeNOW API009...");
      const response = await axios.get(`${this.baseUrl}/exchange/currencies`, {
        headers: this.getHeaders(),
      });

      const apiCurrencies = response.data;
      console.log(`Fetched ${apiCurrencies.length} currencies from API`);

      if (!this.currencyRepo) {
        throw new Error("Currency repository not set");
      }

      // Get existing currencies
      const existingCurrencies = await this.currencyRepo.find();
      const existingMap = new Map<string, Currencies>();
      existingCurrencies.forEach((c) => {
        const key = `${c.ticker}:${c.network}`;
        existingMap.set(key, c);
      });

      const currenciesToSave: Currencies[] = [];
      const currenciesToUpdate: Currencies[] = [];

      for (const apiCurrency of apiCurrencies) {
        const key = `${apiCurrency.ticker}:${apiCurrency.network || ''}`;
        const existing = existingMap.get(key);

        // Log image information for debugging
        console.log(`Currency ${apiCurrency.ticker}: image = ${apiCurrency.image}, has image: ${!!apiCurrency.image}`);

        if (!existing) {
          // Create new currency
          const newCurrency = new Currencies();
          newCurrency.ticker = apiCurrency.ticker;
          newCurrency.name = apiCurrency.name;
          newCurrency.image = apiCurrency.image;
          console.log(`Setting image for ${apiCurrency.ticker} to: ${newCurrency.image}`);
          newCurrency.has_external_id = apiCurrency.hasExternalId || false;
          newCurrency.is_extra_id_supported = apiCurrency.isExtraIdSupported || false;
          newCurrency.is_fiat = apiCurrency.isFiat || false;
          newCurrency.featured = apiCurrency.featured || false;
          newCurrency.is_stable = apiCurrency.isStable || false;
          newCurrency.support_fixed_rate = apiCurrency.supportsFixedRate || false;
          newCurrency.network = apiCurrency.network || '';
          newCurrency.token_contract = apiCurrency.tokenContract || null;
          newCurrency.buy_enabled = apiCurrency.buy || false;
          newCurrency.sell_enabled = apiCurrency.sell || false;
          newCurrency.legacy_ticker = apiCurrency.legacyTicker || null;
          newCurrency.is_active = apiCurrency.isActive !== false; // default true

          currenciesToSave.push(newCurrency);
        } else {
          // Update existing if image is null or different
          let needsUpdate = false;
          if (!existing.image && apiCurrency.image) {
            console.log(`Updating image for existing currency ${apiCurrency.ticker} from null to: ${apiCurrency.image}`);
            existing.image = apiCurrency.image;
            needsUpdate = true;
          }
          // Update other fields if needed
          if (existing.name !== apiCurrency.name) {
            existing.name = apiCurrency.name;
            needsUpdate = true;
          }
          // Add more fields as necessary

          if (needsUpdate) {
            currenciesToUpdate.push(existing);
          }
        }
      }

      if (currenciesToSave.length > 0) {
        await this.currencyRepo.save(currenciesToSave);
        console.log(`Saved ${currenciesToSave.length} new currencies`);
      }

      if (currenciesToUpdate.length > 0) {
        await this.currencyRepo.save(currenciesToUpdate);
        console.log(`Updated ${currenciesToUpdate.length} currencies`);
      }

      console.log("✅ Currencies stored successfully");
    } catch (error: any) {
      console.error("Error fetching and storing currencies:", error.message);
      throw error;
    }
  }
}

export { ChangeNowService };
