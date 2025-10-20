import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('testimonials')
export class Testimonial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne('User', 'testimonials', { nullable: true })
  @JoinColumn({ name: 'user_id' })
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