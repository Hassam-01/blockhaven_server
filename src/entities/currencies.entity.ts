import { Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";
import { Index } from "typeorm";

@Unique("unique_currency", ["ticker", "network"])
@Entity("currencies")
@Index("idx_currencies_ticker", ["ticker"])
@Index("idx_currencies_network", ["network"])
@Index("idx_currencies_active", ["is_active"])
@Index("idx_currencies_featured", ["featured"])
@Index("idx_currencies_ticker_network", ["ticker", "network"])
export class Currencies {
  @PrimaryGeneratedColumn()
  id!: number;
  @Column({ type: "varchar", length: 20 })
  ticker!: string;
  @Column({ type: "varchar", length: 100 })
  name!: string;
  @Column({ type: "text", nullable: true })
  image_url!: string;
  @Column({ type: "boolean", default: false })
  has_external_id!: boolean;
  @Column({ type: "boolean", default: false })
  is_extra_id_supported!: boolean;
  @Column({ type: "boolean", default: false })
  is_fiat!: boolean;
  @Column({ type: "boolean", default: false })
  featured!: boolean;
  @Column({ type: "boolean", default: false })
  is_stable!: boolean;
  @Column({ type: "boolean", default: false })
  support_fixed_rate!: boolean;
  @Column({ type: "varchar", length: 50 })
  network!: string;
  @Column({ type: "text", nullable: true })
  token_contract!: string;
  @Column({ type: "boolean", default: true })
  buy_enabled!: boolean;
  @Column({ type: "boolean", default: true })
  sell_enabled!: boolean;
  @Column({ type: "varchar", length: 20, nullable: true })
  legacy_ticker!: string;
  @Column({ type: "boolean", default: true })
  is_active!: boolean;
  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  created_at!: Date;
  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updated_at!: Date;
}
