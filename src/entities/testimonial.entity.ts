import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('testimonials')
export class Testimonial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne('User', 'testimonials', { nullable: true })
  // The database schema uses the column name "userId" (see schema.sql).
  // Ensure the entity maps to that column to avoid "column does not exist" errors.
  @JoinColumn({ name: 'userId' })
  user: any | null;

  @Column({type: "int"})
  rating: number;

  @Column('text')
  text: string;

  @Column({ type: 'boolean', default: false })
  is_approved: boolean;

  @CreateDateColumn()
  created_at: Date;
}