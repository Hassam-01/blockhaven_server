import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("contacts")
export class Contact {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar", length: 100 })
    name!: string;

    @Column({ type: "varchar", length: 255 })
    email!: string;

    @Column({ type: "varchar", length: 20, nullable: true })
    phone?: string;

    @Column({ type: "varchar", length: 200, nullable: true })
    subject?: string;

    @Column({ type: "text" })
    message!: string;

    @CreateDateColumn()
    createdAt!: Date;
}