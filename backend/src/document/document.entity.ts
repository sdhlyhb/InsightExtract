import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Deck } from "../deck/deck.entity";

export enum DocumentStatus {
  UPLOADED = "uploaded",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

export enum DocumentSourceType {
  PDF = "pdf",
  TEXT = "text",
  URL = "url",
}

@Entity("documents")
export class Document {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  title: string;

  @Column({
    type: "enum",
    enum: DocumentSourceType,
  })
  sourceType: DocumentSourceType;

  @Column({
    type: "enum",
    enum: DocumentStatus,
    default: DocumentStatus.UPLOADED,
  })
  status: DocumentStatus;

  @Column({ type: "text", nullable: true })
  rawText: string;

  @Column({ type: "jsonb", nullable: true })
  outline: any;

  @Column({ type: "jsonb", nullable: true })
  mainPoints: string[];

  @Column({ type: "jsonb", nullable: true })
  citations: any[];

  @Column({ nullable: true })
  pageCount: number;

  @Column({ nullable: true })
  fileSize: number;

  @Column({ nullable: true })
  fileHash: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Deck, (deck) => deck.document)
  decks: Deck[];
}
