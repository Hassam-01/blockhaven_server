import { FastifyRequest, FastifyReply } from 'fastify';
import { UserService, SignupData, LoginData, UpdatePasswordData } from '../services/user.service.js';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * User signup endpoint
   */
  async signup(request: FastifyRequest, reply: FastifyReply) {
    try {
      const signupData = request.body as SignupData;

      // Basic validation
      if (!signupData.email || !signupData.password || !signupData.first_name || !signupData.last_name) {
        return reply.status(400).send({
          error: 'Missing required fields: email, password, first_name, last_name'
        });
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(signupData.email)) {
        return reply.status(400).send({
          error: 'Invalid email format'
        });
      }

      const result = await this.userService.signup(signupData);

      return reply.status(201).send({
        success: true,
        message: 'User created successfully',
        data: result
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Handle specific error cases
      if (errorMessage.includes('already exists')) {
        return reply.status(409).send({
          error: errorMessage
        });
      }

      if (errorMessage.includes('Password must be')) {
        return reply.status(400).send({
          error: errorMessage
        });
      }

      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  }

  /**
   * User login endpoint
   */
  async login(request: FastifyRequest, reply: FastifyReply) {
    try {
      const loginData = request.body as LoginData;

      // Basic validation
      if (!loginData.email || !loginData.password) {
        return reply.status(400).send({
          error: 'Email and password are required'
        });
      }

      const result = await this.userService.login(loginData);

      return reply.status(200).send({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Handle specific error cases
      if (errorMessage.includes('Invalid email or password') || errorMessage.includes('Account is deactivated')) {
        return reply.status(401).send({
          error: errorMessage
        });
      }

      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  }

  /**
   * Update password endpoint
   */
  async updatePassword(request: FastifyRequest, reply: FastifyReply) {
    try {
      const updatePasswordData = request.body as UpdatePasswordData;
      const userId = (request as any).user?.userId; // Assuming you have auth middleware that adds user to request

      if (!userId) {
        return reply.status(401).send({
          error: 'Unauthorized: User ID not found'
        });
      }

      // Basic validation
      if (!updatePasswordData.currentPassword || !updatePasswordData.newPassword) {
        return reply.status(400).send({
          error: 'Current password and new password are required'
        });
      }

      const result = await this.userService.updatePassword(userId, updatePasswordData);

      return reply.status(200).send({
        success: true,
        ...result
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Handle specific error cases
      if (errorMessage.includes('User not found')) {
        return reply.status(404).send({
          error: errorMessage
        });
      }

      if (errorMessage.includes('Current password is incorrect') || 
          errorMessage.includes('New password must be different')) {
        return reply.status(400).send({
          error: errorMessage
        });
      }

      if (errorMessage.includes('New password must be at least')) {
        return reply.status(400).send({
          error: errorMessage
        });
      }

      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get user profile endpoint
   */
  async getProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user?.userId; // Assuming you have auth middleware

      if (!userId) {
        return reply.status(401).send({
          error: 'Unauthorized: User ID not found'
        });
      }

      const user = await this.userService.getUserById(userId);

      if (!user) {
        return reply.status(404).send({
          error: 'User not found'
        });
      }

      return reply.status(200).send({
        success: true,
        data: { user }
      });
    } catch (error) {
      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  }

  /**
   * Update user profile endpoint
   */
  async updateProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const updateData = request.body as { first_name?: string; last_name?: string; email?: string };
      const userId = (request as any).user?.userId; // Assuming you have auth middleware

      if (!userId) {
        return reply.status(401).send({
          error: 'Unauthorized: User ID not found'
        });
      }

      // Email validation if provided
      if (updateData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(updateData.email)) {
          return reply.status(400).send({
            error: 'Invalid email format'
          });
        }
      }

      const updatedUser = await this.userService.updateProfile(userId, updateData);

      return reply.status(200).send({
        success: true,
        message: 'Profile updated successfully',
        data: { user: updatedUser }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('User not found')) {
        return reply.status(404).send({
          error: errorMessage
        });
      }

      if (errorMessage.includes('Email is already taken')) {
        return reply.status(409).send({
          error: errorMessage
        });
      }

      return reply.status(500).send({
        error: 'Internal server error'
      });
    }
  }
}