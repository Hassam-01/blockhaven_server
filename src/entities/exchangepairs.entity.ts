import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity("exchange_pairs")
@Unique("unique_pair", [
  "from_ticker",
  "from_network",
  "to_ticker",
  "to_network",
])
@Index("idx_pairs_from_ticker", ["from_ticker"])
@Index("idx_pairs_from_network", ["from_network"])
@Index("idx_pairs_to_ticker", ["to_ticker"])
@Index("idx_pairs_to_network", ["to_network"])
@Index("idx_pairs_active", ["is_active"])
@Index("idx_pairs_flow_standard", ["flow_standard"])
@Index("idx_pairs_flow_fixed", ["flow_fixed_rate"])
export class ExchangePairs {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ type: "varchar", length: 20 })
  from_ticker: string;
  @Column({ type: "varchar", length: 50 })
  from_network: string;
  @Column({ type: "varchar", length: 20 })
  to_ticker: string;
  @Column({ type: "varchar", length: 50 })
  to_network: string;
  @Column({ type: "boolean", default: false })
  flow_standard: boolean;
  @Column({ type: "boolean", default: false })
  flow_fixed_rate: boolean;
  @Column({ type: "boolean", default: true })
  is_active: boolean;
  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  created_at: Date;
  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updated_at: Date;
}
