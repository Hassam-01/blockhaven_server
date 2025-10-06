import { FastifyRequest, FastifyReply } from "fastify";
import {
  ExchangeService,
  CreateExchangeServiceRequest,
} from "../services/exchange.service.js";

interface CreateExchangeBody {
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
  contactEmail?: string;
  flow?: "standard" | "fixed-rate";
  type?: "direct" | "reverse";
  rateId?: string;
}

interface GetEstimationQuery {
  fromCurrency: string;
  toCurrency: string;
  fromAmount: string;
  fromNetwork?: string;
  toNetwork?: string;
  flow?: "standard" | "fixed-rate";
  type?: "direct" | "reverse";
}

interface ExchangeParams {
  id?: string;
  transactionId?: string;
}

class ExchangeController {
  private exchangeService: ExchangeService;

  constructor() {
    this.exchangeService = new ExchangeService();
  }

  async createExchange(
    request: FastifyRequest<{ Body: CreateExchangeBody }>,
    reply: FastifyReply
  ) {
    try {
      const {
        fromCurrency,
        fromNetwork,
        toCurrency,
        toNetwork,
        fromAmount,
        toAmount,
        address,
        extraId,
        refundAddress,
        refundExtraId,
        contactEmail,
        flow,
        type,
        rateId,
      } = request.body;

      const userIp =
        (request.headers["x-forwarded-for"] as string) ||
        (request.headers["x-real-ip"] as string) ||
        request.ip ||
        request.socket.remoteAddress ||
        "0.0.0.0";

      const userId = (request as any).user?.id?.toString() || null;

      const exchangeData: CreateExchangeServiceRequest = {
        fromCurrency,
        fromNetwork,
        toCurrency,
        toNetwork,
        address,
        flow: flow || "standard",
        type: type || "direct",
        userIp: Array.isArray(userIp) ? userIp[0] : userIp,
        userId,
        fromAmount,
        toAmount,
        extraId,
        refundAddress,
        refundExtraId,
        contactEmail,
        rateId,
      };

      const exchange = await this.exchangeService.createExchange(exchangeData);

      const responseData = {
        id: exchange?.id,
        fromAmount: exchange?.fromAmount,
        toAmount: exchange?.toAmount,
        flow: exchange?.flow,
        type: exchange?.type,
        payinAddress: exchange?.payinAddress,
        payoutAddress: exchange?.payoutAddress,
        payinExtraId: exchange?.payinExtraId,
        payoutExtraId: exchange?.payoutExtraId,
        fromCurrency: exchange?.fromCurrency,
        toCurrency: exchange?.toCurrency,
        fromNetwork: exchange?.fromNetwork,
        toNetwork: exchange?.toNetwork,
        refundAddress: exchange?.refundAddress,
        refundExtraId: exchange?.refundExtraId,
        payoutExtraIdName: exchange?.payoutExtraIdName,
        rateId: exchange?.rateId,
      };

      return reply.status(201).send({
        success: true,
        message: "Exchange transaction created successfully",
        data: responseData,
      });
    } catch (error: any) {
      console.error("Create Exchange Error:", error.message);
      return reply.status(400).send({
        success: false,
        error: "Failed to create exchange transaction",
        details: error.message,
      });
    }
  }

  async getExchange(
    request: FastifyRequest<{ Params: ExchangeParams }>,
    reply: FastifyReply
  ) {
    try {
      const { id, transactionId } = request.params;

      let exchange;
      if (id) {
        exchange = await this.exchangeService.getExchangeById(parseInt(id));
      } else if (transactionId) {
        exchange = await this.exchangeService.getExchangeByTransactionId(
          transactionId
        );
      } else {
        return reply.status(400).send({
          success: false,
          error: "Either id or transactionId is required",
        });
      }

      if (!exchange) {
        return reply.status(404).send({
          success: false,
          error: "Exchange not found",
        });
      }

      return reply.status(200).send({
        success: true,
        message: "Exchange retrieved successfully",
        data: exchange,
      });
    } catch (error: any) {
      console.error("Get Exchange Error:", error.message);
      return reply.status(500).send({
        success: false,
        error: "Failed to get exchange",
        details: error.message,
      });
    }
  }

  async getAllExchanges(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Get authenticated user ID if available
      const userId = (request as any).user?.id?.toString();

      const exchanges = await this.exchangeService.getAllExchanges(userId);

      return reply.status(200).send({
        success: true,
        message: "Exchanges retrieved successfully",
        data: exchanges,
      });
    } catch (error: any) {
      console.error("Get All Exchanges Error:", error.message);
      return reply.status(500).send({
        success: false,
        error: "Failed to get exchanges",
        details: error.message,
      });
    }
  }

  async updateExchangeStatus(
    request: FastifyRequest<{ Params: { transactionId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const { transactionId } = request.params;

      const exchange = await this.exchangeService.updateExchangeStatus(
        transactionId
      );

      return reply.status(200).send({
        success: true,
        message: "Exchange status updated successfully",
        data: exchange,
      });
    } catch (error: any) {
      console.error("Update Exchange Status Error:", error.message);
      return reply.status(500).send({
        success: false,
        error: "Failed to update exchange status",
        details: error.message,
      });
    }
  }

  async getEstimatedAmount(
    request: FastifyRequest<{ Querystring: GetEstimationQuery }>,
    reply: FastifyReply
  ) {
    try {
      const {
        fromCurrency,
        toCurrency,
        fromAmount,
        fromNetwork,
        toNetwork,
        flow = "standard",
        type = "direct",
      } = request.query;

      if (!fromCurrency || !toCurrency || !fromAmount) {
        return reply.status(400).send({
          success: false,
          error: "fromCurrency, toCurrency, and fromAmount are required",
        });
      }

      const estimation = await this.exchangeService.getEstimatedAmount(
        fromCurrency,
        toCurrency,
        fromAmount,
        fromNetwork,
        toNetwork,
        flow,
        type
      );

      return reply.status(200).send({
        success: true,
        message: "Estimated amount retrieved successfully",
        data: estimation,
      });
    } catch (error: any) {
      console.error("Get Estimated Amount Error:", error.message);
      return reply.status(500).send({
        success: false,
        error: "Failed to get estimated amount",
        details: error.message,
      });
    }
  }

  async getAvailableCurrencies(request: FastifyRequest, reply: FastifyReply) {
    try {
      const currencies = await this.exchangeService.getAvailableCurrencies();

      return reply.status(200).send({
        success: true,
        message: "Available currencies retrieved successfully",
        data: currencies,
      });
    } catch (error: any) {
      console.error("Get Available Currencies Error:", error.message);
      return reply.status(500).send({
        success: false,
        error: "Failed to get available currencies",
        details: error.message,
      });
    }
  }
}

export { ExchangeController };
