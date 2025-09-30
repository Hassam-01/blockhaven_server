import { FastifyRequest, FastifyReply } from 'fastify';
import { FaqService, CreateFaqData, UpdateFaqData, FaqFilters } from '../services/faq.service.js';

export class FaqController {
  private faqService: FaqService;

  constructor() {
    this.faqService = new FaqService();
  }

  /**
   * Get all FAQs (public endpoint - returns only active FAQs)
   */
  async getPublicFaqs(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { search } = request.query as { search?: string };

      const faqs = await this.faqService.searchFaqs(search || '', true);

      return reply.status(200).send({
        success: true,
        data: { faqs },
        total: faqs.length
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return reply.status(500).send({
        error: 'Failed to retrieve FAQs',
        details: errorMessage
      });
    }
  }

  /**
   * Get all FAQs (admin endpoint - includes inactive FAQs)
   */
  async getAllFaqs(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { is_active, search } = request.query as {
        is_active?: string;
        search?: string;
      };

      const filters: FaqFilters = {};
      
      if (is_active !== undefined) {
        filters.is_active = is_active === 'true';
      }
      
      if (search) {
        filters.search = search;
      }

      const faqs = await this.faqService.getAllFaqs(filters);

      return reply.status(200).send({
        success: true,
        data: { faqs },
        total: faqs.length
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return reply.status(500).send({
        error: 'Failed to retrieve FAQs',
        details: errorMessage
      });
    }
  }

  /**
   * Get FAQ by ID
   */
  async getFaqById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };

      const faq = await this.faqService.getFaqById(id);

      if (!faq) {
        return reply.status(404).send({
          error: 'FAQ not found'
        });
      }

      return reply.status(200).send({
        success: true,
        data: { faq }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('FAQ ID is required')) {
        return reply.status(400).send({
          error: errorMessage
        });
      }

      return reply.status(500).send({
        error: 'Failed to retrieve FAQ',
        details: errorMessage
      });
    }
  }

  /**
   * Create new FAQ (admin only)
   */
  async createFaq(request: FastifyRequest, reply: FastifyReply) {
    try {
      const faqData = request.body as CreateFaqData;

      // Basic validation
      if (!faqData.question || !faqData.answer) {
        return reply.status(400).send({
          error: 'Question and answer are required'
        });
      }

      const faq = await this.faqService.createFaq(faqData);

      return reply.status(201).send({
        success: true,
        message: 'FAQ created successfully',
        data: { faq }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('required') || 
          errorMessage.includes('cannot be empty') ||
          errorMessage.includes('already exists')) {
        return reply.status(400).send({
          error: errorMessage
        });
      }

      return reply.status(500).send({
        error: 'Failed to create FAQ',
        details: errorMessage
      });
    }
  }

  /**
   * Update FAQ (admin only)
   */
  async updateFaq(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const updateData = request.body as UpdateFaqData;

      const faq = await this.faqService.updateFaq(id, updateData);

      return reply.status(200).send({
        success: true,
        message: 'FAQ updated successfully',
        data: { faq }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('not found')) {
        return reply.status(404).send({
          error: errorMessage
        });
      }

      if (errorMessage.includes('required') || 
          errorMessage.includes('cannot be empty') ||
          errorMessage.includes('already exists')) {
        return reply.status(400).send({
          error: errorMessage
        });
      }

      return reply.status(500).send({
        error: 'Failed to update FAQ',
        details: errorMessage
      });
    }
  }

  /**
   * Delete FAQ (admin only)
   */
  async deleteFaq(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };

      const result = await this.faqService.deleteFaq(id);

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

      return reply.status(500).send({
        error: 'Failed to delete FAQ',
        details: errorMessage
      });
    }
  }

  /**
   * Toggle FAQ status (admin only)
   */
  async toggleFaqStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };

      const faq = await this.faqService.toggleFaqStatus(id);

      return reply.status(200).send({
        success: true,
        message: `FAQ ${faq.is_active ? 'activated' : 'deactivated'} successfully`,
        data: { faq }
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

      return reply.status(500).send({
        error: 'Failed to toggle FAQ status',
        details: errorMessage
      });
    }
  }

  /**
   * Pause FAQ (admin only)
   */
  async pauseFaq(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };

      const faq = await this.faqService.pauseFaq(id);

      return reply.status(200).send({
        success: true,
        message: 'FAQ paused successfully',
        data: { faq }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('not found')) {
        return reply.status(404).send({
          error: errorMessage
        });
      }

      return reply.status(500).send({
        error: 'Failed to pause FAQ',
        details: errorMessage
      });
    }
  }

  /**
   * Activate FAQ (admin only)
   */
  async activateFaq(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };

      const faq = await this.faqService.activateFaq(id);

      return reply.status(200).send({
        success: true,
        message: 'FAQ activated successfully',
        data: { faq }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('not found')) {
        return reply.status(404).send({
          error: errorMessage
        });
      }

      return reply.status(500).send({
        error: 'Failed to activate FAQ',
        details: errorMessage
      });
    }
  }

  /**
   * Get FAQ statistics (admin only)
   */
  async getFaqStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await this.faqService.getFaqStats();

      return reply.status(200).send({
        success: true,
        data: { stats }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return reply.status(500).send({
        error: 'Failed to retrieve FAQ statistics',
        details: errorMessage
      });
    }
  }

  /**
   * Bulk update FAQ status (admin only)
   */
  async bulkUpdateStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { ids, is_active } = request.body as { ids: string[]; is_active: boolean };

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return reply.status(400).send({
          error: 'FAQ IDs array is required and cannot be empty'
        });
      }

      if (typeof is_active !== 'boolean') {
        return reply.status(400).send({
          error: 'is_active must be a boolean value'
        });
      }

      const result = await this.faqService.bulkUpdateStatus(ids, is_active);

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
        error: 'Failed to bulk update FAQ status',
        details: errorMessage
      });
    }
  }

  /**
   * Search FAQs
   */
  async searchFaqs(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { keyword, active_only } = request.query as { 
        keyword?: string; 
        active_only?: string;
      };

      const activeOnly = active_only !== 'false'; // Default to true
      const faqs = await this.faqService.searchFaqs(keyword || '', activeOnly);

      return reply.status(200).send({
        success: true,
        data: { faqs },
        total: faqs.length,
        query: {
          keyword: keyword || '',
          active_only: activeOnly
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return reply.status(500).send({
        error: 'Failed to search FAQs',
        details: errorMessage
      });
    }
  }
}