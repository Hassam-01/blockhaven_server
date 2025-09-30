import { FastifyRequest, FastifyReply } from 'fastify';
import { ServiceFeeService, UpdateServiceFeeData } from '../services/servicefee.service.js';

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
      const serviceFeeRate = await this.serviceFeeService.getCurrentServiceFeeRate();

      return reply.status(200).send({
        success: true,
        data: {
          currentConfig: serviceFee,
          displayInfo: serviceFeeRate
        }
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
      const updateData = request.body as UpdateServiceFeeData;

      // Validate input
      if (updateData.type && !['fixed-rate', 'floating'].includes(updateData.type)) {
        return reply.status(400).send({
          error: 'Type must be either "fixed-rate" or "floating"'
        });
      }

      if (updateData.fee !== undefined) {
        if (typeof updateData.fee !== 'number' || updateData.fee < 0 || updateData.fee > 100) {
          return reply.status(400).send({
            error: 'Fee must be a percentage between 0 and 100'
          });
        }
      }

      const updatedServiceFee = await this.serviceFeeService.updateServiceFee(updateData);

      return reply.status(200).send({
        success: true,
        message: 'Service fee updated successfully',
        data: { serviceFee: updatedServiceFee }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('cannot exceed') || 
          errorMessage.includes('cannot be negative') ||
          errorMessage.includes('must be either')) {
        return reply.status(400).send({
          error: errorMessage
        });
      }

      return reply.status(500).send({
        error: 'Failed to update service fee',
        details: errorMessage
      });
    }
  }

  /**
   * Set floating rate percentage (admin only)
   */
  async setFloatingRate(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { percentage } = request.body as { percentage: number };

      if (typeof percentage !== 'number') {
        return reply.status(400).send({
          error: 'Percentage must be a number'
        });
      }

      const serviceFee = await this.serviceFeeService.setFloatingRate(percentage);

      return reply.status(200).send({
        success: true,
        message: `Floating rate set to ${percentage}%`,
        data: { serviceFee }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('must be between')) {
        return reply.status(400).send({
          error: errorMessage
        });
      }

      return reply.status(500).send({
        error: 'Failed to set floating rate',
        details: errorMessage
      });
    }
  }

  /**
   * Set fixed rate percentage (admin only)
   */
  async setFixedRate(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { percentage } = request.body as { percentage: number };

      if (typeof percentage !== 'number') {
        return reply.status(400).send({
          error: 'Percentage must be a number'
        });
      }

      const serviceFee = await this.serviceFeeService.setFixedRate(percentage);

      return reply.status(200).send({
        success: true,
        message: `Fixed rate set to ${percentage}%`,
        data: { serviceFee }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('must be between')) {
        return reply.status(400).send({
          error: errorMessage
        });
      }

      return reply.status(500).send({
        error: 'Failed to set fixed rate',
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

      if (!amount) {
        return reply.status(400).send({
          error: 'Amount is required'
        });
      }

      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount) || numericAmount < 0) {
        return reply.status(400).send({
          error: 'Amount must be a valid positive number'
        });
      }

      const calculation = await this.serviceFeeService.calculateServiceFee(numericAmount);

      return reply.status(200).send({
        success: true,
        data: { calculation }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('cannot be negative')) {
        return reply.status(400).send({
          error: errorMessage
        });
      }

      return reply.status(500).send({
        error: 'Failed to calculate service fee',
        details: errorMessage
      });
    }
  }

  /**
   * Calculate base amount from total (reverse calculation)
   */
  async calculateBaseAmount(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { totalAmount } = request.query as { totalAmount: string };

      if (!totalAmount) {
        return reply.status(400).send({
          error: 'Total amount is required'
        });
      }

      const numericTotal = parseFloat(totalAmount);
      if (isNaN(numericTotal) || numericTotal < 0) {
        return reply.status(400).send({
          error: 'Total amount must be a valid positive number'
        });
      }

      const calculation = await this.serviceFeeService.calculateBaseAmountFromTotal(numericTotal);

      return reply.status(200).send({
        success: true,
        data: { calculation }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('cannot be negative') || 
          errorMessage.includes('less than the fixed service fee')) {
        return reply.status(400).send({
          error: errorMessage
        });
      }

      return reply.status(500).send({
        error: 'Failed to calculate base amount',
        details: errorMessage
      });
    }
  }

  /**
   * Get service fee history (admin only)
   */
  async getServiceFeeHistory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const history = await this.serviceFeeService.getServiceFeeHistory();

      return reply.status(200).send({
        success: true,
        data: { history },
        total: history.length
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
   * Get service fee statistics (admin only)
   */
  async getServiceFeeStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await this.serviceFeeService.getServiceFeeStats();

      return reply.status(200).send({
        success: true,
        data: { stats }
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
   * Reset service fee to default (admin only)
   */
  async resetToDefault(request: FastifyRequest, reply: FastifyReply) {
    try {
      const serviceFee = await this.serviceFeeService.resetToDefault();

      return reply.status(200).send({
        success: true,
        message: 'Service fee reset to default (0% floating rate)',
        data: { serviceFee }
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
   * Validate service fee configuration (admin only)
   */
  async validateConfig(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { type, fee } = request.body as { type: 'fixed-rate' | 'floating'; fee: number };

      if (!type || fee === undefined) {
        return reply.status(400).send({
          error: 'Type and fee are required'
        });
      }

      const validation = this.serviceFeeService.validateServiceFeeConfig(type, fee);

      return reply.status(200).send({
        success: true,
        data: { validation }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return reply.status(500).send({
        error: 'Failed to validate configuration',
        details: errorMessage
      });
    }
  }
}