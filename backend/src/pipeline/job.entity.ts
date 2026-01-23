import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export enum JobType {
  EXTRACT = "extract",
  EMBED = "embed",
  SUMMARIZE = "summarize",
  CARDS = "cards",
}

export enum JobStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
}

@Entity("jobs")
export class Job {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  documentId: string;

  @Column({
    type: "enum",
    enum: JobType,
  })
  type: JobType;

  @Column({
    type: "enum",
    enum: JobStatus,
    default: JobStatus.PENDING,
  })
  status: JobStatus;

  @Column({ type: "int", default: 0 })
  progress: number;

  @Column({ type: "text", nullable: true })
  message: string;

  @Column({ type: "jsonb", nullable: true })
  result: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: "timestamp", nullable: true })
  completedAt: Date;
}
