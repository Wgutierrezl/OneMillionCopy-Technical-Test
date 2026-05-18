import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LeadSource } from '../enums/lead-source.enum';

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  nombre: string;

  @Column({ type: 'varchar', length: 180, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  telefono?: string | null;

  @Column({ type: 'enum', enum: LeadSource })
  fuente: LeadSource;

  @Column({ type: 'varchar', length: 180, nullable: true })
  producto_interes?: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  presupuesto?: number | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deleted_at?: Date | null;
}
