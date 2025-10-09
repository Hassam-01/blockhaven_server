import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar' })
  password_hash: string;

  @Column({ type: 'varchar' })
  first_name: string;

  @Column({ type: 'varchar' })
  last_name: string;

  @Column({ type: 'enum', enum: ['admin', 'customer'], default: 'customer' })
  user_type: 'admin' | 'customer';

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'varchar', nullable: true })
  reset_token: string | null;

  @Column({ type: 'timestamp', nullable: true })
  reset_token_expires: Date | null;

  @Column({ type: 'varchar', nullable: true })
  two_factor_code: string | null;

  @Column({ type: 'timestamp', nullable: true })
  two_factor_expires: Date | null;

  @Column({ type: 'boolean', default: false })
  two_factor_enabled: boolean;

  @Column({ type: 'varchar', nullable: true })
  pending_login_token: string | null;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany('Testimonial', 'user')
  testimonials: any[];
}