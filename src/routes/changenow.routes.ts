import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { ChangeNowController } from '../controller/changenow.controller.js';

export async function changeNowRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  const changeNowController = new ChangeNowController();

  // ========================= CURRENCY AND PAIR ENDPOINTS =========================

  // GET /api/blockhaven/currencies - Get available currencies
  fastify.get('/currencies', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          active: { type: 'boolean' },
          flow: { type: 'string', enum: ['standard', 'fixed-rate'] },
          buy: { type: 'boolean' },
          sell: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    return changeNowController.getAvailableCurrencies(request, reply);
  });

  // GET /api/blockhaven/available-pairs - Get available trading pairs
  fastify.get('/available-pairs', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          fromCurrency: { type: 'string' },
          toCurrency: { type: 'string' },
          fromNetwork: { type: 'string' },
          toNetwork: { type: 'string' },
          flow: { type: 'string', enum: ['standard', 'fixed-rate'] }
        }
      }
    }
  }, async (request, reply) => {
    return changeNowController.getAvailablePairs(request, reply);
  });

  // ========================= AMOUNT AND RATE ENDPOINTS =========================

  // GET /api/blockhaven/min-amount - Get minimal exchange amount
  fastify.get('/min-amount', {
    schema: {
      querystring: {
        type: 'object',
        required: ['fromCurrency', 'toCurrency'],
        properties: {
          fromCurrency: { type: 'string' },
          toCurrency: { type: 'string' },
          fromNetwork: { type: 'string' },
          toNetwork: { type: 'string' },
          flow: { type: 'string', enum: ['standard', 'fixed-rate'] }
        }
      }
    }
  }, async (request, reply) => {
    return changeNowController.getMinimalExchangeAmount(request, reply);
  });

  // GET /api/blockhaven/estimated-amount - Get estimated exchange amount
  fastify.get('/estimated-amount', {
    schema: {
      querystring: {
        type: 'object',
        required: ['fromCurrency', 'toCurrency'],
        properties: {
          fromCurrency: { type: 'string' },
          toCurrency: { type: 'string' },
          fromAmount: { type: 'number' },
          toAmount: { type: 'number' },
          fromNetwork: { type: 'string' },
          toNetwork: { type: 'string' },
          flow: { type: 'string', enum: ['standard', 'fixed-rate'] },
          type: { type: 'string', enum: ['direct', 'reverse'] },
          useRateId: { type: 'boolean' },
          isTopUp: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    return changeNowController.getEstimatedExchangeAmount(request, reply);
  });

  // GET /api/blockhaven/exchange-range - Get exchange range (min/max amounts)
  fastify.get('/exchange-range', {
    schema: {
      querystring: {
        type: 'object',
        required: ['fromCurrency', 'toCurrency'],
        properties: {
          fromCurrency: { type: 'string' },
          toCurrency: { type: 'string' },
          fromNetwork: { type: 'string' },
          toNetwork: { type: 'string' },
          flow: { type: 'string', enum: ['standard', 'fixed-rate'] }
        }
      }
    }
  }, async (request, reply) => {
    return changeNowController.getExchangeRange(request, reply);
  });

  // GET /api/blockhaven/network-fee - Get estimated network fee
  fastify.get('/network-fee', {
    schema: {
      querystring: {
        type: 'object',
        required: ['fromCurrency', 'toCurrency', 'fromAmount'],
        properties: {
          fromCurrency: { type: 'string' },
          toCurrency: { type: 'string' },
          fromAmount: { type: 'number' },
          fromNetwork: { type: 'string' },
          toNetwork: { type: 'string' },
          convertedCurrency: { type: 'string' },
          convertedNetwork: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    return changeNowController.getEstimatedNetworkFee(request, reply);
  });

  // ========================= TRANSACTION STATUS ENDPOINTS =========================

    // GET /api/blockhaven/transactions/:id - Get transaction status
  fastify.get('/transaction-status/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    return changeNowController.getTransactionStatus(request, reply);
  });

  // ========================= ADDRESS ENDPOINTS =========================

  // GET /api/blockhaven/addresses-by-name - Get user addresses by domain name
  fastify.get('/addresses-by-name', {
    schema: {
      querystring: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          apiKey: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    return changeNowController.getUserAddresses(request, reply);
  });

  // ========================= FIAT ENDPOINTS =========================

  // POST /api/blockhaven/fiat-transaction - Create fiat transaction
  fastify.post('/fiat-transaction', {
    schema: {
      body: {
        type: 'object',
        required: ['from_currency', 'from_amount', 'to_currency', 'to_amount', 'to_address'],
        properties: {
          from_currency: { type: 'string' },
          from_amount: { type: 'number' },
          to_currency: { type: 'string' },
          to_amount: { type: 'number' },
          to_address: { type: 'string' },
          from_network: { type: 'string' },
          to_network: { type: 'string' },
          deposit_type: { type: 'string' },
          payout_type: { type: 'string' },
          user_refund_address: { type: 'string' },
          user_refund_extra_id: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    return changeNowController.createFiatTransaction(request, reply);
  });

  // GET /api/blockhaven/fiat-market-info/:fromCurrency/:toCurrency - Get fiat market info
  fastify.get('/fiat-market-info/:fromCurrency/:toCurrency', {
    schema: {
      params: {
        type: 'object',
        required: ['fromCurrency', 'toCurrency'],
        properties: {
          fromCurrency: { type: 'string' },
          toCurrency: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          fromNetwork: { type: 'string' },
          toNetwork: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    return changeNowController.getFiatMarketInfo(request, reply);
  });

  // GET /api/blockhaven/fiat-health-check - Get fiat service health status
  fastify.get('/fiat-health-check', async (request, reply) => {
    return changeNowController.getFiatHealthCheck(request, reply);
  });

  // GET /api/changenow/fiat-transaction-status/:id - Get fiat transaction status
  fastify.get('/fiat-transaction-status/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    return changeNowController.getFiatTransactionStatus(request, reply);
  });

  // GET /api/changenow/fiat-estimate - Get fiat exchange estimate
  fastify.get('/fiat-estimate', {
    schema: {
      querystring: {
        type: 'object',
        required: ['from_currency', 'from_amount', 'to_currency'],
        properties: {
          from_currency: { type: 'string' },
          from_amount: { type: 'number' },
          to_currency: { type: 'string' },
          from_network: { type: 'string' },
          to_network: { type: 'string' },
          deposit_type: { type: 'string' },
          payout_type: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    return changeNowController.getFiatEstimate(request, reply);
  });

  // ========================= EXCHANGE ACTION ENDPOINTS =========================

  // GET /api/changenow/exchange-actions/:id - Get possible exchange actions
  fastify.get('/exchange-actions/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    return changeNowController.getExchangeActions(request, reply);
  });

  // POST /api/changenow/refund - Refund an exchange
  fastify.post('/refund', {
    schema: {
      body: {
        type: 'object',
        required: ['id', 'address'],
        properties: {
          id: { type: 'string' },
          address: { type: 'string' },
          extraId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    return changeNowController.refundExchange(request, reply);
  });

  // POST /api/changenow/continue - Continue a pausable exchange
  fastify.post('/continue', {
    schema: {
      body: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    return changeNowController.continueExchange(request, reply);
  });

  // ========================= ADDITIONAL ENDPOINTS =========================

  // GET /api/blockhaven/validate-address - Validate cryptocurrency address
  fastify.get('/validate-address', {
    schema: {
      querystring: {
        type: 'object',
        required: ['currency', 'address'],
        properties: {
          currency: { type: 'string' },
          address: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    return changeNowController.validateAddress(request, reply);
  });

  // GET /api/blockhaven/fiat-currencies - Get available fiat currencies
  fastify.get('/fiat-currencies', async (request, reply) => {
    return changeNowController.getFiatCurrencies(request, reply);
  });

  // GET /api/blockhaven/crypto-currencies-for-fiat - Get crypto currencies available for fiat exchange
  fastify.get('/crypto-currencies-for-fiat', async (request, reply) => {
    return changeNowController.getCryptoCurrenciesForFiat(request, reply);
  });
}