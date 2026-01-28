/**
 * Build flashcards CSV from Step 2 analysis results
 * No LLM calls - purely deterministic transformation
 */

export interface Step2Result {
  summary?: string;
  main_points?: Array<{
    point: string;
    explanation?: string;
  }>;
  key_terms?: Array<{
    term: string;
    definition: string;
  }>;
  outline?: {
    title?: string;
    sections?: Array<{
      title: string;
      level?: number;
      children?: Array<{ title: string }>;
    }>;
  };
  sourceFile?: {
    originalName: string;
    hash?: string;
  };
}

export interface FlashCard {
  front: string;
  back: string;
}

export interface FlashcardsCSVResult {
  cards: FlashCard[];
  csv: string;
}

/**
 * Normalize text for CSV: replace commas with semicolons, strip newlines, limit length
 */
function normalizeForCSV(text: string, maxLength: number = 160): string {
  return text
    .trim()
    .replace(/,/g, ";")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .substring(0, maxLength);
}

/**
 * Build flashcards CSV from Step 2 results
 */
export function buildFlashcardsCSV(step2: Step2Result): FlashcardsCSVResult {
  const cards: FlashCard[] = [];
  const seen = new Set<string>();

  // Helper to add card with deduplication
  const addCard = (front: string, back: string) => {
    const normalizedFront = normalizeForCSV(front, 200);
    const normalizedBack = normalizeForCSV(back, 160);

    if (!normalizedFront || !normalizedBack) return;

    // Deduplication key
    const key = `${normalizedFront}|${normalizedBack}`.toLowerCase();
    if (seen.has(key)) return;

    seen.add(key);
    cards.push({ front: normalizedFront, back: normalizedBack });
  };

  // 1. Key Terms (highest priority)
  if (step2.key_terms && step2.key_terms.length > 0) {
    step2.key_terms.forEach((term) => {
      addCard(`What is ${term.term}?`, term.definition);

      // Reverse card for important terms
      if (term.definition.length < 80) {
        addCard(`Define: ${term.term}`, term.definition);
      }
    });
  }

  // 2. Main Points
  if (step2.main_points && step2.main_points.length > 0) {
    step2.main_points.forEach((point) => {
      // Extract subject from the point
      const firstSentence = point.point.split(/[.!?]/)[0];
      const subject =
        firstSentence && firstSentence.length > 60
          ? "this topic"
          : firstSentence?.substring(0, 30) || "this topic";

      addCard(
        `What's the key point about ${subject}?`,
        point.explanation || point.point,
      );

      // Why card if there's an explanation
      if (point.explanation && point.explanation !== point.point) {
        addCard(`Why does ${subject} matter?`, point.explanation);
      }
    });
  }

  // 3. Outline (structural understanding)
  if (step2.outline && step2.outline.sections) {
    step2.outline.sections.forEach((section) => {
      if (section.title) {
        const childSummary =
          section.children && section.children.length > 0
            ? section.children.map((c) => c.title).join("; ")
            : "Key section in the document structure";

        addCard(`What does "${section.title}" cover?`, childSummary);
      }

      // Create cards from children
      if (section.children && section.children.length > 0) {
        section.children.slice(0, 3).forEach((child) => {
          if (child.title && child.title.length > 10) {
            addCard(
              `Explain: ${child.title}`,
              `This is a key subtopic under ${section.title}`,
            );
          }
        });
      }
    });
  }

  // Limit to 15-40 cards
  const finalCards = cards.slice(0, 40);

  // Generate CSV (no quotes around fields)
  const csvRows = finalCards.map((card) => `${card.front},${card.back}`);
  const csv = `Front,Back\n${csvRows.join("\n")}`;

  return { cards: finalCards, csv };
}
