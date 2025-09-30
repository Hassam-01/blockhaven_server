import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { TestimonialController } from '../controller/testimonial.controller.js';
import { AuthMiddleware } from '../middleware/auth.middleware.js';

export async function testimonialRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  const testimonialController = new TestimonialController();
  const authMiddleware = new AuthMiddleware();

  // Public routes (no authentication required)
  
  // GET /api/testimonials/public - Get approved testimonials for public display
  fastify.get('/public', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          rating: { type: 'string', pattern: '^[1-5]$' }
        }
      }
    }
  }, async (request, reply) => {
    return testimonialController.getPublicTestimonials(request, reply);
  });

  // Protected routes (authentication required)

  // GET /api/testimonials/my - Get user's own testimonial
  fastify.get('/my', {
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)]
  }, async (request, reply) => {
    return testimonialController.getUserTestimonial(request, reply);
  });

  // POST /api/testimonials - Create new testimonial (logged-in users only)
  fastify.post('/', {
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    schema: {
      body: {
        type: 'object',
        required: ['rating', 'text'],
        properties: {
          rating: { type: 'number', minimum: 1, maximum: 5 },
          text: { type: 'string', minLength: 1, maxLength: 1000 }
        }
      }
    }
  }, async (request, reply) => {
    return testimonialController.createTestimonial(request, reply);
  });

  // PUT /api/testimonials/:id - Update testimonial (user's own or admin)
  fastify.put('/:id', {
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
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
          rating: { type: 'number', minimum: 1, maximum: 5 },
          text: { type: 'string', minLength: 1, maxLength: 1000 },
          is_approved: { type: 'boolean' }
        }
      }
    }
  }, async (request, reply) => {
    return testimonialController.updateTestimonial(request, reply);
  });

  // DELETE /api/testimonials/:id - Delete testimonial (user's own or admin)
  fastify.delete('/:id', {
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
    return testimonialController.deleteTestimonial(request, reply);
  });

  // GET /api/testimonials/:id - Get testimonial by ID (authenticated users)
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
    return testimonialController.getTestimonialById(request, reply);
  });

  // Admin-only routes (authentication + admin role required)

  // GET /api/testimonials - Get all testimonials (admin only)
  fastify.get('/', {
    preHandler: [
      authMiddleware.authenticate.bind(authMiddleware),
      authMiddleware.requireAdmin.bind(authMiddleware)
    ],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          is_approved: { type: 'string', enum: ['true', 'false'] },
          rating: { type: 'string', pattern: '^[1-5]$' },
          userId: { type: 'string', format: 'uuid' }
        }
      }
    }
  }, async (request, reply) => {
    return testimonialController.getAllTestimonials(request, reply);
  });

  // GET /api/testimonials/admin/pending - Get pending testimonials (admin only)
  fastify.get('/admin/pending', {
    preHandler: [
      authMiddleware.authenticate.bind(authMiddleware),
      authMiddleware.requireAdmin.bind(authMiddleware)
    ]
  }, async (request, reply) => {
    return testimonialController.getPendingTestimonials(request, reply);
  });

  // GET /api/testimonials/admin/stats - Get testimonial statistics (admin only)
  fastify.get('/admin/stats', {
    preHandler: [
      authMiddleware.authenticate.bind(authMiddleware),
      authMiddleware.requireAdmin.bind(authMiddleware)
    ]
  }, async (request, reply) => {
    return testimonialController.getTestimonialStats(request, reply);
  });

  // PATCH /api/testimonials/:id/approve - Approve testimonial (admin only)
  fastify.patch('/:id/approve', {
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
    return testimonialController.approveTestimonial(request, reply);
  });

  // PATCH /api/testimonials/:id/reject - Reject testimonial (admin only)
  fastify.patch('/:id/reject', {
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
    return testimonialController.rejectTestimonial(request, reply);
  });

  // POST /api/testimonials/bulk/approve - Bulk approve testimonials (admin only)
  fastify.post('/bulk/approve', {
    preHandler: [
      authMiddleware.authenticate.bind(authMiddleware),
      authMiddleware.requireAdmin.bind(authMiddleware)
    ],
    schema: {
      body: {
        type: 'object',
        required: ['ids'],
        properties: {
          ids: {
            type: 'array',
            items: { type: 'string', format: 'uuid' },
            minItems: 1,
            maxItems: 100
          }
        }
      }
    }
  }, async (request, reply) => {
    return testimonialController.bulkApproveTestimonials(request, reply);
  });

  // POST /api/testimonials/bulk/reject - Bulk reject testimonials (admin only)
  fastify.post('/bulk/reject', {
    preHandler: [
      authMiddleware.authenticate.bind(authMiddleware),
      authMiddleware.requireAdmin.bind(authMiddleware)
    ],
    schema: {
      body: {
        type: 'object',
        required: ['ids'],
        properties: {
          ids: {
            type: 'array',
            items: { type: 'string', format: 'uuid' },
            minItems: 1,
            maxItems: 100
          }
        }
      }
    }
  }, async (request, reply) => {
    return testimonialController.bulkRejectTestimonials(request, reply);
  });
}