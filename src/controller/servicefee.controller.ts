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
  async getCurrentServiceFee(_request: FastifyRequest, reply: FastifyReply) {
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
   * Get all service fee configurations
   */
  async getAllServiceFees(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const serviceFees = await this.serviceFeeService.getAllServiceFees();

      return reply.status(200).send({
        success: true,
        data: serviceFees
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return reply.status(500).send({
        error: 'Failed to retrieve all service fees',
        details: errorMessage
      });
    }
  }

  /**
   * Update service fee configuration (admin only)
   */
  async updateServiceFee(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { fixedRateFee, floatingRateFee } = request.body as { 
        fixedRateFee?: number; 
        floatingRateFee?: number; 
      };

      // Validate that at least one fee is provided
      if (fixedRateFee === undefined && floatingRateFee === undefined) {
        return reply.status(400).send({
          error: 'At least one of fixedRateFee or floatingRateFee must be provided'
        });
      }

      // Validate fixed rate fee if provided
      if (fixedRateFee !== undefined && (typeof fixedRateFee !== 'number' || fixedRateFee < 0 || fixedRateFee > 100)) {
        return reply.status(400).send({
          error: 'Fixed rate fee must be a number between 0 and 100'
        });
      }

      // Validate floating rate fee if provided
      if (floatingRateFee !== undefined && (typeof floatingRateFee !== 'number' || floatingRateFee < 0 || floatingRateFee > 100)) {
        return reply.status(400).send({
          error: 'Floating rate fee must be a number between 0 and 100'
        });
      }

      const updateData: any = {};
      if (fixedRateFee !== undefined) updateData.fixedRateFee = fixedRateFee;
      if (floatingRateFee !== undefined) updateData.floatingRateFee = floatingRateFee;

      const updatedServiceFee = await this.serviceFeeService.updateServiceFee(updateData);

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
      const { amount, exchangeType } = request.query as { 
        amount: string; 
        exchangeType: 'fixed-rate' | 'floating' 
      };

      if (!amount || isNaN(Number(amount))) {
        return reply.status(400).send({
          error: 'Amount is required and must be a valid number'
        });
      }

      if (!exchangeType || !['fixed-rate', 'floating'].includes(exchangeType)) {
        return reply.status(400).send({
          error: 'Exchange type is required and must be either "fixed-rate" or "floating"'
        });
      }

      const numericAmount = Number(amount);
      if (numericAmount < 0) {
        return reply.status(400).send({
          error: 'Amount cannot be negative'
        });
      }

      const calculation = await this.serviceFeeService.calculateServiceFee(numericAmount, exchangeType);

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

  /**
   * Get current service fee rates for both exchange types
   */
  async getCurrentServiceFeeRates(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const rates = await this.serviceFeeService.getCurrentServiceFeeRates();

      return reply.status(200).send({
        success: true,
        data: rates
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return reply.status(500).send({
        error: 'Failed to retrieve current service fee rates',
        details: errorMessage
      });
    }
  }
}