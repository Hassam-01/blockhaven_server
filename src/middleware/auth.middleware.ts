import { FastifyRequest, FastifyReply } from 'fastify';
import { UserService } from '../services/user.service.js';

export interface AuthenticatedRequest extends FastifyRequest {
  user: {
    userId: string;
    email: string;
    userType: 'admin' | 'customer';
  };
}

export class AuthMiddleware {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Middleware to authenticate JWT token
   */
  async authenticate(request: FastifyRequest, reply: FastifyReply) {
    try {
      const authHeader = request.headers.authorization;

      if (!authHeader) {
        return reply.status(401).send({
          error: 'No authorization header provided'
        });
      }

      if (!authHeader.startsWith('Bearer ')) {
        return reply.status(401).send({
          error: 'Invalid authorization header format. Use "Bearer <token>"'
        });
      }

      const token = authHeader.substring(7); // Remove "Bearer " prefix

      if (!token) {
        return reply.status(401).send({
          error: 'No token provided'
        });
      }

      // Verify token
      const decoded = this.userService.verifyToken(token);

      // Verify user still exists and is active
      const user = await this.userService.getUserById(decoded.userId);
      if (!user) {
        return reply.status(401).send({
          error: 'User not found'
        });
      }

      if (!user.is_active) {
        return reply.status(401).send({
          error: 'Account is deactivated'
        });
      }

      // Add user info to request object
      (request as any).user = {
        userId: decoded.userId,
        email: decoded.email,
        userType: user.user_type
      };

      // Continue to next handler
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token verification failed';
      
      return reply.status(401).send({
        error: errorMessage
      });
    }
  }

  /**
   * Middleware to check if user is admin
   */
  async requireAdmin(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user?.userId;

      if (!userId) {
        return reply.status(401).send({
          error: 'Unauthorized: User not authenticated'
        });
      }

      const user = await this.userService.getUserById(userId);
      
      if (!user || user.user_type !== 'admin') {
        return reply.status(403).send({
          error: 'Forbidden: Admin access required'
        });
      }

      // Continue to next handler
    } catch (error) {
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  }

  /**
   * Optional authentication - doesn't fail if no token provided
   */
  async optionalAuth(request: FastifyRequest, reply: FastifyReply) {
    try {
      const authHeader = request.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // No token provided, continue without authentication
        return;
      }

      const token = authHeader.substring(7);

      if (!token) {
        return;
      }

      // Verify token
      const decoded = this.userService.verifyToken(token);

      // Verify user still exists and is active
      const user = await this.userService.getUserById(decoded.userId);
      if (user && user.is_active) {
        // Add user info to request object
        (request as any).user = {
          userId: decoded.userId,
          email: decoded.email,
          userType: user.user_type
        };
      }

      // Continue regardless of token validity
    } catch (error) {
      // Continue without authentication if token is invalid
    }
  }
}