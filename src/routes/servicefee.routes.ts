import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { ServiceFeeController } from '../controller/servicefee.controller.js';
import { AuthMiddleware } from '../middleware/auth.middleware.js';

export async function serviceFeeRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  const serviceFeeController = new ServiceFeeController();
  const authMiddleware = new AuthMiddleware();

  // Public routes (authentication not required for calculations)
  
  // GET /api/service-fees/current - Get current service fee configuration
  fastify.get('/current', async (request, reply) => {
    return serviceFeeController.getCurrentServiceFee(request, reply);
  });

  // GET /api/service-fees/calculate - Calculate service fee for amount
  fastify.get('/calculate', {
    schema: {
      querystring: {
        type: 'object',
        required: ['amount'],
        properties: {
          amount: { type: 'string', pattern: '^[0-9]+(\\.[0-9]+)?$' }
        }
      }
    }
  }, async (request, reply) => {
    return serviceFeeController.calculateServiceFee(request, reply);
  });

  // GET /api/service-fees/calculate-base - Calculate base amount from total
  fastify.get('/calculate-base', {
    schema: {
      querystring: {
        type: 'object',
        required: ['totalAmount'],
        properties: {
          totalAmount: { type: 'string', pattern: '^[0-9]+(\\.[0-9]+)?$' }
        }
      }
    }
  }, async (request, reply) => {
    return serviceFeeController.calculateBaseAmount(request, reply);
  });

  // Admin-only routes (authentication + admin role required)

  // PUT /api/service-fees - Update service fee configuration
  fastify.put('/', {
    preHandler: [
      authMiddleware.authenticate.bind(authMiddleware),
      authMiddleware.requireAdmin.bind(authMiddleware)
    ],
    schema: {
      body: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['fixed-rate', 'floating'] },
          fee: { type: 'number', minimum: 0, maximum: 100 }
        }
      }
    }
  }, async (request, reply) => {
    return serviceFeeController.updateServiceFee(request, reply);
  });

  // POST /api/service-fees/set-floating - Set floating rate percentage
  fastify.post('/set-floating', {
    preHandler: [
      authMiddleware.authenticate.bind(authMiddleware),
      authMiddleware.requireAdmin.bind(authMiddleware)
    ],
    schema: {
      body: {
        type: 'object',
        required: ['percentage'],
        properties: {
          percentage: { type: 'number', minimum: 0, maximum: 100 }
        }
      }
    }
  }, async (request, reply) => {
    return serviceFeeController.setFloatingRate(request, reply);
  });

  // POST /api/service-fees/set-fixed - Set fixed rate percentage
  fastify.post('/set-fixed', {
    preHandler: [
      authMiddleware.authenticate.bind(authMiddleware),
      authMiddleware.requireAdmin.bind(authMiddleware)
    ],
    schema: {
      body: {
        type: 'object',
        required: ['percentage'],
        properties: {
          percentage: { type: 'number', minimum: 0, maximum: 100 }
        }
      }
    }
  }, async (request, reply) => {
    return serviceFeeController.setFixedRate(request, reply);
  });

  // GET /api/service-fees/history - Get service fee configuration history
  fastify.get('/history', {
    preHandler: [
      authMiddleware.authenticate.bind(authMiddleware),
      authMiddleware.requireAdmin.bind(authMiddleware)
    ]
  }, async (request, reply) => {
    return serviceFeeController.getServiceFeeHistory(request, reply);
  });

  // GET /api/service-fees/stats - Get service fee statistics
  fastify.get('/stats', {
    preHandler: [
      authMiddleware.authenticate.bind(authMiddleware),
      authMiddleware.requireAdmin.bind(authMiddleware)
    ]
  }, async (request, reply) => {
    return serviceFeeController.getServiceFeeStats(request, reply);
  });

  // POST /api/service-fees/reset - Reset to default configuration
  fastify.post('/reset', {
    preHandler: [
      authMiddleware.authenticate.bind(authMiddleware),
      authMiddleware.requireAdmin.bind(authMiddleware)
    ]
  }, async (request, reply) => {
    return serviceFeeController.resetToDefault(request, reply);
  });

  // POST /api/service-fees/validate - Validate service fee configuration
  fastify.post('/validate', {
    preHandler: [
      authMiddleware.authenticate.bind(authMiddleware),
      authMiddleware.requireAdmin.bind(authMiddleware)
    ],
    schema: {
      body: {
        type: 'object',
        required: ['type', 'fee'],
        properties: {
          type: { type: 'string', enum: ['fixed-rate', 'floating'] },
          fee: { type: 'number', minimum: 0, maximum: 100 }
        }
      }
    }
  }, async (request, reply) => {
    return serviceFeeController.validateConfig(request, reply);
  });
}