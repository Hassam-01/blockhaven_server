import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('exchanges')
export class Exchange {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', unique: true })
    transactionId: string; // ChangeNow transaction ID

    @Column({ type: 'varchar' })
    fromCurrency: string;

    @Column({ type: 'varchar' })
    fromNetwork: string;

    @Column({ type: 'varchar' })
    toCurrency: string;

    @Column({ type: 'varchar' })
    toNetwork: string;

    @Column('decimal', { precision: 18, scale: 8 })
    fromAmount: number;

    @Column('decimal', { precision: 18, scale: 8, nullable: true })
    toAmount: number;

    @Column({ type: 'varchar' })
    payinAddress: string;

    @Column({ type: 'varchar' })
    payoutAddress: string;

    @Column({ type: 'varchar', nullable: true })
    payinExtraId: string | null;

    @Column({ type: 'varchar', nullable: true })
    payoutExtraId: string | null;

    @Column({ type: 'varchar', nullable: true })
    refundAddress: string | null;

    @Column({ type: 'varchar', nullable: true })
    refundExtraId: string | null;

    @Column({ type: 'enum', enum: ['standard', 'fixed-rate'], default: 'standard' })
    flow: 'standard' | 'fixed-rate';

    @Column({ type: 'enum', enum: ['direct', 'reverse'], default: 'direct' })
    type: 'direct' | 'reverse';

    @Column({ type: 'varchar', nullable: true })
    rateId: string | null;

    @Column({ type: 'varchar', nullable: true })
    userId: string | null;

    @Column('jsonb', { nullable: true })
    payload: Record<string, any> | null;

    @Column({ type: 'varchar', nullable: true })
    contactEmail: string | null;

    @Column({ 
        type: 'enum', 
        enum: ['waiting', 'confirming', 'exchanging', 'sending', 'finished', 'failed', 'refunded', 'verifying'], 
        default: 'waiting' 
    })
    status: 'waiting' | 'confirming' | 'exchanging' | 'sending' | 'finished' | 'failed' | 'refunded' | 'verifying';

    @Column({ type: 'varchar', nullable: true })
    payoutExtraIdName: string | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}