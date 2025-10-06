import { Repository } from "typeorm";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { AppDataSource } from "../config/data-source.js";
import { User } from "../entities/user.entity.js";
import { emailService } from "./email.service.js";

export interface SignupData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  user_type?: "admin" | "customer";
}

export interface LoginData {
  email: string;
  password: string;
}

export interface UpdatePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}

export interface AuthResponse {
  user: Omit<User, "password_hash">;
  token: string;
}

export class UserService {
  private userRepository: Repository<User>;
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.jwtSecret =
      process.env.JWT_SECRET || "your-secret-key-change-this-in-production";
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || "24h";
  }

  /**
   * User signup
   */
  async signup(signupData: SignupData): Promise<AuthResponse> {
    const { email, password, first_name, last_name } = signupData;
    const user_type = "customer";
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Validate password strength
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create new user
    const user = this.userRepository.create({
      email,
      password_hash,
      first_name,
      last_name,
      user_type,
    });

    const savedUser = await this.userRepository.save(user);

    // Generate JWT token
    const token = this.generateToken(savedUser.id, savedUser.email);

    // Return user without password hash
    const { password_hash: _, ...userWithoutPassword } = savedUser;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * User login
   */
  async login(loginData: LoginData): Promise<AuthResponse> {
    const { email, password } = loginData;

    // Find user by email
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Check if user is active
    if (!user.is_active) {
      throw new Error("Account is deactivated");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    // Generate JWT token
    const token = this.generateToken(user.id, user.email);

    // Return user without password hash
    const { password_hash: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * Update user password
   */
  async updatePassword(
    userId: string,
    updatePasswordData: UpdatePasswordData
  ): Promise<{ message: string }> {
    const { currentPassword, newPassword } = updatePasswordData;

    // Find user by ID
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error("User not found");
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password_hash
    );
    if (!isCurrentPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    // Validate new password strength
    if (newPassword.length < 6) {
      throw new Error("New password must be at least 6 characters long");
    }

    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(
      newPassword,
      user.password_hash
    );
    if (isSamePassword) {
      throw new Error("New password must be different from current password");
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    await this.userRepository.update(userId, {
      password_hash: newPasswordHash,
    });

    return { message: "Password updated successfully" };
  }

  /**
   * Get user by ID (without password hash)
   */
  async getUserById(
    userId: string
  ): Promise<Omit<User, "password_hash"> | null> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return null;
    }

    const { password_hash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Get user by email (without password hash)
   */
  async getUserByEmail(
    email: string
  ): Promise<Omit<User, "password_hash"> | null> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      return null;
    }

    const { password_hash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): { userId: string; email: string } {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as {
        userId: string;
        email: string;
      };
      return decoded;
    } catch (error) {
      throw new Error("Invalid or expired token");
    }
  }

  /**
   * Generate JWT token
   */
  private generateToken(userId: string, email: string): string {
    return jwt.sign({ userId, email }, this.jwtSecret, { expiresIn: "24h" });
  }

  /**
   * Deactivate user account
   */
  async deactivateUser(userId: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error("User not found");
    }

    await this.userRepository.update(userId, { is_active: false });
    return { message: "User account deactivated successfully" };
  }

  /**
   * Activate user account
   */
  async activateUser(userId: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error("User not found");
    }

    await this.userRepository.update(userId, { is_active: true });
    return { message: "User account activated successfully" };
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updateData: { first_name?: string; last_name?: string; email?: string }
  ): Promise<Omit<User, "password_hash">> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error("User not found");
    }

    // If email is being updated, check if it's already taken
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateData.email },
      });
      if (existingUser) {
        throw new Error("Email is already taken");
      }
    }

    await this.userRepository.update(userId, updateData);

    const updatedUser = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (!updatedUser) {
      throw new Error("User not found after update");
    }

    const { password_hash: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Generate password reset token and send email
   */
  async forgotPassword(email: string): Promise<void> {
    // Find user by email
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if user exists or not for security
      return;
    }

    // Check if user is active
    if (!user.is_active) {
      return;
    }

    // Generate random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Set token expiration (1 hour from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Update user with reset token
    await this.userRepository.update(user.id, {
      reset_token: resetToken,
      reset_token_expires: expiresAt
    });

    // Send password reset email
    await emailService.sendPasswordResetEmail({
      email: user.email,
      firstName: user.first_name,
      resetToken
    });
  }

  /**
   * Generate password reset token (without sending email - for internal use)
   */
  async generatePasswordResetToken(email: string): Promise<string> {
    // Find user by email
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is active
    if (!user.is_active) {
      throw new Error("User account is inactive");
    }

    // Generate random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Set token expiration (1 hour from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Update user with reset token
    await this.userRepository.update(user.id, {
      reset_token: resetToken,
      reset_token_expires: expiresAt
    });

    return resetToken;
  }

  /**
   * Reset password using token
   */
  async resetPassword(resetData: ResetPasswordData): Promise<void> {
    const { token, newPassword } = resetData;

    // Find user by reset token
    const user = await this.userRepository.findOne({
      where: { reset_token: token }
    });

    if (!user) {
      throw new Error("Invalid or expired reset token");
    }

    // Check if token is expired
    if (!user.reset_token_expires || user.reset_token_expires < new Date()) {
      throw new Error("Reset token has expired");
    }

    // Validate new password
    if (newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters long");
    }

    // Hash new password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);

    // Update user password and clear reset token
    user.password_hash = password_hash;
    user.reset_token = null;
    user.reset_token_expires = null;
    await this.userRepository.save(user);
  }
}
