import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source.js';
import { Testimonial } from '../entities/testimonial.entity.js';
import { User } from '../entities/user.entity.js';

export interface CreateTestimonialData {
  rating: number;
  text: string;
}

export interface UpdateTestimonialData {
  rating?: number;
  text?: string;
  is_approved?: boolean;
}

export interface TestimonialFilters {
  is_approved?: boolean;
  rating?: number;
  userId?: string;
}

export class TestimonialService {
  private testimonialRepository: Repository<Testimonial>;
  private userRepository: Repository<User>;

  constructor() {
    this.testimonialRepository = AppDataSource.getRepository(Testimonial);
    this.userRepository = AppDataSource.getRepository(User);
  }

  /**
   * Create a new testimonial (logged-in users only)
   */
  async createTestimonial(userId: string, testimonialData: CreateTestimonialData): Promise<Testimonial> {
    const { rating, text } = testimonialData;

    // Validate user exists and is active
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.is_active) {
      throw new Error('User account is deactivated');
    }

    // Validate input
    if (!text || text.trim().length === 0) {
      throw new Error('Testimonial text is required and cannot be empty');
    }

    if (!rating || rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Check if user already has a testimonial
    const existingTestimonial = await this.testimonialRepository.findOne({
      where: { user: { id: userId } }
    });

    if (existingTestimonial) {
      throw new Error('You have already submitted a testimonial. You can update your existing testimonial instead.');
    }

    // Create new testimonial
    const testimonial = this.testimonialRepository.create({
      user: { id: userId },
      rating: Math.round(rating), // Ensure integer rating
      text: text.trim(),
      is_approved: false, // Testimonials need admin approval
    });

    return await this.testimonialRepository.save(testimonial);
  }

  /**
   * Get all testimonials with optional filters
   */
  async getAllTestimonials(filters?: TestimonialFilters): Promise<Testimonial[]> {
    const queryBuilder = this.testimonialRepository
      .createQueryBuilder('testimonial')
      .leftJoinAndSelect('testimonial.user', 'user');

    // Apply is_approved filter
    if (filters?.is_approved !== undefined) {
      queryBuilder.where('testimonial.is_approved = :is_approved', { is_approved: filters.is_approved });
    }

    // Apply rating filter
    if (filters?.rating) {
      queryBuilder.andWhere('testimonial.rating = :rating', { rating: filters.rating });
    }

    // Apply user filter
    if (filters?.userId) {
      queryBuilder.andWhere('user.id = :userId', { userId: filters.userId });
    }

    // Order by creation date (newest first)
    queryBuilder.orderBy('testimonial.created_at', 'DESC');

    return await queryBuilder.getMany();
  }

  /**
   * Get approved testimonials (for public display)
   */
  async getApprovedTestimonials(): Promise<Testimonial[]> {
    return await this.getAllTestimonials({ is_approved: true });
  }

  /**
   * Get pending testimonials (for admin review)
   */
  async getPendingTestimonials(): Promise<Testimonial[]> {
    return await this.getAllTestimonials({ is_approved: false });
  }

  /**
   * Get testimonial by ID
   */
  async getTestimonialById(id: string): Promise<Testimonial | null> {
    if (!id) {
      throw new Error('Testimonial ID is required');
    }

    return await this.testimonialRepository.findOne({
      where: { id },
      relations: ['user']
    });
  }

  /**
   * Get user's testimonial
   */
  async getUserTestimonial(userId: string): Promise<Testimonial | null> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    return await this.testimonialRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user']
    });
  }

  /**
   * Update testimonial (user can update their own, admin can update any)
   */
  async updateTestimonial(id: string, updateData: UpdateTestimonialData, requestUserId: string, isAdmin: boolean = false): Promise<Testimonial> {
    if (!id) {
      throw new Error('Testimonial ID is required');
    }

    // Check if testimonial exists
    const existingTestimonial = await this.testimonialRepository.findOne({
      where: { id },
      relations: ['user']
    });

    if (!existingTestimonial) {
      throw new Error('Testimonial not found');
    }

    // Check authorization - user can only update their own testimonial unless they're admin
    if (!isAdmin && existingTestimonial.user.id !== requestUserId) {
      throw new Error('You can only update your own testimonial');
    }

    // Validate input if provided
    if (updateData.rating !== undefined) {
      if (updateData.rating < 1 || updateData.rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }
    }

    if (updateData.text !== undefined) {
      if (!updateData.text || updateData.text.trim().length === 0) {
        throw new Error('Testimonial text cannot be empty');
      }
    }

    // Prepare update object
    const updateObject: Partial<Testimonial> = {};
    
    if (updateData.rating !== undefined) {
      updateObject.rating = Math.round(updateData.rating);
    }
    
    if (updateData.text !== undefined) {
      updateObject.text = updateData.text.trim();
    }
    
    // Only admins can update approval status
    if (updateData.is_approved !== undefined && isAdmin) {
      updateObject.is_approved = updateData.is_approved;
    }

    // If user updates their testimonial, reset approval status (except if admin is updating)
    if (!isAdmin && (updateData.rating !== undefined || updateData.text !== undefined)) {
      updateObject.is_approved = false;
    }

    // Update testimonial
    await this.testimonialRepository.update(id, updateObject);

    // Return updated testimonial
    const updatedTestimonial = await this.testimonialRepository.findOne({
      where: { id },
      relations: ['user']
    });

    if (!updatedTestimonial) {
      throw new Error('Failed to retrieve updated testimonial');
    }

    return updatedTestimonial;
  }

  /**
   * Delete testimonial (user can delete their own, admin can delete any)
   */
  async deleteTestimonial(id: string, requestUserId: string, isAdmin: boolean = false): Promise<{ message: string }> {
    if (!id) {
      throw new Error('Testimonial ID is required');
    }

    // Check if testimonial exists
    const existingTestimonial = await this.testimonialRepository.findOne({
      where: { id },
      relations: ['user']
    });

    if (!existingTestimonial) {
      throw new Error('Testimonial not found');
    }

    // Check authorization - user can only delete their own testimonial unless they're admin
    if (!isAdmin && existingTestimonial.user.id !== requestUserId) {
      throw new Error('You can only delete your own testimonial');
    }

    // Delete testimonial
    await this.testimonialRepository.delete(id);

    return { message: 'Testimonial deleted successfully' };
  }

  /**
   * Approve testimonial (admin only)
   */
  async approveTestimonial(id: string): Promise<Testimonial> {
    return await this.updateTestimonial(id, { is_approved: true }, '', true);
  }

  /**
   * Reject/Unapprove testimonial (admin only)
   */
  async rejectTestimonial(id: string): Promise<Testimonial> {
    return await this.updateTestimonial(id, { is_approved: false }, '', true);
  }

  /**
   * Get testimonial statistics (for admin dashboard)
   */
  async getTestimonialStats(): Promise<{
    total: number;
    approved: number;
    pending: number;
    averageRating: number;
    ratingDistribution: { [key: number]: number };
  }> {
    const [total, approved] = await Promise.all([
      this.testimonialRepository.count(),
      this.testimonialRepository.count({ where: { is_approved: true } })
    ]);

    // Get average rating for approved testimonials
    const approvedTestimonials = await this.testimonialRepository.find({
      where: { is_approved: true },
      select: ['rating']
    });

    const averageRating = approvedTestimonials.length > 0
      ? approvedTestimonials.reduce((sum, t) => sum + t.rating, 0) / approvedTestimonials.length
      : 0;

    // Get rating distribution for approved testimonials
    const ratingDistribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    approvedTestimonials.forEach(testimonial => {
      ratingDistribution[testimonial.rating] = (ratingDistribution[testimonial.rating] || 0) + 1;
    });

    return {
      total,
      approved,
      pending: total - approved,
      averageRating: Math.round(averageRating * 100) / 100, // Round to 2 decimal places
      ratingDistribution
    };
  }

  /**
   * Bulk approve testimonials (admin only)
   */
  async bulkApproveTestimonials(ids: string[]): Promise<{ message: string; updated: number }> {
    if (!ids || ids.length === 0) {
      throw new Error('Testimonial IDs are required');
    }

    // Validate all IDs exist
    const existingTestimonials = await this.testimonialRepository
      .createQueryBuilder('testimonial')
      .where('testimonial.id IN (:...ids)', { ids })
      .getMany();
    
    if (existingTestimonials.length !== ids.length) {
      throw new Error('One or more testimonial IDs not found');
    }

    // Update approval status for all testimonials
    await this.testimonialRepository
      .createQueryBuilder()
      .update(Testimonial)
      .set({ is_approved: true })
      .where('id IN (:...ids)', { ids })
      .execute();

    return {
      message: `${existingTestimonials.length} testimonials approved successfully`,
      updated: existingTestimonials.length
    };
  }

  /**
   * Bulk reject testimonials (admin only)
   */
  async bulkRejectTestimonials(ids: string[]): Promise<{ message: string; updated: number }> {
    if (!ids || ids.length === 0) {
      throw new Error('Testimonial IDs are required');
    }

    // Validate all IDs exist
    const existingTestimonials = await this.testimonialRepository
      .createQueryBuilder('testimonial')
      .where('testimonial.id IN (:...ids)', { ids })
      .getMany();
    
    if (existingTestimonials.length !== ids.length) {
      throw new Error('One or more testimonial IDs not found');
    }

    // Update approval status for all testimonials
    await this.testimonialRepository
      .createQueryBuilder()
      .update(Testimonial)
      .set({ is_approved: false })
      .where('id IN (:...ids)', { ids })
      .execute();

    return {
      message: `${existingTestimonials.length} testimonials rejected successfully`,
      updated: existingTestimonials.length
    };
  }

  /**
   * Get testimonials by rating
   */
  async getTestimonialsByRating(rating: number, approvedOnly: boolean = true): Promise<Testimonial[]> {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const filters: TestimonialFilters = { rating };
    
    if (approvedOnly) {
      filters.is_approved = true;
    }

    return await this.getAllTestimonials(filters);
  }
}
