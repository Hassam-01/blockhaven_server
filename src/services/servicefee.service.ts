import { Repository } from "typeorm";
import { AppDataSource } from "../config/data-source.js";
import { ServiceFee } from "../entities/servicefee.entity.js";

export interface CreateServiceFeeData {
  type: "fixed-rate" | "floating";
  fee: number; // percentage for both types
}

export interface UpdateServiceFeeData {
  type?: "fixed-rate" | "floating";
  fee?: number; // percentage for both types
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
   * Get current active service fee configuration
   */
  async getCurrentServiceFee(): Promise<ServiceFee | null> {
    // Get the most recent service fee configuration
    return await this.serviceFeeRepository.findOne({
      order: { created_at: "DESC" },
    });
  }

  /**
   * Update service fee configuration
   */
  async updateServiceFee(
    updateData: UpdateServiceFeeData
  ): Promise<ServiceFee> {
    const { type, fee } = updateData;

    // Validate input
    if (type && !["fixed-rate", "floating"].includes(type)) {
      throw new Error('Type must be either "fixed-rate" or "floating"');
    }

    if (fee !== undefined) {
      if (fee < 0) {
        throw new Error("Fee percentage cannot be negative");
      }

      // Validate percentage for both types
      if (fee > 100) {
        throw new Error("Fee percentage cannot exceed 100%");
      }
    }

    // Get current service fee
    const currentServiceFee = await this.getCurrentServiceFee();

    const finalType = type || currentServiceFee?.type || "floating";
    const finalFee = fee !== undefined ? fee : currentServiceFee?.fee || 0;

    // Additional validation after determining final values
    if (finalFee > 100) {
      throw new Error("Fee percentage cannot exceed 100%");
    }

    // Create new service fee configuration (keeping history)
    const newServiceFee = this.serviceFeeRepository.create({
      type: finalType,
      fee: finalFee,
    });

    return await this.serviceFeeRepository.save(newServiceFee);
  }

  /**
   * Set floating rate percentage
   */
  async setFloatingRate(percentage: number): Promise<ServiceFee> {
    if (percentage < 0 || percentage > 100) {
      throw new Error("Floating rate percentage must be between 0 and 100");
    }

    return await this.updateServiceFee({
      type: "floating",
      fee: percentage,
    });
  }

  /**
   * Set fixed rate percentage
   */
  async setFixedRate(percentage: number): Promise<ServiceFee> {
    if (percentage < 0 || percentage > 100) {
      throw new Error("Fixed rate percentage must be between 0 and 100");
    }

    return await this.updateServiceFee({
      type: "fixed-rate",
      fee: percentage,
    });
  }

  /**
   * Calculate service fee for a given amount
   */
  async calculateServiceFee(amount: number): Promise<ServiceFeeCalculation> {
    if (amount < 0) {
      throw new Error("Amount cannot be negative");
    }

    const serviceFeeConfig = await this.getCurrentServiceFee();

    if (!serviceFeeConfig) {
      // Default to 0% floating rate if no configuration exists
      return {
        originalAmount: amount,
        serviceFeeAmount: 0,
        totalAmount: amount,
        feeType: "floating",
        feePercentage: 0,
      };
    }

    let serviceFeeAmount: number;

    // Both types use percentage calculation
    serviceFeeAmount = (amount * serviceFeeConfig.fee) / 100;

    // Round to 2 decimal places
    serviceFeeAmount = Math.round(serviceFeeAmount * 100) / 100;

    return {
      originalAmount: amount,
      serviceFeeAmount,
      totalAmount: amount + serviceFeeAmount,
      feeType: serviceFeeConfig.type,
      feePercentage: serviceFeeConfig.fee,
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
    currentConfig: ServiceFee | null;
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
   * Reset to default configuration (0% floating rate)
   */
  async resetToDefault(): Promise<ServiceFee> {
    return await this.updateServiceFee({
      type: "floating",
      fee: 0,
    });
  }

  /**
   * Validate service fee configuration
   */
  validateServiceFeeConfig(
    type: "fixed-rate" | "floating",
    fee: number
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!["fixed-rate", "floating"].includes(type)) {
      errors.push('Type must be either "fixed-rate" or "floating"');
    }

    if (fee < 0) {
      errors.push("Fee percentage cannot be negative");
    }

    if (fee > 100) {
      errors.push("Fee percentage cannot exceed 100%");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate total amount including service fee
   */
  async calculateTotalWithServiceFee(baseAmount: number): Promise<number> {
    const calculation = await this.calculateServiceFee(baseAmount);
    return calculation.totalAmount;
  }

  /**
   * Calculate base amount from total (reverse calculation)
   */
  async calculateBaseAmountFromTotal(totalAmount: number): Promise<{
    baseAmount: number;
    serviceFeeAmount: number;
    feeType: "fixed-rate" | "floating";
    feePercentage: number;
  }> {
    if (totalAmount < 0) {
      throw new Error("Total amount cannot be negative");
    }

    const serviceFeeConfig = await this.getCurrentServiceFee();

    if (!serviceFeeConfig) {
      return {
        baseAmount: totalAmount,
        serviceFeeAmount: 0,
        feeType: "floating",
        feePercentage: 0,
      };
    }

    // Both types use percentage calculation
    // totalAmount = baseAmount + (baseAmount * percentage / 100)
    // totalAmount = baseAmount * (1 + percentage / 100)
    // baseAmount = totalAmount / (1 + percentage / 100)
    const baseAmount = totalAmount / (1 + serviceFeeConfig.fee / 100);
    const serviceFeeAmount = totalAmount - baseAmount;

    // Round to 2 decimal places
    const roundedBaseAmount = Math.round(baseAmount * 100) / 100;
    const roundedServiceFeeAmount = Math.round(serviceFeeAmount * 100) / 100;

    return {
      baseAmount: roundedBaseAmount,
      serviceFeeAmount: roundedServiceFeeAmount,
      feeType: serviceFeeConfig.type,
      feePercentage: serviceFeeConfig.fee,
    };
  }

  /**
   * Get current service fee rate for display
   */
  async getCurrentServiceFeeRate(): Promise<{
    type: "fixed-rate" | "floating";
    percentage: number;
    displayText: string;
  } | null> {
    const serviceFeeConfig = await this.getCurrentServiceFee();

    if (!serviceFeeConfig) {
      return null;
    }

    const displayText = `${serviceFeeConfig.fee}% (${serviceFeeConfig.type})`;

    return {
      type: serviceFeeConfig.type,
      percentage: serviceFeeConfig.fee,
      displayText,
    };
  }
}
