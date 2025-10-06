import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';

@Entity('testimonials')
export class Testimonial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne('User', 'testimonials')
  user: any;

  @Column({type: "int"})
  rating: number;

  @Column('text')
  text: string;

  @Column({ type: 'boolean', default: false })
  is_approved: boolean;

  @CreateDateColumn()
  created_at: Date;
}