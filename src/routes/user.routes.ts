import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { UserController } from '../controller/user.controller.js';
import { AuthMiddleware } from '../middleware/auth.middleware.js';

export async function userRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
  const userController = new UserController();
  const authMiddleware = new AuthMiddleware();

  // Public routes (no authentication required)
  
  // POST /api/users/signup - User registration
  fastify.post('/signup', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password', 'first_name', 'last_name'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          first_name: { type: 'string', minLength: 1 },
          last_name: { type: 'string', minLength: 1 },
          user_type: { type: 'string', enum: ['admin', 'customer'] }
        }
      }
    }
  }, async (request, reply) => {
    return userController.signup(request, reply);
  });

  // POST /api/users/login - User login
  fastify.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 1 }
        }
      }
    }
  }, async (request, reply) => {
    return userController.login(request, reply);
  });

  // POST /api/users/forgot-password - Request password reset
  fastify.post('/forgot-password', {
    schema: {
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' }
        }
      }
    }
  }, async (request, reply) => {
    return userController.forgotPassword(request, reply);
  });

  // POST /api/users/reset-password - Reset password with token
  fastify.post('/reset-password', {
    schema: {
      body: {
        type: 'object',
        required: ['token', 'newPassword'],
        properties: {
          token: { type: 'string', minLength: 1 },
          newPassword: { type: 'string', minLength: 6 }
        }
      }
    }
  }, async (request, reply) => {
    return userController.resetPassword(request, reply);
  });

  // Protected routes (authentication required)

  // GET /api/users/profile - Get user profile
  fastify.get('/profile', {
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)]
  }, async (request, reply) => {
    return userController.getProfile(request, reply);
  });

  // PUT /api/users/profile - Update user profile
  fastify.put('/profile', {
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    schema: {
      body: {
        type: 'object',
        properties: {
          first_name: { type: 'string', minLength: 1 },
          last_name: { type: 'string', minLength: 1 },
          email: { type: 'string', format: 'email' }
        }
      }
    }
  }, async (request, reply) => {
    return userController.updateProfile(request, reply);
  });

  // PUT /api/users/password - Update password
  fastify.put('/password', {
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)],
    schema: {
      body: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string', minLength: 1 },
          newPassword: { type: 'string', minLength: 6 }
        }
      }
    }
  }, async (request, reply) => {
    return userController.updatePassword(request, reply);
  });

  // POST /api/users/verify-2fa - Verify two-factor authentication code
  fastify.post('/verify-2fa', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'code', 'pendingToken'],
        properties: {
          email: { type: 'string', format: 'email' },
          code: { type: 'string', minLength: 6, maxLength: 6 },
          pendingToken: { type: 'string', minLength: 1 }
        }
      }
    }
  }, async (request, reply) => {
    return userController.verifyTwoFactor(request, reply);
  });

  // PUT /api/users/enable-2fa - Enable two-factor authentication
  fastify.put('/enable-2fa', {
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)]
  }, async (request, reply) => {
    return userController.enableTwoFactor(request, reply);
  });

  // PUT /api/users/disable-2fa - Disable two-factor authentication
  fastify.put('/disable-2fa', {
    preHandler: [authMiddleware.authenticate.bind(authMiddleware)]
  }, async (request, reply) => {
    return userController.disableTwoFactor(request, reply);
  });
}