import { FastifyRequest, FastifyReply } from "fastify";
import {
  ChangeNowService,
  CurrencyOptions,
  EstimatedAmountOptions,
  MinAmountOptions,
  ExchangeRangeOptions,
  NetworkFeeOptions,
  FiatMarketInfoOptions,
  FiatEstimateRequest,
  FiatTransactionRequest,
  RefundExchangeRequest,
  ContinueExchangeRequest,
} from "../services/changenow.service.js";

export class ChangeNowController {
  private changeNowService: ChangeNowService;

  constructor() {
    this.changeNowService = new ChangeNowService();
  }

  /**
   * Get available currencies
   * GET /api/blockhaven/currencies
   */
  async getAvailableCurrencies(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;
      const options: CurrencyOptions = {};

      if (query.active !== undefined) options.active = query.active === "true";
      if (query.flow) options.flow = query.flow;
      if (query.buy !== undefined) options.buy = query.buy === "true";
      if (query.sell !== undefined) options.sell = query.sell === "true";

      const result = await this.changeNowService.getAvailableCurrencies(
        options
      );
      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Error in getAvailableCurrencies:", error);
      return reply.status(500).send({
        success: false,
        error: error.message || "Failed to fetch available currencies",
      });
    }
  }

  /**
   * Get available pairs
   * GET /api/blockhaven/available-pairs
   */
  async getAvailablePairs(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;
      const result = await this.changeNowService.getAvailablePairs(
        query.fromCurrency,
        query.toCurrency,
        query.fromNetwork,
        query.toNetwork,
        query.flow
      );

      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Error in getAvailablePairs:", error);
      return reply.status(500).send({
        success: false,
        error: error.message || "Failed to fetch available pairs",
      });
    }
  }

  /**
   * Get minimal exchange amount
   * GET /api/blockhaven/min-amount
   */
  async getMinimalExchangeAmount(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;

      if (!query.fromCurrency || !query.toCurrency) {
        return reply.status(400).send({
          success: false,
          error: "fromCurrency and toCurrency are required",
        });
      }

      const options: MinAmountOptions = {
        fromNetwork: query.fromNetwork,
        toNetwork: query.toNetwork,
        flow: query.flow,
      };

      const result = await this.changeNowService.getMinimalExchangeAmount(
        query.fromCurrency,
        query.toCurrency,
        options
      );

      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Error in getMinimalExchangeAmount:", error);
      return reply.status(500).send({
        success: false,
        error: error.message || "Failed to fetch minimal exchange amount",
      });
    }
  }

  /**
   * Get estimated exchange amount
   * GET /api/blockhaven/estimated-amount
   */
  async getEstimatedExchangeAmount(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const query = request.query as any;

      if (
        !query.fromCurrency ||
        !query.toCurrency ||
        !query.fromNetwork ||
        !query.toNetwork
      ) {
        return reply.status(400).send({
          success: false,
          error:
            "fromCurrency, toCurrency, fromNetwork, and toNetwork are required",
        });
      }

      // const flow = query.flow || 'standard';

      // Check if the pair is available for the specified flow
      // const pairCheck = await this.exchangeService.checkPairAvailability(
      //     query.fromCurrency,
      //     query.fromNetwork,
      //     query.toCurrency,
      //     query.toNetwork,
      //     flow
      // );
      // if (!pairCheck.available) {
      //     return reply.status(400).send({
      //         success: false,
      //         error: pairCheck.message
      //     });
      // }

      const options: EstimatedAmountOptions = {};

      if (query.fromAmount) options.fromAmount = parseFloat(query.fromAmount);
      if (query.toAmount) options.toAmount = parseFloat(query.toAmount);
      if (query.fromNetwork) options.fromNetwork = query.fromNetwork;
      if (query.toNetwork) options.toNetwork = query.toNetwork;
      if (query.flow) options.flow = query.flow;
      if (query.type) options.type = query.type;
      if (query.useRateId !== undefined)
        options.useRateId = query.useRateId === "true";
      if (query.isTopUp !== undefined)
        options.isTopUp = query.isTopUp === "true";

      const result = await this.changeNowService.getEstimatedExchangeAmount(
        query.fromCurrency,
        query.toCurrency,
        options
      );

      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Error in getEstimatedExchangeAmount:", error);
      return reply.status(500).send({
        success: false,
        error: error.data || "Failed to fetch estimated exchange amount",
      });
    }
  }

  /**
   * Get transaction status
   * GET /api/blockhaven/transaction-status/:id
   */
  async getTransactionStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const params = request.params as any;

      if (!params.id) {
        return reply.status(400).send({
          success: false,
          error: "Transaction ID is required",
        });
      }

      const result = await this.changeNowService.getTransactionStatus(
        params.id
      );

      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Error in getTransactionStatus:", error);
      return reply.status(500).send({
        success: false,
        error: error.message || "Failed to fetch transaction status",
      });
    }
  }

  /**
   * Get user addresses
   * GET /api/blockhaven/addresses-by-name
   */
  async getUserAddresses(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;

      if (!query.name) {
        return reply.status(400).send({
          success: false,
          error: "Name parameter is required",
        });
      }

      const result = await this.changeNowService.getUserAddresses(
        query.name,
        query.apiKey
      );

      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Error in getUserAddresses:", error);
      return reply.status(500).send({
        success: false,
        error: error.message || "Failed to fetch user addresses",
      });
    }
  }

  /**
   * Get estimated network fee
   * GET /api/blockhaven/network-fee
   */
  async getEstimatedNetworkFee(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;

      if (!query.fromCurrency || !query.toCurrency || !query.fromAmount) {
        return reply.status(400).send({
          success: false,
          error: "fromCurrency, toCurrency, and fromAmount are required",
        });
      }

      const options: NetworkFeeOptions = {
        fromNetwork: query.fromNetwork,
        toNetwork: query.toNetwork,
        convertedCurrency: query.convertedCurrency,
        convertedNetwork: query.convertedNetwork,
      };

      const result = await this.changeNowService.getEstimatedNetworkFee(
        query.fromCurrency,
        query.toCurrency,
        parseFloat(query.fromAmount),
        options
      );

      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Error in getEstimatedNetworkFee:", error);
      return reply.status(500).send({
        success: false,
        error: error.message || "Failed to fetch network fee estimate",
      });
    }
  }

  /**
   * Get exchange range
   * GET /api/blockhaven/exchange-range
   */
  async getExchangeRange(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;

      if (!query.fromCurrency || !query.toCurrency) {
        return reply.status(400).send({
          success: false,
          error: "fromCurrency and toCurrency are required",
        });
      }

      const options: ExchangeRangeOptions = {
        fromNetwork: query.fromNetwork,
        toNetwork: query.toNetwork,
        flow: query.flow,
      };

      const result = await this.changeNowService.getExchangeRange(
        query.fromCurrency,
        query.toCurrency,
        options
      );

      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Error in getExchangeRange:", error);
      return reply.status(500).send({
        success: false,
        error: error.message || "Failed to fetch exchange range",
      });
    }
  }

  /**
   * Create fiat transaction
   * POST /api/blockhaven/fiat-transaction
   */
  async createFiatTransaction(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as FiatTransactionRequest;

      if (
        !body.from_currency ||
        !body.from_amount ||
        !body.to_currency ||
        !body.to_amount ||
        !body.to_address
      ) {
        return reply.status(400).send({
          success: false,
          error:
            "from_currency, from_amount, to_currency, to_amount, and to_address are required",
        });
      }

      const result = await this.changeNowService.createFiatTransaction(body);

      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Error in createFiatTransaction:", error);
      return reply.status(500).send({
        success: false,
        error: error.message || "Failed to create fiat transaction",
      });
    }
  }

  /**
   * Get fiat market info
   * GET /api/changenow/fiat-market-info/:fromCurrency/:toCurrency
   */
  async getFiatMarketInfo(request: FastifyRequest, reply: FastifyReply) {
    try {
      const params = request.params as any;
      const query = request.query as any;

      if (!params.fromCurrency || !params.toCurrency) {
        return reply.status(400).send({
          success: false,
          error: "fromCurrency and toCurrency are required",
        });
      }

      const options: FiatMarketInfoOptions = {
        fromNetwork: query.fromNetwork,
        toNetwork: query.toNetwork,
      };

      const result = await this.changeNowService.getFiatMarketInfo(
        params.fromCurrency,
        params.toCurrency,
        options
      );

      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Error in getFiatMarketInfo:", error);
      return reply.status(500).send({
        success: false,
        error: error.message || "Failed to fetch fiat market info",
      });
    }
  }

  /**
   * Get fiat health check
   * GET /api/changenow/fiat-health-check
   */
  async getFiatHealthCheck(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await this.changeNowService.getFiatHealthCheck();

      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Error in getFiatHealthCheck:", error);
      return reply.status(500).send({
        success: false,
        error: error.message || "Failed to fetch fiat health check",
      });
    }
  }

  /**
   * Get exchange actions
   * GET /api/changenow/exchange-actions/:id
   */
  async getExchangeActions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const params = request.params as any;

      if (!params.id) {
        return reply.status(400).send({
          success: false,
          error: "Transaction ID is required",
        });
      }

      const result = await this.changeNowService.getExchangeActions(params.id);

      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Error in getExchangeActions:", error);
      return reply.status(500).send({
        success: false,
        error: error.message || "Failed to fetch exchange actions",
      });
    }
  }

  /**
   * Refund exchange
   * POST /api/changenow/refund
   */
  async refundExchange(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as RefundExchangeRequest;

      if (!body.id || !body.address) {
        return reply.status(400).send({
          success: false,
          error: "id and address are required",
        });
      }

      const result = await this.changeNowService.refundExchange(body);

      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Error in refundExchange:", error);
      return reply.status(500).send({
        success: false,
        error: error.message || "Failed to refund exchange",
      });
    }
  }

  /**
   * Continue exchange
   * POST /api/changenow/continue
   */
  async continueExchange(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as ContinueExchangeRequest;

      if (!body.id) {
        return reply.status(400).send({
          success: false,
          error: "id is required",
        });
      }

      const result = await this.changeNowService.continueExchange(body);

      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Error in continueExchange:", error);
      return reply.status(500).send({
        success: false,
        error: error.message || "Failed to continue exchange",
      });
    }
  }

  /**
   * Get fiat transaction status
   * GET /api/changenow/fiat-transaction-status/:id
   */
  async getFiatTransactionStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const params = request.params as any;

      if (!params.id) {
        return reply.status(400).send({
          success: false,
          error: "Transaction ID is required",
        });
      }

      const result = await this.changeNowService.getFiatTransactionStatus(
        params.id
      );

      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Error in getFiatTransactionStatus:", error);
      return reply.status(500).send({
        success: false,
        error: error.message || "Failed to fetch fiat transaction status",
      });
    }
  }

  /**
   * Get fiat estimate
   * GET /api/changenow/fiat-estimate
   */
  async getFiatEstimate(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;

      if (!query.from_currency || !query.from_amount || !query.to_currency) {
        return reply.status(400).send({
          success: false,
          error: "from_currency, from_amount, and to_currency are required",
        });
      }

      const estimateRequest: FiatEstimateRequest = {
        from_currency: query.from_currency,
        from_amount: parseFloat(query.from_amount),
        to_currency: query.to_currency,
        from_network: query.from_network,
        to_network: query.to_network,
        deposit_type: query.deposit_type,
        payout_type: query.payout_type,
      };

      const result = await this.changeNowService.getFiatEstimate(
        estimateRequest
      );

      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Error in getFiatEstimate:", error);
      return reply.status(500).send({
        success: false,
        error: error.message || "Failed to fetch fiat estimate",
      });
    }
  }

  // ========================= ADDITIONAL ENDPOINTS FROM SAMPLE2 =========================

  /**
   * Validate address
   * GET /api/blockhaven/validate-address
   */
  async validateAddress(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;

      if (!query.currency || !query.address) {
        return reply.status(400).send({
          success: false,
          error: "currency and address are required",
        });
      }

      const result = await this.changeNowService.validateAddress(
        query.currency,
        query.address
      );

      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Error in validateAddress:", error);
      return reply.status(500).send({
        success: false,
        error: error.message || "Failed to validate address",
      });
    }
  }

  /**
   * Get fiat currencies
   * GET /api/blockhaven/fiat-currencies
   */
  async getFiatCurrencies(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await this.changeNowService.getFiatCurrencies();

      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Error in getFiatCurrencies:", error);
      return reply.status(500).send({
        success: false,
        error: error.message || "Failed to fetch fiat currencies",
      });
    }
  }

  /**
   * Get crypto currencies for fiat
   * GET /api/blockhaven/crypto-currencies-for-fiat
   */
  async getCryptoCurrenciesForFiat(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    try {
      const result = await this.changeNowService.getCryptoCurrenciesForFiat();

      return reply.status(200).send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("Error in getCryptoCurrenciesForFiat:", error);
      return reply.status(500).send({
        success: false,
        error: error.message || "Failed to fetch crypto currencies for fiat",
      });
    }
  }
}
