import { Repository } from "typeorm";
import { AppDataSource } from "../config/data-source.js";
import { ServiceFee } from "../entities/servicefee.entity.js";

export interface ServiceFeeConfig {
  fixedRateFee: number; // percentage for fixed-rate exchanges
  floatingRateFee: number; // percentage for floating rate exchanges
}

export interface UpdateServiceFeeData {
  fixedRateFee?: number; // percentage for fixed-rate exchanges
  floatingRateFee?: number; // percentage for floating rate exchanges
}

export interface ServiceFeeCalculation {
  originalAmount: number;
  serviceFeeAmount: number;
  totalAmount: number;
  feeType: "fixed-rate" | "floating";
  feePercentage: number;
}

export class ServiceFeeService {
  private serviceFeeRepository: Repository<ServiceFee>;

  constructor() {
    this.serviceFeeRepository = AppDataSource.getRepository(ServiceFee);
  }

  /**
   * Get current active service fee configuration (both fixed and floating rates)
   */
  async getCurrentServiceFee(): Promise<ServiceFeeConfig> {
    // Get the most recent configuration for both types
    const fixedRateConfig = await this.serviceFeeRepository.findOne({
      where: { type: "fixed-rate" },
      order: { created_at: "DESC" },
    });

    const floatingRateConfig = await this.serviceFeeRepository.findOne({
      where: { type: "floating" },
      order: { created_at: "DESC" },
    });

    return {
      fixedRateFee: fixedRateConfig?.fee || 0,
      floatingRateFee: floatingRateConfig?.fee || 0,
    };
  }

  /**
   * Get all service fee configurations
   */
  async getAllServiceFees(): Promise<ServiceFee[]> {
    // Get all service fee configurations ordered by creation date
    console.log("request in the service: ");
    const data = await this.serviceFeeRepository.find({
      order: { created_at: "DESC" },
    });
    console.log("request in the service: ", data);
    return data;
  }

  /**
   * Update service fee configuration for one or both exchange types
   */
  async updateServiceFee(
    updateData: UpdateServiceFeeData
  ): Promise<ServiceFeeConfig> {
    const { fixedRateFee, floatingRateFee } = updateData;

    // Validate input
    if (fixedRateFee !== undefined) {
      if (fixedRateFee < 0) {
        throw new Error("Fixed rate fee percentage cannot be negative");
      }
      if (fixedRateFee > 100) {
        throw new Error("Fixed rate fee percentage cannot exceed 100%");
      }
    }

    if (floatingRateFee !== undefined) {
      if (floatingRateFee < 0) {
        throw new Error("Floating rate fee percentage cannot be negative");
      }
      if (floatingRateFee > 100) {
        throw new Error("Floating rate fee percentage cannot exceed 100%");
      }
    }

    // Update fixed rate fee if provided
    if (fixedRateFee !== undefined) {
      // Fetch the existing fixed-rate service fee entry
      const existingFixedRate = await this.serviceFeeRepository.findOne({
        where: { type: "fixed-rate" },
        order: { created_at: "DESC" },
      });

      if (existingFixedRate) {
        existingFixedRate.fee = fixedRateFee;
        await this.serviceFeeRepository.save(existingFixedRate);
      } else {
        // If not found, create a new one as fallback
        const fixedRateServiceFee = this.serviceFeeRepository.create({
          type: "fixed-rate",
          fee: fixedRateFee,
        });
        await this.serviceFeeRepository.save(fixedRateServiceFee);
      }
      //   await this.serviceFeeRepository.save(fixedRateServiceFee);
    }

    // Update floating rate fee if provided
    if (floatingRateFee !== undefined) {
      // Fetch the existing floating-rate service fee entry
      const existingFloatingRate = await this.serviceFeeRepository.findOne({
        where: { type: "floating" },
        order: { created_at: "DESC" },
      });

      if (existingFloatingRate) {
        existingFloatingRate.fee = floatingRateFee;
        await this.serviceFeeRepository.save(existingFloatingRate);
      } else {
        // If not found, create a new one as fallback
        const floatingRateServiceFee = this.serviceFeeRepository.create({
          type: "floating",
          fee: floatingRateFee,
        });
        await this.serviceFeeRepository.save(floatingRateServiceFee);
      }
    }

    // Return current configuration
    return await this.getCurrentServiceFee();
  }

  /**
   * Set floating rate percentage
   */
  async setFloatingRate(percentage: number): Promise<ServiceFeeConfig> {
    if (percentage < 0 || percentage > 100) {
      throw new Error("Floating rate percentage must be between 0 and 100");
    }

    return await this.updateServiceFee({
      floatingRateFee: percentage,
    });
  }

  /**
   * Set fixed rate percentage
   */
  async setFixedRate(percentage: number): Promise<ServiceFeeConfig> {
    if (percentage < 0 || percentage > 100) {
      throw new Error("Fixed rate percentage must be between 0 and 100");
    }

    return await this.updateServiceFee({
      fixedRateFee: percentage,
    });
  }

  /**
   * Calculate service fee for a given amount based on exchange type
   */
  async calculateServiceFee(
    amount: number,
    exchangeType: "fixed-rate" | "floating"
  ): Promise<ServiceFeeCalculation> {
    if (amount < 0) {
      throw new Error("Amount cannot be negative");
    }

    if (!["fixed-rate", "floating"].includes(exchangeType)) {
      throw new Error(
        'Exchange type must be either "fixed-rate" or "floating"'
      );
    }

    const serviceFeeConfig = await this.getCurrentServiceFee();

    const feePercentage =
      exchangeType === "fixed-rate"
        ? serviceFeeConfig.fixedRateFee
        : serviceFeeConfig.floatingRateFee;

    // Calculate service fee amount
    const serviceFeeAmount =
      Math.round(((amount * feePercentage) / 100) * 100) / 100;

    return {
      originalAmount: amount,
      serviceFeeAmount,
      totalAmount: amount + serviceFeeAmount,
      feeType: exchangeType,
      feePercentage,
    };
  }

  /**
   * Get all service fee configurations (history)
   */
  async getServiceFeeHistory(): Promise<ServiceFee[]> {
    return await this.serviceFeeRepository.find({
      order: { created_at: "DESC" },
    });
  }

  /**
   * Get service fee by ID
   */
  async getServiceFeeById(id: string): Promise<ServiceFee | null> {
    if (!id) {
      throw new Error("Service fee ID is required");
    }

    return await this.serviceFeeRepository.findOne({ where: { id } });
  }

  /**
   * Get service fee statistics
   */
  async getServiceFeeStats(): Promise<{
    currentConfig: ServiceFeeConfig;
    totalConfigurations: number;
    configurationHistory: ServiceFee[];
  }> {
    const [currentConfig, totalConfigurations, configurationHistory] =
      await Promise.all([
        this.getCurrentServiceFee(),
        this.serviceFeeRepository.count(),
        this.serviceFeeRepository.find({
          order: { created_at: "DESC" },
          take: 10, // Last 10 configurations
        }),
      ]);

    return {
      currentConfig,
      totalConfigurations,
      configurationHistory,
    };
  }

  /**
   * Reset to default configuration (0% for both rates)
   */
  async resetToDefault(): Promise<ServiceFeeConfig> {
    return await this.updateServiceFee({
      fixedRateFee: 0,
      floatingRateFee: 0,
    });
  }

  /**
   * Validate service fee configuration
   */
  validateServiceFeeConfig(
    fixedRateFee: number,
    floatingRateFee: number
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (fixedRateFee < 0) {
      errors.push("Fixed rate fee percentage cannot be negative");
    }

    if (fixedRateFee > 100) {
      errors.push("Fixed rate fee percentage cannot exceed 100%");
    }

    if (floatingRateFee < 0) {
      errors.push("Floating rate fee percentage cannot be negative");
    }

    if (floatingRateFee > 100) {
      errors.push("Floating rate fee percentage cannot exceed 100%");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate total amount including service fee
   */
  async calculateTotalWithServiceFee(
    baseAmount: number,
    exchangeType: "fixed-rate" | "floating"
  ): Promise<number> {
    const calculation = await this.calculateServiceFee(
      baseAmount,
      exchangeType
    );
    return calculation.totalAmount;
  }

  /**
   * Calculate base amount from total (reverse calculation)
   */
  async calculateBaseAmountFromTotal(
    totalAmount: number,
    exchangeType: "fixed-rate" | "floating"
  ): Promise<{
    baseAmount: number;
    serviceFeeAmount: number;
    feeType: "fixed-rate" | "floating";
    feePercentage: number;
  }> {
    if (totalAmount < 0) {
      throw new Error("Total amount cannot be negative");
    }

    if (!["fixed-rate", "floating"].includes(exchangeType)) {
      throw new Error(
        'Exchange type must be either "fixed-rate" or "floating"'
      );
    }

    const serviceFeeConfig = await this.getCurrentServiceFee();

    const feePercentage =
      exchangeType === "fixed-rate"
        ? serviceFeeConfig.fixedRateFee
        : serviceFeeConfig.floatingRateFee;

    // totalAmount = baseAmount + (baseAmount * percentage / 100)
    // totalAmount = baseAmount * (1 + percentage / 100)
    // baseAmount = totalAmount / (1 + percentage / 100)
    const baseAmount = totalAmount / (1 + feePercentage / 100);
    const serviceFeeAmount = totalAmount - baseAmount;

    // Round to 2 decimal places
    const roundedBaseAmount = Math.round(baseAmount * 100) / 100;
    const roundedServiceFeeAmount = Math.round(serviceFeeAmount * 100) / 100;

    return {
      baseAmount: roundedBaseAmount,
      serviceFeeAmount: roundedServiceFeeAmount,
      feeType: exchangeType,
      feePercentage,
    };
  }

  /**
   * Get current service fee rates for display
   */
  async getCurrentServiceFeeRates(): Promise<{
    fixedRate: { percentage: number; displayText: string };
    floatingRate: { percentage: number; displayText: string };
  }> {
    const serviceFeeConfig = await this.getCurrentServiceFee();

    return {
      fixedRate: {
        percentage: serviceFeeConfig.fixedRateFee,
        displayText: `${serviceFeeConfig.fixedRateFee}% (fixed-rate)`,
      },
      floatingRate: {
        percentage: serviceFeeConfig.floatingRateFee,
        displayText: `${serviceFeeConfig.floatingRateFee}% (floating)`,
      },
    };
  }
}
