import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { Document } from "../document/document.entity";
import { Card } from "../card/card.entity";

@Entity("decks")
export class Deck {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  documentId: string;

  @Column()
  title: string;

  @Column({ type: "simple-array", default: "" })
  tags: string[];

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Document, (document) => document.decks, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "documentId" })
  document: Document;

  @OneToMany(() => Card, (card) => card.deck)
  cards: Card[];
}
