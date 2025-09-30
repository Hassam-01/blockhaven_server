import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Faq } from '../entities/faq.entity';

export interface CreateFaqData {
  question: string;
  answer: string;
  is_active?: boolean;
}

export interface UpdateFaqData {
  question?: string;
  answer?: string;
  is_active?: boolean;
}

export interface FaqFilters {
  is_active?: boolean;
  search?: string; // Search in question or answer
}

export class FaqService {
  private faqRepository: Repository<Faq>;

  constructor() {
    this.faqRepository = AppDataSource.getRepository(Faq);
  }

  /**
   * Create a new FAQ
   */
  async createFaq(faqData: CreateFaqData): Promise<Faq> {
    const { question, answer, is_active = true } = faqData;

    // Validate input
    if (!question || question.trim().length === 0) {
      throw new Error('Question is required and cannot be empty');
    }

    if (!answer || answer.trim().length === 0) {
      throw new Error('Answer is required and cannot be empty');
    }

    // Check if FAQ with same question already exists
    const existingFaq = await this.faqRepository.findOne({
      where: { question: question.trim() }
    });

    if (existingFaq) {
      throw new Error('FAQ with this question already exists');
    }

    // Create new FAQ
    const faq = this.faqRepository.create({
      question: question.trim(),
      answer: answer.trim(),
      is_active,
    });

    return await this.faqRepository.save(faq);
  }

  /**
   * Get all FAQs with optional filters
   */
  async getAllFaqs(filters?: FaqFilters): Promise<Faq[]> {
    const queryBuilder = this.faqRepository.createQueryBuilder('faq');

    // Apply is_active filter
    if (filters?.is_active !== undefined) {
      queryBuilder.where('faq.is_active = :is_active', { is_active: filters.is_active });
    }

    // Apply search filter
    if (filters?.search) {
      const searchTerm = `%${filters.search.toLowerCase()}%`;
      queryBuilder.andWhere(
        '(LOWER(faq.question) LIKE :searchTerm OR LOWER(faq.answer) LIKE :searchTerm)',
        { searchTerm }
      );
    }

    // Order by creation date (newest first)
    queryBuilder.orderBy('faq.created_at', 'DESC');

    return await queryBuilder.getMany();
  }

  /**
   * Get active FAQs (for public display)
   */
  async getActiveFaqs(): Promise<Faq[]> {
    return await this.getAllFaqs({ is_active: true });
  }

  /**
   * Get FAQ by ID
   */
  async getFaqById(id: string): Promise<Faq | null> {
    if (!id) {
      throw new Error('FAQ ID is required');
    }

    return await this.faqRepository.findOne({ where: { id } });
  }

  /**
   * Update FAQ
   */
  async updateFaq(id: string, updateData: UpdateFaqData): Promise<Faq> {
    if (!id) {
      throw new Error('FAQ ID is required');
    }

    // Check if FAQ exists
    const existingFaq = await this.faqRepository.findOne({ where: { id } });
    if (!existingFaq) {
      throw new Error('FAQ not found');
    }

    // Validate input if provided
    if (updateData.question !== undefined) {
      if (!updateData.question || updateData.question.trim().length === 0) {
        throw new Error('Question cannot be empty');
      }

      // Check if another FAQ with same question exists (excluding current one)
      const duplicateFaq = await this.faqRepository.findOne({
        where: { question: updateData.question.trim() }
      });

      if (duplicateFaq && duplicateFaq.id !== id) {
        throw new Error('FAQ with this question already exists');
      }
    }

    if (updateData.answer !== undefined) {
      if (!updateData.answer || updateData.answer.trim().length === 0) {
        throw new Error('Answer cannot be empty');
      }
    }

    // Prepare update object
    const updateObject: Partial<Faq> = {};
    
    if (updateData.question !== undefined) {
      updateObject.question = updateData.question.trim();
    }
    
    if (updateData.answer !== undefined) {
      updateObject.answer = updateData.answer.trim();
    }
    
    if (updateData.is_active !== undefined) {
      updateObject.is_active = updateData.is_active;
    }

    // Update FAQ
    await this.faqRepository.update(id, updateObject);

    // Return updated FAQ
    const updatedFaq = await this.faqRepository.findOne({ where: { id } });
    if (!updatedFaq) {
      throw new Error('Failed to retrieve updated FAQ');
    }

    return updatedFaq;
  }

  /**
   * Delete FAQ
   */
  async deleteFaq(id: string): Promise<{ message: string }> {
    if (!id) {
      throw new Error('FAQ ID is required');
    }

    // Check if FAQ exists
    const existingFaq = await this.faqRepository.findOne({ where: { id } });
    if (!existingFaq) {
      throw new Error('FAQ not found');
    }

    // Delete FAQ
    await this.faqRepository.delete(id);

    return { message: 'FAQ deleted successfully' };
  }

  /**
   * Pause/Unpause FAQ (toggle is_active status)
   */
  async toggleFaqStatus(id: string): Promise<Faq> {
    if (!id) {
      throw new Error('FAQ ID is required');
    }

    // Check if FAQ exists
    const existingFaq = await this.faqRepository.findOne({ where: { id } });
    if (!existingFaq) {
      throw new Error('FAQ not found');
    }

    // Toggle status
    const newStatus = !existingFaq.is_active;
    await this.faqRepository.update(id, { is_active: newStatus });

    // Return updated FAQ
    const updatedFaq = await this.faqRepository.findOne({ where: { id } });
    if (!updatedFaq) {
      throw new Error('Failed to retrieve updated FAQ');
    }

    return updatedFaq;
  }

  /**
   * Pause FAQ (set is_active to false)
   */
  async pauseFaq(id: string): Promise<Faq> {
    return await this.updateFaq(id, { is_active: false });
  }

  /**
   * Activate FAQ (set is_active to true)
   */
  async activateFaq(id: string): Promise<Faq> {
    return await this.updateFaq(id, { is_active: true });
  }

  /**
   * Get FAQ statistics (for admin dashboard)
   */
  async getFaqStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> {
    const [total, active] = await Promise.all([
      this.faqRepository.count(),
      this.faqRepository.count({ where: { is_active: true } })
    ]);

    return {
      total,
      active,
      inactive: total - active
    };
  }

  /**
   * Bulk update FAQ status
   */
  async bulkUpdateStatus(ids: string[], is_active: boolean): Promise<{ message: string; updated: number }> {
    if (!ids || ids.length === 0) {
      throw new Error('FAQ IDs are required');
    }

    // Validate all IDs exist
    const existingFaqs = await this.faqRepository
      .createQueryBuilder('faq')
      .where('faq.id IN (:...ids)', { ids })
      .getMany();
    
    if (existingFaqs.length !== ids.length) {
      throw new Error('One or more FAQ IDs not found');
    }

    // Update status for all FAQs
    await this.faqRepository
      .createQueryBuilder()
      .update(Faq)
      .set({ is_active })
      .where('id IN (:...ids)', { ids })
      .execute();

    return {
      message: `${existingFaqs.length} FAQs ${is_active ? 'activated' : 'deactivated'} successfully`,
      updated: existingFaqs.length
    };
  }

  /**
   * Search FAQs by keyword
   */
  async searchFaqs(keyword: string, activeOnly: boolean = true): Promise<Faq[]> {
    if (!keyword || keyword.trim().length === 0) {
      return activeOnly ? await this.getActiveFaqs() : await this.getAllFaqs();
    }

    const filters: FaqFilters = {
      search: keyword.trim()
    };

    if (activeOnly) {
      filters.is_active = true;
    }

    return await this.getAllFaqs(filters);
  }
}
