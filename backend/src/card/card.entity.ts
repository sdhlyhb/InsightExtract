import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Deck } from "../deck/deck.entity";

export enum CardType {
  QA = "qa",
  CLOZE = "cloze",
  TRUEFALSE = "truefalse",
}

@Entity("cards")
export class Card {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  deckId: string;

  @Column({
    type: "enum",
    enum: CardType,
  })
  type: CardType;

  @Column({ type: "text" })
  front: string;

  @Column({ type: "text" })
  back: string;

  @Column({ type: "jsonb", default: [] })
  citations: any[];

  @Column({ type: "simple-array", default: "" })
  tags: string[];

  // SM-2 algorithm fields
  @Column({ type: "float", default: 2.5 })
  ease: number;

  @Column({ type: "int", default: 0 })
  interval: number;

  @Column({ type: "int", default: 0 })
  repetition: number;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  dueDate: Date;

  @Column({ type: "timestamp", nullable: true })
  lastReviewedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Deck, (deck) => deck.cards, { onDelete: "CASCADE" })
  @JoinColumn({ name: "deckId" })
  deck: Deck;
}
