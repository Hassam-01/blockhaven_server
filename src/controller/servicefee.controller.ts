import { FastifyRequest, FastifyReply } from 'fastify';
import { ServiceFeeService } from '../services/servicefee.service.js';

export class ServiceFeeController {
  private serviceFeeService: ServiceFeeService;

  constructor() {
    this.serviceFeeService = new ServiceFeeService();
  }

  /**
   * Get current service fee configuration
   */
  async getCurrentServiceFee(request: FastifyRequest, reply: FastifyReply) {
    try {
      const serviceFee = await this.serviceFeeService.getCurrentServiceFee();

      return reply.status(200).send({
        success: true,
        data: serviceFee
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return reply.status(500).send({
        error: 'Failed to retrieve current service fee',
        details: errorMessage
      });
    }
  }

  /**
   * Update service fee configuration (admin only)
   */
  async updateServiceFee(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { type, percentage } = request.body as { type: 'fixed-rate' | 'floating'; percentage: number };

      // Validate input
      if (!['fixed-rate', 'floating'].includes(type)) {
        return reply.status(400).send({
          error: 'Type must be either "fixed-rate" or "floating"'
        });
      }

      if (typeof percentage !== 'number' || percentage < 0 || percentage > 100) {
        return reply.status(400).send({
          error: 'Percentage must be a number between 0 and 100'
        });
      }

      const updatedServiceFee = await this.serviceFeeService.updateServiceFee({
        type,
        fee: percentage
      });

      return reply.status(200).send({
        success: true,
        message: 'Service fee updated successfully',
        data: updatedServiceFee
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      return reply.status(500).send({
        error: 'Failed to update service fee',
        details: errorMessage
      });
    }
  }

  /**
   * Calculate service fee for a given amount
   */
  async calculateServiceFee(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { amount } = request.query as { amount: string };

      if (!amount || isNaN(Number(amount))) {
        return reply.status(400).send({
          error: 'Amount is required and must be a valid number'
        });
      }

      const numericAmount = Number(amount);
      if (numericAmount < 0) {
        return reply.status(400).send({
          error: 'Amount cannot be negative'
        });
      }

      const calculation = await this.serviceFeeService.calculateServiceFee(numericAmount);

      return reply.status(200).send({
        success: true,
        data: calculation
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return reply.status(500).send({
        error: 'Failed to calculate service fee',
        details: errorMessage
      });
    }
  }

  /**
   * Get service fee history
   */
  async getServiceFeeHistory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const history = await this.serviceFeeService.getServiceFeeHistory();

      return reply.status(200).send({
        success: true,
        data: history
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return reply.status(500).send({
        error: 'Failed to retrieve service fee history',
        details: errorMessage
      });
    }
  }

  /**
   * Get service fee statistics
   */
  async getServiceFeeStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await this.serviceFeeService.getServiceFeeStats();

      return reply.status(200).send({
        success: true,
        data: stats
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return reply.status(500).send({
        error: 'Failed to retrieve service fee statistics',
        details: errorMessage
      });
    }
  }

  /**
   * Reset service fee to default (0% floating rate)
   */
  async resetServiceFee(request: FastifyRequest, reply: FastifyReply) {
    try {
      const defaultServiceFee = await this.serviceFeeService.resetToDefault();

      return reply.status(200).send({
        success: true,
        message: 'Service fee reset to default configuration',
        data: defaultServiceFee
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return reply.status(500).send({
        error: 'Failed to reset service fee',
        details: errorMessage
      });
    }
  }
}