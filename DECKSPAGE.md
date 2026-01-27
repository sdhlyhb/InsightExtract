# **Fix `/decks/:docID` Page & Add Study Features**

**Role:**

You are a senior full‑stack engineer working in my repository. Update the **`/decks/:docID`** page so that it uses real flashcard data from the database (not mock data), adds a “View All Flashcards” experience, improves the card‑study UI, and allows filtering/selecting specific cards to study.

---

## **1. Context & Constraints**

- The current **“Study” button** on `/decks/:docID` uses **mock data**. Replace it with actual flashcards loaded from the database for the deck referenced by `:docID`.
- Decks and cards have already been created earlier in the workflow (e.g., flashcards generated from CSV on `/document/:docID`).
- **Do not modify** any summarization prompts (e.g., `llm.py`).
- Follow all styling conventions already used in the project.
- All logic must stay entirely inside our existing backend + React frontend environment—do **not** introduce unrelated architectural changes.

---

## **2. Required Functional Updates**

### **A) Replace mock data with real deck + cards**

1. On page load, fetch the deck by ID:

Response contains:

    ```
    GET /api/decks/:docID

    ```

    - deck metadata
    - list of associated flashcards

2. Replace all placeholder/mock card data with this real set of cards.
3. If no cards exist, show empty‑state UI:

   > “This deck has no flashcards yet.”

---

### **B) Add a “View All Flashcards” button**

This button should:

1. Render a new section (or navigate to a dedicated sub‑page modal) listing **all cards in the deck**.
2. Ensure:
   - **No duplicates** (dedupe by `front+back` or card ID).
   - Pagination or infinite scroll if deck is large.
   - Cards displayed in a simple grid or list with:
     - Clear **Front → Back** separation.
     - Improved styling for readability.

---

### **C) Add card filtering & selection controls**

Allow users to:

- Filter by:
  - Keyword search (matching front or back)
  - Tag/category if your model has these fields
- Select:
  - Individual flashcards (checkboxes)
  - “Select All / Deselect All”
    The selected set will be used in the Study mode (instead of the full deck).

---

### **D) Improve UI to differentiate Question vs Answer**

Apply visual improvements:

- Card front (question):
  - Larger bold font
  - “Q:” label or badge
  - Light background (e.g., subtle blue/gray tint)
- Card back (answer):
  - Slight contrast, e.g., soft yellow background
  - “A:” badge
  - Smaller but readable font
- Flip behavior (if used):
  - Smooth animation
  - Clear “Flip Card” button or gesture
- Accessibility:
  - Clear heading structure
  - High‑contrast text for WCAG compliance
  - Keyboard navigation support for studying

---

### **E) Update “Study” mode behavior**

The **Study** button should:

1. Use:
   - The **selected** cards (if user picked some), OR
   - All cards (if nothing is selected)
2. Enter the existing Study component/route (e.g. `/study?deck=<id>` or in‑page flow).
3. Show cards in randomized or ordered mode based on an existing toggle.
4. Support:
   - Flip card
   - Mark correct/incorrect
   - Progress indicators (“Card X of N”)

---

## **3. Data Layer Requirements**

### **Fetch deck + cards**

Use existing API:

```
GET /api/decks/:deckID

```

### **Optional: Add new API for filtering (if needed)**

Or do filtering client‑side when loading all cards.

### **Card model must include**

TypeScript

interface Flashcard {

id: string

deckId: string

front: string

back: string

createdAt: string

}

Show more lines

---

## **4. UI Structure for `/decks/:docID`**

### **Page Header**

- Deck Name
- Deck metadata (created date, card count)
- Buttons:
  - **Study** (primary)
  - **View All Flashcards** (secondary)

### **View All Flashcards Panel**

- Search input
- Filters (tags if available)
- Card list/grid
- Selection checkboxes
- Selected count
- “Study Selected” button

---

## **5. Acceptance Criteria (must pass)**

1. **Study button now uses real card data** from the deck instead of mock data.
2. **View All Flashcards button** opens a full list with no duplicates.
3. Users can **filter** and **select** flashcards before studying.
4. Card UI now clearly differentiates **question** vs **answer** visually.
5. Study mode uses **selected subset** of cards (or all if none selected).
6. Error handling:
   - If deck not found → show “Deck not found.”
   - If API fails → retry + error state
7. Works correctly with decks generated from CSV earlier.
8. All styling integrated with the existing design system.
9. No changes to existing LLM prompts or upstream summarization flow.

---

## **6. What to Avoid**

- Do **not** modify database schema unless absolutely required.
- Do **not** refactor unrelated components.
- Do **not** touch Step 1 / Step 2 logic on the homepage.
- Do **not** re‑implement flashcards storage; use existing Flashcard component flow.
