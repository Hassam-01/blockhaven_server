import { Repository } from "typeorm";
import { AppDataSource } from "../config/data-source.js";
import { Exchange } from "../entities/exchange.entity.js";
import { ExchangePairs } from "../entities/exchangepairs.entity.js";
import { Currencies } from "../entities/currencies.entity.js";
import {
  ChangeNowService,
  CreateExchangeRequest,
  CreateExchangeResponse,
} from "./changenow.service.js";

export interface CreateExchangeServiceRequest {
  fromCurrency: string;
  fromNetwork: string;
  toCurrency: string;
  toNetwork: string;
  fromAmount?: string | undefined;
  toAmount?: string | undefined;
  address: string;
  extraId?: string | undefined;
  refundAddress?: string | undefined;
  refundExtraId?: string | undefined;
  contactEmail?: string | undefined;
  flow?: "standard" | "fixed-rate";
  type?: "direct" | "reverse";
  rateId?: string | undefined;
  userId?: string | undefined;
  userIp?: string | undefined;
}

class ExchangeService {
  private exchangeRepository: Repository<Exchange>;
  private currencyRepository: Repository<Currencies>;
  private exchangePairsRepository: Repository<ExchangePairs>;
  private changeNowService: ChangeNowService;
  private pairService: ExchangeService;

  constructor() {
    this.exchangeRepository = AppDataSource.getRepository(Exchange);
    this.currencyRepository = AppDataSource.getRepository(Currencies);
    this.exchangePairsRepository = AppDataSource.getRepository(ExchangePairs);
    this.changeNowService = new ChangeNowService();
    // Initialize currency repository in ChangeNowService for data persistence
    this.changeNowService.setCurrencyRepository(this.currencyRepository);
  }

  async createExchange(
    exchangeData: CreateExchangeServiceRequest
  ): Promise<CreateExchangeResponse> {
    let changeNowResponse: CreateExchangeResponse | null = null;

    try {
      // Prepare Exchange API request
      const changeNowRequest: CreateExchangeRequest = {
        fromCurrency: exchangeData.fromCurrency,
        fromNetwork: exchangeData.fromNetwork,
        toCurrency: exchangeData.toCurrency,
        toNetwork: exchangeData.toNetwork,
        address: exchangeData.address,
        flow: exchangeData.flow || "standard",
        type: exchangeData.type || "direct",
      };

      // Add optional fields
      if (exchangeData.fromAmount)
        changeNowRequest.fromAmount = exchangeData.fromAmount;
      if (exchangeData.toAmount)
        changeNowRequest.toAmount = exchangeData.toAmount;
      if (exchangeData.extraId) changeNowRequest.extraId = exchangeData.extraId;
      if (exchangeData.refundAddress)
        changeNowRequest.refundAddress = exchangeData.refundAddress;
      if (exchangeData.refundExtraId)
        changeNowRequest.refundExtraId = exchangeData.refundExtraId;
      if (exchangeData.contactEmail)
        changeNowRequest.contactEmail = exchangeData.contactEmail;
      if (exchangeData.rateId) changeNowRequest.rateId = exchangeData.rateId;
      if (exchangeData.userId) changeNowRequest.userId = exchangeData.userId;

      console.log(
        "Sending request to Exchange API:",
        JSON.stringify(changeNowRequest, null, 2)
      );

      // Call Exchange API
      changeNowResponse = await this.changeNowService.createExchange(
        changeNowRequest,
        exchangeData.userIp
      );

      console.log(
        "Exchange API Response received:",
        JSON.stringify(changeNowResponse, null, 2)
      );
      console.log("Response type:", typeof changeNowResponse);
      console.log("Response keys:", Object.keys(changeNowResponse || {}));

      // Validate the response
      if (!changeNowResponse || !changeNowResponse.id) {
        throw new Error(
          "Invalid response from Exchange API - missing transaction ID"
        );
      }

      if (!changeNowResponse.payinAddress) {
        throw new Error(
          "Invalid response from Exchange API - missing payin address"
        );
      }

      // Save to database (optional - don't let DB errors affect the response)
      try {
        const exchange = new Exchange();
        exchange.transactionId = changeNowResponse.id;
        exchange.fromCurrency = changeNowResponse.fromCurrency;
        exchange.fromNetwork = changeNowResponse.fromNetwork;
        exchange.toCurrency = changeNowResponse.toCurrency;
        exchange.toNetwork = changeNowResponse.toNetwork;
        exchange.fromAmount = changeNowResponse.fromAmount;
        exchange.toAmount = changeNowResponse.toAmount;
        exchange.payinAddress = changeNowResponse.payinAddress;
        exchange.payoutAddress = changeNowResponse.payoutAddress;
        exchange.payinExtraId = changeNowResponse.payinExtraId || null;
        exchange.payoutExtraId = changeNowResponse.payoutExtraId || null;
        exchange.refundAddress = changeNowResponse.refundAddress || null;
        exchange.refundExtraId = changeNowResponse.refundExtraId || null;
        exchange.flow = changeNowResponse.flow;
        exchange.type = changeNowResponse.type;
        exchange.rateId = changeNowResponse.rateId || null;
        exchange.payoutExtraIdName =
          changeNowResponse.payoutExtraIdName || null;
        exchange.contactEmail = exchangeData.contactEmail || null;
        exchange.userId = exchangeData.userId || null;
        exchange.status = "waiting";

        await this.exchangeRepository.save(exchange);
        console.log("Exchange saved to database successfully");
      } catch (dbError: any) {
        console.error("Database save error (non-critical):", dbError.message);
        // Don't throw - continue with Exchange API response
      }

      // Return the ChangeNow response directly
      return changeNowResponse;
    } catch (error: any) {
      console.error("Exchange Service Error:", error.message);
      if (changeNowResponse) {
        console.error(
          "Exchange API Response received:",
          JSON.stringify(changeNowResponse, null, 2)
        );
      }
      console.error("Full error details:", error);
      throw new Error(`Failed to create exchange: ${error.message}`);
    }
  }

  async getExchangeById(id: number): Promise<Exchange | null> {
    try {
      const exchange = await this.exchangeRepository.findOne({ where: { id } });
      return exchange;
    } catch (error: any) {
      console.error("Exchange Service Error:", error.message);
      throw new Error("Failed to get exchange");
    }
  }

  async getExchangeByTransactionId(
    transactionId: string
  ): Promise<Exchange | null> {
    try {
      const exchange = await this.exchangeRepository.findOne({
        where: { transactionId },
      });
      return exchange;
    } catch (error: any) {
      console.error("Exchange Service Error:", error.message);
      throw new Error("Failed to get exchange");
    }
  }

  async getAllExchanges(userId?: string): Promise<Exchange[]> {
    try {
      const whereCondition = userId ? { userId } : {};
      const exchanges = await this.exchangeRepository.find({
        where: whereCondition,
        order: { createdAt: "DESC" },
      });
      return exchanges;
    } catch (error: any) {
      console.error("Exchange Service Error:", error.message);
      throw new Error("Failed to get exchanges");
    }
  }

  async updateExchangeStatus(transactionId: string): Promise<Exchange> {
    try {
      // Get current status from ChangeNow
      const statusResponse = await this.changeNowService.getExchangeStatus(
        transactionId
      );

      // Find exchange in database
      const exchange = await this.exchangeRepository.findOne({
        where: { transactionId },
      });
      if (!exchange) {
        throw new Error("Exchange not found");
      }

      // Update status and other fields that might have changed
      exchange.status = statusResponse.status;
      if (statusResponse.toAmount) exchange.toAmount = statusResponse.toAmount;

      const updatedExchange = await this.exchangeRepository.save(exchange);
      return updatedExchange;
    } catch (error: any) {
      console.error("Exchange Service Error:", error.message);
      throw new Error(`Failed to update exchange status: ${error.message}`);
    }
  }

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
      console.log("test fromNetwork: ", fromNetwork);
      const estimation = await this.changeNowService.getEstimatedAmount(
        fromCurrency,
        toCurrency,
        fromAmount,
        fromNetwork,
        toNetwork,
        flow,
        type
      );
      return estimation;
    } catch (error: any) {
      console.error("Exchange Service Error:", error.message);
      throw new Error(`Failed to get estimated amount: ${error.message}`);
    }
  }

  // TODO
  async getAvailableBlockhavenCurrencies() {
    try {
      const currencies = await this.currencyRepository.find();
      console.log();
      return currencies;
    } catch {
      throw new Error("Failed to get currencies: Exchange Service Error");
    }
  }

  async getAvailableCurrencies(): Promise<any[]> {
    try {
      const currencies = await this.currencyRepository.find();
      // here we will add the currencies in the exchange_pair entity but not in the currencies
      // include currencies that appear in exchange_pairs but are missing from currencies table
      const uniqueTickers = await this.getUniqueCurrencies();
      for (const u of uniqueTickers) {
        const exists = currencies.some(
          (c: any) => c.ticker === u.ticker && c.network === u.network
        );
        if (!exists) {
          // Add a minimal representation for currencies that exist only in exchange_pairs
          currencies.push({
            ticker: u.ticker,
            network: u.network,
            name: u.ticker.toUpperCase(),
            image: null,
            featured: false,
          } as any);
        }
      }

      // Optional: keep result ordered by ticker + network
      currencies.sort((a: any, b: any) => a.ticker.localeCompare(b.ticker));
      return currencies;
    } catch (error: any) {
      console.error("Exchange Service Error:", error.message);
      throw new Error(`Failed to get available currencies: ${error.message}`);
    }
  }

  async fetchAndStoreAvailablePairs(): Promise<void> {
    try {
      console.log(
        "Fetching available pairs and currencies from ChangeNOW API..."
      );

      // First, fetch and store currencies
      console.log("Fetching currencies from ChangeNOW API...");
      try {
        await this.changeNowService.fetchAndStoreCurrencies();
        console.log("✅ Currencies fetched and stored successfully");
      } catch (currencyError: any) {
        console.warn(
          "⚠️ Failed to fetch currencies, continuing with pairs:",
          currencyError.message
        );
      }

      // Get all available pairs from ChangeNOW
      const pairs = await this.changeNowService.getAvailablePairs();

      console.log(`Fetched ${pairs.length} pairs from API`);
      console.log("Sample pair structure:", JSON.stringify(pairs[0], null, 2));

      // Load all existing pairs into memory for faster lookups
      console.log("Loading existing pairs from database...");
      const existingPairs = await this.exchangePairsRepository.find();
      console.log(`Found ${existingPairs.length} existing pairs in database`);

      // Create a map for faster lookups
      const existingPairsMap = new Map<string, ExchangePairs>();
      existingPairs.forEach((pair) => {
        const key = `${pair.from_ticker}:${pair.from_network}:${pair.to_ticker}:${pair.to_network}`;
        existingPairsMap.set(key, pair);
      });

      // Process pairs in batches to avoid memory issues
      const batchSize = 1000;
      let processedCount = 0;
      let newPairsCount = 0;
      let updatedPairsCount = 0;

      for (let i = 0; i < pairs.length; i += batchSize) {
        const batch = pairs.slice(i, i + batchSize);
        console.log(
          `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
            pairs.length / batchSize
          )} (${batch.length} pairs)...`
        );

        const batchResults = await this.processPairsBatch(
          batch,
          existingPairsMap
        );
        newPairsCount += batchResults.new;
        updatedPairsCount += batchResults.updated;
        processedCount += batch.length;
      }

      console.log(`✅ Processing complete!`);
      console.log(`📊 Total pairs processed: ${processedCount}`);
      console.log(`🆕 New pairs added: ${newPairsCount}`);
      console.log(`🔄 Existing pairs updated: ${updatedPairsCount}`);
      console.log("Successfully updated available pairs in database");
    } catch (error: any) {
      console.error("Exchange Service Error:", error.message);
      throw new Error(
        `Failed to fetch and store available pairs: ${error.message}`
      );
    }
  }

  private async processPairsBatch(
    pairs: any[],
    existingPairsMap: Map<string, ExchangePairs>
  ): Promise<{ new: number; updated: number }> {
    const pairsToSave: ExchangePairs[] = [];
    const pairsToUpdate: ExchangePairs[] = [];

    for (const pair of pairs) {
      // Handle different possible API response structures
      const fromCurrency = pair.fromCurrency || pair.from_currency || pair.from;
      const fromNetwork =
        pair.fromNetwork || pair.from_network || pair.network || "";
      const toCurrency = pair.toCurrency || pair.to_currency || pair.to;
      const toNetwork = pair.toNetwork || pair.to_network || pair.network || "";
      const flow = pair.flow || pair.flow_type;
      const flows = pair.flows || (flow ? [flow] : []);

      if (!fromCurrency || !toCurrency) {
        console.warn("Skipping pair with missing currency info:", pair);
        continue;
      }

      const key = `${fromCurrency}:${fromNetwork}:${toCurrency}:${toNetwork}`;
      const existingPair = existingPairsMap.get(key);

      if (!existingPair) {
        const newPair = new ExchangePairs();
        newPair.from_ticker = fromCurrency;
        newPair.from_network = fromNetwork;
        newPair.to_ticker = toCurrency;
        newPair.to_network = toNetwork;
        newPair.flow_standard =
          flows.includes("standard") || flow === "standard" || false;
        newPair.flow_fixed_rate =
          flows.includes("fixed-rate") || flow === "fixed-rate" || false;
        newPair.is_active = true;

        pairsToSave.push(newPair);
        // Add to map to avoid duplicates within this batch
        existingPairsMap.set(key, newPair);
      } else {
        // Update existing pair if needed
        const originalStandard = existingPair.flow_standard;
        const originalFixedRate = existingPair.flow_fixed_rate;

        existingPair.flow_standard =
          flows.includes("standard") ||
          flow === "standard" ||
          existingPair.flow_standard;
        existingPair.flow_fixed_rate =
          flows.includes("fixed-rate") ||
          flow === "fixed-rate" ||
          existingPair.flow_fixed_rate;
        existingPair.is_active = true;

        // Only update if something changed
        if (
          existingPair.flow_standard !== originalStandard ||
          existingPair.flow_fixed_rate !== originalFixedRate
        ) {
          pairsToUpdate.push(existingPair);
        }
      }
    }

    // Save new pairs in batch
    if (pairsToSave.length > 0) {
      await this.exchangePairsRepository.save(pairsToSave);
    }

    // Update existing pairs in batch
    if (pairsToUpdate.length > 0) {
      await this.exchangePairsRepository.save(pairsToUpdate);
    }

    return { new: pairsToSave.length, updated: pairsToUpdate.length };
  }
  async getUniqueCurrencies(): Promise<{ ticker: string; network: string }[]> {
    try {
      const sql = `
            SELECT DISTINCT from_ticker AS ticker, from_network AS network FROM exchange_pairs
            UNION
            SELECT DISTINCT to_ticker AS ticker, to_network AS network FROM exchange_pairs
            ORDER BY ticker, network
        `;

      const rows: { ticker: string; network: string }[] =
        await this.exchangePairsRepository.query(sql);
      return rows.map((r) => ({ ticker: r.ticker, network: r.network }));
    } catch (error: any) {
      console.error("Exchange Service Error:", error.message);
      throw new Error("Failed to get unique currencies");
    }
  }

  async getEnhancedPairs(): Promise<any[]> {
    try {
      const sql = `
        SELECT
          ep.from_ticker,
          ep.from_network,
          fc.name as from_name,
          fc.image as from_image,
          fc.featured as from_featured,
          ep.to_ticker,
          ep.to_network,
          tc.name as to_name,
          tc.image as to_image,
          tc.featured as to_featured,
          ep.flow_standard,
          ep.flow_fixed_rate
        FROM exchange_pairs ep
        LEFT JOIN currencies fc ON ep.from_ticker = fc.ticker AND ep.from_network = fc.network
        LEFT JOIN currencies tc ON ep.to_ticker = tc.ticker AND ep.to_network = tc.network
        WHERE ep.is_active = true
        ORDER BY ep.from_ticker, ep.to_ticker
      `;

      const rows = await this.exchangePairsRepository.query(sql);

      // Transform the data to match the required structure
      const enhancedPairs = rows.map((row: any) => ({
        from: {
          ticker: row.from_ticker,
          network: row.from_network,
          name: row.from_name || row.from_ticker.toUpperCase(),
          image: row.from_image || null,
          featured: row.from_featured || false,
        },
        to: {
          ticker: row.to_ticker,
          network: row.to_network,
          name: row.to_name || row.to_ticker.toUpperCase(),
          image: row.to_image || null,
          featured: row.to_featured || false,
        },
        flow: {
          standard: row.flow_standard || false,
          "fixed-rate": row.flow_fixed_rate || false,
        },
      }));

      return enhancedPairs;
    } catch (error: any) {
      console.error("Exchange Service Error:", error.message);
      throw new Error("Failed to get enhanced pairs");
    }
  }

  async fetchAndStoreCurrencies(): Promise<void> {
    try {
      console.log("Fetching currencies from ChangeNOW API100...");

      // Fetch currencies from ChangeNOW API and store them
      await this.changeNowService.fetchAndStoreCurrencies();

      console.log("✅ Currencies fetched and stored successfully");
    } catch (error: any) {
      console.error("Exchange Service Error:", error.message);
      throw new Error(`Failed to fetch and store currencies: ${error.message}`);
    }
  }
}

export { ExchangeService };
