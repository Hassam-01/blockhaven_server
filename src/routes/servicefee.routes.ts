import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { ServiceFeeController } from '../controller/servicefee.controller';
import { AuthMiddleware } from '../middleware/auth.middleware.js';

export async function serviceFeeRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  const serviceFeeController = new ServiceFeeController();
  const authMiddleware = new AuthMiddleware();

  // Public route - Get current service fee configuration
  fastify.get('/', async (request, reply) => {
    return serviceFeeController.getCurrentServiceFee(request, reply);
  });

  // Public route - Get all service fee configurations
  fastify.get('/all', async (request, reply) => {
    return serviceFeeController.getAllServiceFees(request, reply);
  });

  // Admin-only route - Update service fee configuration
  fastify.put('/', {
    preHandler: [
      authMiddleware.authenticate.bind(authMiddleware),
      authMiddleware.requireAdmin.bind(authMiddleware)
    ],
    schema: {
      body: {
        type: 'object',
        properties: {
          fixedRateFee: { type: 'number', minimum: 0, maximum: 100 },
          floatingRateFee: { type: 'number', minimum: 0, maximum: 100 }
        },
        additionalProperties: false
      }
    }
  }, async (request, reply) => {
    return serviceFeeController.updateServiceFee(request, reply);
  });

  // Public route - Calculate service fee for a given amount
  fastify.get('/calculate', {
    schema: {
      querystring: {
        type: 'object',
        required: ['amount', 'exchangeType'],
        properties: {
          amount: { type: 'string' },
          exchangeType: { type: 'string', enum: ['fixed-rate', 'floating'] }
        }
      }
    }
  }, async (request, reply) => {
    return serviceFeeController.calculateServiceFee(request, reply);
  });

  // Public route - Get current service fee rates for both exchange types
  fastify.get('/rates', async (request, reply) => {
    return serviceFeeController.getCurrentServiceFeeRates(request, reply);
  });

  // Admin-only route - Get service fee history
  fastify.get('/history', {
    preHandler: [
      authMiddleware.authenticate.bind(authMiddleware),
      authMiddleware.requireAdmin.bind(authMiddleware)
    ]
  }, async (request, reply) => {
    return serviceFeeController.getServiceFeeHistory(request, reply);
  });

  // Admin-only route - Get service fee statistics
  fastify.get('/stats', {
    preHandler: [
      authMiddleware.authenticate.bind(authMiddleware),
      authMiddleware.requireAdmin.bind(authMiddleware)
    ]
  }, async (request, reply) => {
    return serviceFeeController.getServiceFeeStats(request, reply);
  });

  // Admin-only route - Reset service fee to default
  fastify.post('/reset', {
    preHandler: [
      authMiddleware.authenticate.bind(authMiddleware),
      authMiddleware.requireAdmin.bind(authMiddleware)
    ]
  }, async (request, reply) => {
    return serviceFeeController.resetServiceFee(request, reply);
  });
}