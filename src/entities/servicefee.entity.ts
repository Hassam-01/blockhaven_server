import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('service_fees')
export class ServiceFee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ['fixed-rate', 'floating'] })
  type: 'fixed-rate' | 'floating';

  @Column('decimal', { precision: 10, scale: 2 })
  fee: number;

  @CreateDateColumn()
  created_at: Date;
}