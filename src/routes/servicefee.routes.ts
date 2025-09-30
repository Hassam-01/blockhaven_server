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

  // Admin-only route - Update service fee configuration
  fastify.put('/', {
    preHandler: [
      authMiddleware.authenticate.bind(authMiddleware),
      authMiddleware.requireAdmin.bind(authMiddleware)
    ],
    schema: {
      body: {
        type: 'object',
        required: ['type', 'percentage'],
        properties: {
          type: { type: 'string', enum: ['fixed-rate', 'floating'] },
          percentage: { type: 'number', minimum: 0, maximum: 100 }
        }
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
        required: ['amount'],
        properties: {
          amount: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    return serviceFeeController.calculateServiceFee(request, reply);
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