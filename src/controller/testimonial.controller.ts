import { FastifyRequest, FastifyReply } from 'fastify';
import { TestimonialService, CreateTestimonialData, UpdateTestimonialData, TestimonialFilters } from '../services/testimonial.service.js';

export class TestimonialController {
  private testimonialService: TestimonialService;

  constructor() {
    this.testimonialService = new TestimonialService();
  }

  /**
   * Get approved testimonials (public endpoint)
   */
  async getPublicTestimonials(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { rating } = request.query as { rating?: string };

      let testimonials;
      if (rating) {
        const ratingNum = parseInt(rating);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
          return reply.status(400).send({
            error: 'Rating must be a number between 1 and 5'
          });
        }
        testimonials = await this.testimonialService.getTestimonialsByRating(ratingNum, true);
      } else {
        testimonials = await this.testimonialService.getApprovedTestimonials();
      }

      return reply.status(200).send({
        success: true,
        data: { testimonials },
        total: testimonials.length
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return reply.status(500).send({
        error: 'Failed to retrieve testimonials',
        details: errorMessage
      });
    }
  }

  /**
   * Get all testimonials (admin endpoint)
   */
  async getAllTestimonials(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { is_approved, rating, userId } = request.query as {
        is_approved?: string;
        rating?: string;
        userId?: string;
      };

      const filters: TestimonialFilters = {};
      
      if (is_approved !== undefined) {
        filters.is_approved = is_approved === 'true';
      }
      
      if (rating) {
        const ratingNum = parseInt(rating);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
          return reply.status(400).send({
            error: 'Rating must be a number between 1 and 5'
          });
        }
        filters.rating = ratingNum;
      }

      if (userId) {
        filters.userId = userId;
      }

      const testimonials = await this.testimonialService.getAllTestimonials(filters);

      return reply.status(200).send({
        success: true,
        data: { testimonials },
        total: testimonials.length
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return reply.status(500).send({
        error: 'Failed to retrieve testimonials',
        details: errorMessage
      });
    }
  }

  /**
   * Get pending testimonials (admin endpoint)
   */
  async getPendingTestimonials(request: FastifyRequest, reply: FastifyReply) {
    try {
      const testimonials = await this.testimonialService.getPendingTestimonials();

      return reply.status(200).send({
        success: true,
        data: { testimonials },
        total: testimonials.length
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return reply.status(500).send({
        error: 'Failed to retrieve pending testimonials',
        details: errorMessage
      });
    }
  }

  /**
   * Get testimonial by ID
   */
  async getTestimonialById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };

      const testimonial = await this.testimonialService.getTestimonialById(id);

      if (!testimonial) {
        return reply.status(404).send({
          error: 'Testimonial not found'
        });
      }

      return reply.status(200).send({
        success: true,
        data: { testimonial }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('ID is required')) {
        return reply.status(400).send({
          error: errorMessage
        });
      }

      return reply.status(500).send({
        error: 'Failed to retrieve testimonial',
        details: errorMessage
      });
    }
  }

  /**
   * Get user's own testimonial
   */
  async getUserTestimonial(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user?.userId;

      if (!userId) {
        return reply.status(401).send({
          error: 'Unauthorized: User ID not found'
        });
      }

      const testimonial = await this.testimonialService.getUserTestimonial(userId);

      return reply.status(200).send({
        success: true,
        data: { testimonial }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return reply.status(500).send({
        error: 'Failed to retrieve user testimonial',
        details: errorMessage
      });
    }
  }

  /**
   * Create new testimonial (logged-in users only)
   */
  async createTestimonial(request: FastifyRequest, reply: FastifyReply) {
    try {
      const testimonialData = request.body as CreateTestimonialData;
      const userId = (request as any).user?.userId;

      if (!userId) {
        return reply.status(401).send({
          error: 'Unauthorized: User ID not found'
        });
      }

      // Basic validation
      if (!testimonialData.rating || !testimonialData.text) {
        return reply.status(400).send({
          error: 'Rating and text are required'
        });
      }

      const testimonial = await this.testimonialService.createTestimonial(userId, testimonialData);

      return reply.status(201).send({
        success: true,
        message: 'Testimonial created successfully and is pending approval',
        data: { testimonial }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('User not found') || 
          errorMessage.includes('User account is deactivated')) {
        return reply.status(401).send({
          error: errorMessage
        });
      }

      if (errorMessage.includes('required') || 
          errorMessage.includes('cannot be empty') ||
          errorMessage.includes('must be between') ||
          errorMessage.includes('already submitted')) {
        return reply.status(400).send({
          error: errorMessage
        });
      }

      return reply.status(500).send({
        error: 'Failed to create testimonial',
        details: errorMessage
      });
    }
  }

  /**
   * Update testimonial
   */
  async updateTestimonial(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const updateData = request.body as UpdateTestimonialData;
      const userId = (request as any).user?.userId;
      const userType = (request as any).user?.userType;

      if (!userId) {
        return reply.status(401).send({
          error: 'Unauthorized: User ID not found'
        });
      }

      const isAdmin = userType === 'admin';
      const testimonial = await this.testimonialService.updateTestimonial(id, updateData, userId, isAdmin);

      return reply.status(200).send({
        success: true,
        message: 'Testimonial updated successfully',
        data: { testimonial }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('not found')) {
        return reply.status(404).send({
          error: errorMessage
        });
      }

      if (errorMessage.includes('can only update your own') ||
          errorMessage.includes('required') || 
          errorMessage.includes('cannot be empty') ||
          errorMessage.includes('must be between')) {
        return reply.status(400).send({
          error: errorMessage
        });
      }

      if (errorMessage.includes('can only update')) {
        return reply.status(403).send({
          error: errorMessage
        });
      }

      return reply.status(500).send({
        error: 'Failed to update testimonial',
        details: errorMessage
      });
    }
  }

  /**
   * Delete testimonial
   */
  async deleteTestimonial(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const userId = (request as any).user?.userId;
      const userType = (request as any).user?.userType;

      if (!userId) {
        return reply.status(401).send({
          error: 'Unauthorized: User ID not found'
        });
      }

      const isAdmin = userType === 'admin';
      const result = await this.testimonialService.deleteTestimonial(id, userId, isAdmin);

      return reply.status(200).send({
        success: true,
        ...result
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('not found')) {
        return reply.status(404).send({
          error: errorMessage
        });
      }

      if (errorMessage.includes('required')) {
        return reply.status(400).send({
          error: errorMessage
        });
      }

      if (errorMessage.includes('can only delete')) {
        return reply.status(403).send({
          error: errorMessage
        });
      }

      return reply.status(500).send({
        error: 'Failed to delete testimonial',
        details: errorMessage
      });
    }
  }

  /**
   * Approve testimonial (admin only)
   */
  async approveTestimonial(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };

      const testimonial = await this.testimonialService.approveTestimonial(id);

      return reply.status(200).send({
        success: true,
        message: 'Testimonial approved successfully',
        data: { testimonial }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('not found')) {
        return reply.status(404).send({
          error: errorMessage
        });
      }

      return reply.status(500).send({
        error: 'Failed to approve testimonial',
        details: errorMessage
      });
    }
  }

  /**
   * Reject testimonial (admin only)
   */
  async rejectTestimonial(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };

      const testimonial = await this.testimonialService.rejectTestimonial(id);

      return reply.status(200).send({
        success: true,
        message: 'Testimonial rejected successfully',
        data: { testimonial }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('not found')) {
        return reply.status(404).send({
          error: errorMessage
        });
      }

      return reply.status(500).send({
        error: 'Failed to reject testimonial',
        details: errorMessage
      });
    }
  }

  /**
   * Get testimonial statistics (admin only)
   */
  async getTestimonialStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await this.testimonialService.getTestimonialStats();

      return reply.status(200).send({
        success: true,
        data: { stats }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return reply.status(500).send({
        error: 'Failed to retrieve testimonial statistics',
        details: errorMessage
      });
    }
  }

  /**
   * Bulk approve testimonials (admin only)
   */
  async bulkApproveTestimonials(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { ids } = request.body as { ids: string[] };

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return reply.status(400).send({
          error: 'Testimonial IDs array is required and cannot be empty'
        });
      }

      const result = await this.testimonialService.bulkApproveTestimonials(ids);

      return reply.status(200).send({
        success: true,
        ...result
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('not found') || errorMessage.includes('required')) {
        return reply.status(400).send({
          error: errorMessage
        });
      }

      return reply.status(500).send({
        error: 'Failed to bulk approve testimonials',
        details: errorMessage
      });
    }
  }

  /**
   * Bulk reject testimonials (admin only)
   */
  async bulkRejectTestimonials(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { ids } = request.body as { ids: string[] };

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return reply.status(400).send({
          error: 'Testimonial IDs array is required and cannot be empty'
        });
      }

      const result = await this.testimonialService.bulkRejectTestimonials(ids);

      return reply.status(200).send({
        success: true,
        ...result
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('not found') || errorMessage.includes('required')) {
        return reply.status(400).send({
          error: errorMessage
        });
      }

      return reply.status(500).send({
        error: 'Failed to bulk reject testimonials',
        details: errorMessage
      });
    }
  }
}