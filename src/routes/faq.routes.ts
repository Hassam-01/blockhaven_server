import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { FaqController } from '../controller/faq.controller.js';
import { AuthMiddleware } from '../middleware/auth.middleware.js';

export async function faqRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  const faqController = new FaqController();
  const authMiddleware = new AuthMiddleware();

  // Public routes (no authentication required)
  
  // GET /api/faqs/public - Get active FAQs for public display
  fastify.get('/public', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          search: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    return faqController.getPublicFaqs(request, reply);
  });

  // GET /api/faqs/search - Search FAQs (public)
  fastify.get('/search', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          keyword: { type: 'string' },
          active_only: { type: 'string', enum: ['true', 'false'] }
        }
      }
    }
  }, async (request, reply) => {
    return faqController.searchFaqs(request, reply);
  });

  // Protected routes (authentication required)

  // GET /api/faqs/:id - Get FAQ by ID
  fastify.get('/:id', {
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      }
    }
  }, async (request, reply) => {
    return faqController.getFaqById(request, reply);
  });

  // Admin-only routes (authentication + admin role required)

  // GET /api/faqs - Get all FAQs (admin only)
  fastify.get('/', {
    preHandler: [
      authMiddleware.authenticate.bind(authMiddleware),
      authMiddleware.requireAdmin.bind(authMiddleware)
    ],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          is_active: { type: 'string', enum: ['true', 'false'] },
          search: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    return faqController.getAllFaqs(request, reply);
  });

  // POST /api/faqs - Create new FAQ (admin only)
  fastify.post('/', {
    preHandler: [
      authMiddleware.authenticate.bind(authMiddleware),
      authMiddleware.requireAdmin.bind(authMiddleware)
    ],
    schema: {
      body: {
        type: 'object',
        required: ['question', 'answer'],
        properties: {
          question: { type: 'string', minLength: 1, maxLength: 1000 },
          answer: { type: 'string', minLength: 1, maxLength: 5000 },
          is_active: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    return faqController.createFaq(request, reply);
  });

  // PUT /api/faqs/:id - Update FAQ (admin only)
  fastify.put('/:id', {
    preHandler: [
      authMiddleware.authenticate.bind(authMiddleware),
      authMiddleware.requireAdmin.bind(authMiddleware)
    ],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      body: {
        type: 'object',
        properties: {
          question: { type: 'string', minLength: 1, maxLength: 1000 },
          answer: { type: 'string', minLength: 1, maxLength: 5000 },
          is_active: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    return faqController.updateFaq(request, reply);
  });

  // DELETE /api/faqs/:id - Delete FAQ (admin only)
  fastify.delete('/:id', {
    preHandler: [
      authMiddleware.authenticate.bind(authMiddleware),
      authMiddleware.requireAdmin.bind(authMiddleware)
    ],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      }
    }
  }, async (request, reply) => {
    return faqController.deleteFaq(request, reply);
  });

  // PATCH /api/faqs/:id/toggle - Toggle FAQ status (admin only)
  fastify.patch('/:id/toggle', {
    preHandler: [
      authMiddleware.authenticate.bind(authMiddleware),
      authMiddleware.requireAdmin.bind(authMiddleware)
    ],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      }
    }
  }, async (request, reply) => {
    return faqController.toggleFaqStatus(request, reply);
  });

  // PATCH /api/faqs/:id/pause - Pause FAQ (admin only)
  fastify.patch('/:id/pause', {
    preHandler: [
      authMiddleware.authenticate.bind(authMiddleware),
      authMiddleware.requireAdmin.bind(authMiddleware)
    ],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      }
    }
  }, async (request, reply) => {
    return faqController.pauseFaq(request, reply);
  });

  // PATCH /api/faqs/:id/activate - Activate FAQ (admin only)
  fastify.patch('/:id/activate', {
    preHandler: [
      authMiddleware.authenticate.bind(authMiddleware),
      authMiddleware.requireAdmin.bind(authMiddleware)
    ],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      }
    }
  }, async (request, reply) => {
    return faqController.activateFaq(request, reply);
  });

  // GET /api/faqs/admin/stats - Get FAQ statistics (admin only)
  fastify.get('/admin/stats', {
    preHandler: [
      authMiddleware.authenticate.bind(authMiddleware),
      authMiddleware.requireAdmin.bind(authMiddleware)
    ]
  }, async (request, reply) => {
    return faqController.getFaqStats(request, reply);
  });

  // POST /api/faqs/bulk/status - Bulk update FAQ status (admin only)
  fastify.post('/bulk/status', {
    preHandler: [
      authMiddleware.authenticate.bind(authMiddleware),
      authMiddleware.requireAdmin.bind(authMiddleware)
    ],
    schema: {
      body: {
        type: 'object',
        required: ['ids', 'is_active'],
        properties: {
          ids: {
            type: 'array',
            items: { type: 'string', format: 'uuid' },
            minItems: 1,
            maxItems: 100
          },
          is_active: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    return faqController.bulkUpdateStatus(request, reply);
  });
}